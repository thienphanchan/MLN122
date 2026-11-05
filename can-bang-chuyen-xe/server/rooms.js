import { randomBytes, randomInt, randomUUID } from 'node:crypto';
import { confirm, createInitialState, next, restoreState, start, toSaved } from '../src/game/state.js';
import { QUESTIONS } from '../src/room/questions.js';
import { gradeQuiz, reviewQuiz } from './quiz.js';

const token = () => randomBytes(32).toString('hex');
const nameKey = (name) => name.normalize('NFC').toLocaleLowerCase('vi');
function requireRequestId(id) {
  if (typeof id !== 'string' || id.length < 8 || id.length > 100) throw new Error('Mã yêu cầu không hợp lệ.');
}
function normalizeCode(code) {
  if (typeof code !== 'string' || !/^[A-Z0-9]{6}$/i.test(code.trim())) throw new Error('Mã phòng cần có 6 ký tự.');
  return code.trim().toUpperCase();
}
function compare(a, b) { return b.wins - a.wins || b.total - a.total || (b.quizScore ?? 0) - (a.quizScore ?? 0); }

export async function createRoomService({ repository, now = Date.now, maxPlayers = 100, ttlMs = 86400000 }) {
  let data = await repository.load();
  let queue = Promise.resolve();
  const connections = new Map();
  const sharedPresence = new Map();
  const listeners = new Set();
  function validPlayer(player) {
    if (!player || typeof player.id !== 'string' || typeof player.token !== 'string' || typeof player.name !== 'string'
      || player.name.length < 1 || player.name.length > 40 || !restoreState(player.saved)) return false;
    if (player.quizAnswers === null) return true;
    try { gradeQuiz(player.quizAnswers); return player.saved.screen === 'end'; } catch { return false; }
  }
  for (const [code, room] of Object.entries(data.rooms)) {
    if (!room || !Array.isArray(room.players) || !Array.isArray(room.requests)
      || !['lobby', 'playing', 'finished'].includes(room.status) || typeof room.hostToken !== 'string'
      || room.code !== code || !/^[A-Z0-9]{6}$/.test(code)
      || !Number.isFinite(room.updatedAt) || room.players.some((player) => !validPlayer(player))) {
      throw new Error('Kho phòng bị hỏng. Hãy khôi phục bản sao lưu trước khi chạy lại máy chủ.');
    }
  }

  const emit = () => listeners.forEach((listener) => listener());
  function roomFor(store, code) {
    const room = store.rooms[normalizeCode(code)];
    if (!room) throw new Error('Không tìm thấy phòng. Kiểm tra lại mã hoặc liên kết tham gia.');
    if (now() - room.updatedAt >= ttlMs) throw new Error('Phòng đã hết hạn. Hãy nhờ chủ phòng tạo phòng mới.');
    return room;
  }
  function authorize(store, session) {
    if (!session || typeof session.token !== 'string') throw new Error('Phiên tham gia không hợp lệ.');
    const room = roomFor(store, session.code);
    const host = session.token === room.hostToken;
    const player = host ? null : room.players.find((entry) => entry.token === session.token);
    if (!host && !player) throw new Error('Không tìm thấy phiên tham gia. Hãy tham gia lại bằng mã phòng.');
    return { room, host, player };
  }
  function transaction(change) {
    const result = queue.then(async () => {
      if (repository.transact) {
        const committed = await repository.transact(change);
        data = committed.data;
        emit();
        return committed.result;
      }
      const draft = structuredClone(data);
      const result = change(draft);
      await repository.save(draft);
      data = draft;
      emit();
      return result;
    });
    queue = result.catch(() => {});
    return result;
  }
  function isConnected(code, secret) {
    if (repository.getPresence) return sharedPresence.get(code)?.has(secret) ?? false;
    return (connections.get(`${code}:${secret}`)?.size ?? 0) > 0;
  }

  function refresh(sessions = []) {
    const result = queue.then(async () => {
      data = await repository.load();
      if (repository.getPresence) {
        const codes = [...new Set(sessions.map((session) => session.code))];
        await Promise.all(codes.map(async (code) => { sharedPresence.set(code, new Set(await repository.getPresence(code))); }));
      }
      emit();
    });
    queue = result.catch(() => {});
    return result;
  }

  return {
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    refresh,
    setConnected(session, connectionId, connected) {
      authorize(data, session);
      if (repository.setPresence) return repository.setPresence(session, connectionId, connected).then(() => refresh([session]));
      const key = `${session.code}:${session.token}`;
      const ids = connections.get(key) ?? new Set();
      if (connected) ids.add(connectionId); else ids.delete(connectionId);
      if (ids.size) connections.set(key, ids); else connections.delete(key);
      emit();
    },
    async create(requestId) {
      requireRequestId(requestId);
      return transaction((draft) => {
        for (const [code, room] of Object.entries(draft.rooms)) {
          if (now() - room.updatedAt >= ttlMs) delete draft.rooms[code];
          else if (room.createRequestId === requestId) return { code, token: room.hostToken };
        }
        if (Object.keys(draft.rooms).length >= 1000) throw new Error('Máy chủ đang có quá nhiều phòng. Hãy thử lại sau.');
        let code;
        const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        do { code = Array.from({ length: 6 }, () => alphabet[randomInt(alphabet.length)]).join(''); } while (draft.rooms[code]);
        const hostToken = token();
        draft.rooms[code] = { code, hostToken, createRequestId: requestId, status: 'lobby', createdAt: now(), updatedAt: now(), players: [], requests: [] };
        return { code, token: hostToken };
      });
    },
    async join(code, name, requestId) {
      requireRequestId(requestId);
      if (typeof name !== 'string') throw new Error('Hãy nhập tên của bạn.');
      name = name.trim().normalize('NFC');
      if (name.length < 1 || name.length > 40 || /[\u0000-\u001f\u007f]/.test(name)) throw new Error('Tên cần có từ 1 đến 40 ký tự hợp lệ.');
      return transaction((draft) => {
        const room = roomFor(draft, code);
        const existing = room.players.find((player) => player.joinRequestId === requestId);
        if (existing) return { code: room.code, token: existing.token };
        if (room.status !== 'lobby') throw new Error('Phòng đã bắt đầu hoặc kết thúc, không nhận thêm người chơi.');
        if (room.players.some((player) => nameKey(player.name) === nameKey(name))) throw new Error('Tên này đã được dùng trong phòng. Hãy chọn tên khác.');
        if (room.players.length >= maxPlayers) throw new Error('Phòng đã đầy. Hãy nhờ chủ phòng tạo phòng khác.');
        const player = { id: randomUUID(), token: token(), joinRequestId: requestId, name, saved: toSaved(createInitialState()), quizAnswers: null };
        room.players.push(player);
        room.updatedAt = now();
        return { code: room.code, token: player.token };
      });
    },
    async command(session, action, payload = {}) {
      requireRequestId(payload.requestId);
      return transaction((draft) => {
        const { room, host, player } = authorize(draft, session);
        const requestKey = `${session.token}:${payload.requestId}`;
        if (room.requests.includes(requestKey)) return;
        if (room.status === 'finished') throw new Error('Phòng đã kết thúc. Bạn có thể xem kết quả.');
        if (action === 'start' || action === 'finish') {
          if (!host) throw new Error('Chỉ chủ phòng được thực hiện thao tác này.');
          if (action === 'start') {
            if (room.status !== 'lobby' || !room.players.length) throw new Error('Cần có người tham gia và phòng chưa bắt đầu.');
            room.status = 'playing';
            room.players.forEach((entry) => { entry.saved = toSaved(start(createInitialState())); });
          } else {
            if (room.status !== 'playing') throw new Error('Hãy bắt đầu phòng trước khi kết thúc.');
            room.status = 'finished';
          }
        } else {
          if (!player || room.status !== 'playing') throw new Error('Chỉ người chơi trong phòng đang diễn ra mới được gửi lựa chọn.');
          let game = restoreState(player.saved);
          if (action === 'confirm') {
            if (game.screen !== 'play' || game.result || payload.round !== game.round
              || !Number.isInteger(payload.commission) || payload.commission < 15 || payload.commission > 40
              || typeof payload.floor !== 'boolean' || typeof payload.dialogue !== 'boolean') throw new Error('Quyết định không hợp lệ hoặc ngày này đã được chốt. Hãy đồng bộ lại.');
            game = confirm({ ...game, commission: payload.commission, floor: payload.floor, dialogue: payload.dialogue });
          } else if (action === 'next') {
            if (game.screen !== 'play' || !game.result || payload.round !== game.round) throw new Error('Hãy chốt đúng ngày hiện tại trước khi tiếp tục.');
            game = next(game);
          } else if (action === 'quiz') {
            if (game.screen !== 'end' || player.quizAnswers) throw new Error('Chỉ nộp trắc nghiệm một lần sau khi hoàn thành 5 ngày.');
            gradeQuiz(payload.answers);
            player.quizAnswers = [...payload.answers];
          } else throw new Error('Thao tác không được hỗ trợ.');
          player.saved = toSaved(game);
          if (room.players.every((entry) => entry.quizAnswers !== null)) room.status = 'finished';
        }
        room.updatedAt = now();
        room.requests.push(requestKey);
      });
    },
    view(session) {
      const { room, host, player } = authorize(data, session);
      const players = room.players.map((entry) => {
        const game = restoreState(entry.saved);
        return {
          id: entry.id, name: entry.name, round: game.round, completedDays: game.history.length,
          wins: game.history.filter((day) => day.allGreen).length,
          total: game.history.reduce((sum, day) => sum + Object.values(day.scores).reduce((a, b) => a + b, 0), 0),
          quizScore: entry.quizAnswers ? gradeQuiz(entry.quizAnswers) : room.status === 'finished' ? 0 : null,
          quizSubmitted: entry.quizAnswers !== null,
          stage: entry.quizAnswers ? 'submitted' : game.screen === 'end' ? 'quiz' : game.screen,
          connected: isConnected(room.code, entry.token),
        };
      }).sort(compare);
      players.forEach((entry, index) => { entry.rank = index && compare(entry, players[index - 1]) === 0 ? players[index - 1].rank : index + 1; });
      const self = player ? {
        id: player.id, name: player.name, game: restoreState(player.saved),
        quizSubmitted: player.quizAnswers !== null,
        quizScore: player.quizAnswers ? gradeQuiz(player.quizAnswers) : room.status === 'finished' ? 0 : null,
        ...(room.status === 'finished' ? { review: reviewQuiz(player.quizAnswers) } : {}),
      } : null;
      return { code: room.code, role: host ? 'host' : 'player', status: room.status,
        createdAt: room.createdAt, expiresAt: room.updatedAt + ttlMs, hostConnected: isConnected(room.code, room.hostToken),
        maxPlayers, players, self, questions: QUESTIONS };
    },
  };
}
