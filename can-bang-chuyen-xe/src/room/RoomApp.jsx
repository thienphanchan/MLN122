import { useEffect, useRef, useState } from 'react';
import { Play } from '../ui/Play.jsx';
import { End } from '../ui/End.jsx';
import { Quiz, QuizReview } from './Quiz.jsx';
import { RoomInvite } from './RoomLobby.jsx';
import { Scoreboard } from './Scoreboard.jsx';
import { useRoom } from './useRoom.js';
import './rooms.css';

function JoinForm({ hash, connected, pending, send }) {
  const invited = hash.split('/')[1];
  const [code, setCode] = useState(invited && invited !== 'tao' ? invited : '');
  const [name, setName] = useState('');
  useEffect(() => { setCode(invited && invited !== 'tao' ? invited : ''); }, [invited]);
  return (
    <section className="room-join" aria-labelledby="screen-title">
      <div className="room-heading"><h1 id="screen-title" tabIndex={-1}>Tham gia phòng</h1><p>Dùng mã trên màn hình chủ phòng. Bạn có thể tham gia bằng điện thoại hoặc máy tính.</p></div>
      <form onSubmit={(event) => { event.preventDefault(); send('join', { code: code.trim().toUpperCase(), name: name.trim() }); }}>
        <div className="room-field"><label htmlFor="room-code-input">Mã phòng</label><input id="room-code-input" autoCapitalize="characters" autoComplete="off" spellCheck="false" value={code} maxLength={6} minLength={6} pattern="[A-Za-z0-9]{6}" required onChange={(e) => setCode(e.target.value.toUpperCase())} aria-describedby="room-code-help" /><p id="room-code-help">Mã gồm 6 ký tự được chủ phòng cung cấp.</p></div>
        <div className="room-field"><label htmlFor="player-name">Tên hiển thị</label><input id="player-name" autoComplete="nickname" value={name} maxLength={40} required onChange={(e) => setName(e.target.value)} /></div>
        <button type="submit" className="btn btn--primary btn--large" disabled={!connected || pending || !name.trim() || code.trim().length !== 6}>{pending ? 'Đang tham gia…' : 'Vào phòng'}</button>
      </form>
    </section>
  );
}

function RoomPlay({ game, disabled, send, announce, draftKey }) {
  const [draft, setDraft] = useState(() => {
    try {
      const value = JSON.parse(sessionStorage.getItem(draftKey));
      if (value && Number.isInteger(value.commission) && value.commission >= 15 && value.commission <= 40 && typeof value.floor === 'boolean' && typeof value.dialogue === 'boolean') return value;
    } catch { /* Vẫn chơi được khi trình duyệt chặn lưu. */ }
    return { commission: game.commission, floor: game.floor, dialogue: game.dialogue };
  });
  function update(change) {
    setDraft((previous) => {
      const next = change(previous);
      try { sessionStorage.setItem(draftKey, JSON.stringify(next)); } catch { /* Giữ lựa chọn trong bộ nhớ. */ }
      return next;
    });
  }
  const actions = {
    setCommission: (commission) => update((previous) => ({ ...previous, commission: Number(commission) })),
    toggleFloor: () => update((previous) => ({ ...previous, floor: !previous.floor })),
    toggleDialogue: () => update((previous) => ({ ...previous, dialogue: !previous.dialogue })),
    confirm: () => send('confirm', { ...draft, round: game.round }),
    next: () => send('next', { round: game.round }),
  };
  return <Play game={game.result ? game : { ...game, ...draft }} actions={actions} announce={announce} disabled={disabled} finalActionLabel="Làm trắc nghiệm" />;
}

export function RoomApp({ hash, announce }) {
  const { session, view, connected, pending, error, storageOk, send } = useRoom(hash);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const disabled = !connected || pending;
  const host = view?.role === 'host';
  const self = view?.self;
  const finished = view?.status === 'finished';
  const creating = hash === '#phong/tao' && !view;
  const screenKey = view ? `${view.role}:${view.status}:${self?.game.screen}:${self?.game.round}:${self?.quizSubmitted}` : hash;
  const previousScreen = useRef(screenKey);
  useEffect(() => {
    if (previousScreen.current === screenKey) return;
    previousScreen.current = screenKey;
    window.scrollTo({ top: 0 });
    document.getElementById('screen-title')?.focus({ preventScroll: true });
  }, [screenKey]);
  return (
    <div className="room-shell">
      <div className="room-toolbar">
        <a href="#" className="room-text-button">Về trang đầu</a>
        <p role="status" className={connected ? 'room-connection' : 'room-connection room-connection--offline'}>{connected ? pending ? 'Đang lưu…' : 'Đã kết nối máy chủ' : 'Đang kết nối lại…'}</p>
        {view && <span className="room-identity">Phòng <strong>{view.code}</strong>{self ? ` · ${self.name}` : ' · Chủ phòng'}</span>}
      </div>
      {error && <div className="room-error" role="alert"><p>{error}</p>{creating && <button className="btn btn--secondary" disabled={disabled} onClick={() => send('create')}>Thử tạo lại</button>}{session && !view && <button className="btn btn--secondary" onClick={() => { try { sessionStorage.removeItem('cbcx:room:session'); } catch { /* Không lưu được. */ } location.hash = `#tham-gia/${session.code}`; location.reload(); }}>Nhập lại tên để tham gia</button>}</div>}
      {!storageOk && <p className="room-inline-warning" role="status">Trình duyệt đang chặn lưu phiên. Giữ tab này mở để không mất quyền truy cập phòng khi tải lại.</p>}
      {creating ? (
        <div className="room-heading"><h1 id="screen-title" tabIndex={-1}>Đang tạo phòng…</h1><p>Mã QR và liên kết sẽ xuất hiện khi máy chủ tạo phòng xong.</p></div>
      ) : !view ? (
        session ? <p role="status">Đang khôi phục phòng và tiến độ của bạn…</p> : <JoinForm hash={hash} connected={connected} pending={pending} send={send} />
      ) : host ? (
        <>
          <div className="room-heading"><h1 id="screen-title" tabIndex={-1}>{finished ? 'Kết quả phòng' : view.status === 'lobby' ? 'Mời cả lớp vào phòng' : 'Theo dõi hành trình của cả lớp'}</h1><p>{finished ? 'Phòng đã kết thúc. Điểm và đáp án đã được công bố cho người chơi.' : view.status === 'lobby' ? 'Chiếu mã QR, chờ mọi người nhập tên rồi bắt đầu.' : 'Điểm cập nhật ngay sau mỗi quyết định đã chốt và mỗi bài trắc nghiệm đã nộp.'}</p></div>
          <div className={`room-host-grid ${view.status !== 'lobby' ? 'room-host-grid--active' : ''}`}>
            <RoomInvite code={view.code} status={view.status} />
            <div className="room-host-main">
              <Scoreboard view={view} title={finished ? 'Bảng xếp hạng cuối cùng' : 'Bảng điểm trực tiếp'} />
              {view.status === 'lobby' && <div className="room-host-actions"><button className="btn btn--primary btn--large" disabled={disabled || !view.players.length} onClick={() => send('start')}>Bắt đầu phòng</button><p>Đã bắt đầu sẽ không nhận thêm người mới. Mỗi người tự chơi đủ 5 ngày trên thiết bị của mình.</p></div>}
              {view.status === 'playing' && <div className="room-host-actions">{confirmEnd ? <div className="room-confirm" role="group" aria-label="Xác nhận kết thúc sớm"><p>Còn {view.players.filter((player) => !player.quizSubmitted).length} người chưa nộp bài. Kết thúc sẽ giữ điểm đã chốt; trắc nghiệm chưa nộp nhận 0 điểm.</p><div className="actions"><button className="btn btn--danger" disabled={disabled} onClick={() => send('finish')}>Xác nhận kết thúc</button><button className="btn btn--secondary" onClick={() => setConfirmEnd(false)}>Tiếp tục chờ</button></div></div> : <button className="btn btn--secondary" disabled={disabled} onClick={() => setConfirmEnd(true)}>Kết thúc sớm</button>}</div>}
            </div>
          </div>
        </>
      ) : view.status === 'lobby' ? (
        <section className="room-wait" aria-labelledby="screen-title"><h1 id="screen-title" tabIndex={-1}>Chờ chủ phòng bắt đầu</h1><p>Bạn đã vào phòng với tên <strong>{self.name}</strong>. Khi chủ phòng bắt đầu, ngày 1 sẽ tự xuất hiện trên thiết bị của bạn.</p><p>{view.players.length} người đã tham gia · {view.hostConnected ? 'Chủ phòng đang kết nối' : 'Chủ phòng đang kết nối lại'}</p><ul className="room-wait-names" aria-label="Người đang chờ">{view.players.map((player) => <li key={player.id}>{player.name}</li>)}</ul></section>
      ) : finished || self.quizSubmitted ? (
        <>
          <section className="room-result" aria-labelledby="screen-title"><h1 id="screen-title" tabIndex={-1}>{finished ? 'Kết quả của bạn' : 'Đã nộp bài trắc nghiệm'}</h1><p className="room-quiz-score">{self.quizScore}/50 điểm</p><p>{finished ? 'Điểm trắc nghiệm được hiển thị riêng với kết quả điều phối 5 ngày.' : 'Đã lưu bài của bạn. Đáp án và giải thích sẽ mở khi tất cả nộp bài hoặc chủ phòng kết thúc.'}</p></section>
          <Scoreboard view={view} title={finished ? 'Bảng xếp hạng cuối cùng' : 'Tiến độ của cả lớp'} />
          {finished && <QuizReview review={self.review} />}
          {self.game.screen === 'end' && <><button className="btn btn--secondary room-summary-toggle" aria-expanded={showSummary} onClick={() => setShowSummary((value) => !value)}>Xem lại tổng kết 5 ngày</button>{showSummary && <End embedded game={self.game} data={{ games: [], best: null }} />}</>}
        </>
      ) : self.game.screen === 'end' ? (
        <Quiz questions={view.questions} storageKey={`cbcx:quiz:${view.code}:${self.id}`} disabled={disabled} onSubmit={(answers) => send('quiz', { answers })} />
      ) : (
        <RoomPlay key={self.game.round} game={self.game} disabled={disabled} send={send} announce={announce} draftKey={`cbcx:draft:${view.code}:${self.id}:${self.game.round}`} />
      )}
    </div>
  );
}
