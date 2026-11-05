import { createServer } from 'node:http';
import { networkInterfaces } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { Server } from 'socket.io';
import { createFileRepository } from './repository.js';
import { createRoomService } from './rooms.js';
import { roomDataPath } from './config.js';
import { createRedisRepository } from './redis-repository.js';
import { redisOptions } from './hosted-config.js';
import { randomUUID } from 'node:crypto';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function publicOrigin(value) {
  if (!value) return null;
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('PUBLIC_ORIGIN phải là địa chỉ http(s) không có đường dẫn, mật khẩu hoặc tham số.');
  }
  return url.origin;
}

export async function createGameServer({
  repository,
  hosted = process.env.VERCEL === '1',
  serveStatic = !hosted,
  origin = process.env.PUBLIC_ORIGIN,
  maxPlayers = Number(process.env.MAX_PLAYERS || 100),
  ttlMs = Number(process.env.ROOM_TTL_HOURS || 24) * 3600000,
} = {}) {
  if (!Number.isInteger(maxPlayers) || maxPlayers < 1 || maxPlayers > 1000 || !Number.isFinite(ttlMs) || ttlMs <= 0) {
    throw new Error('MAX_PLAYERS và ROOM_TTL_HOURS phải là số dương hợp lệ.');
  }
  const configuredOrigin = publicOrigin(origin);
  repository ??= hosted || process.env.REDIS_URL || process.env.KV_URL
    ? await createRedisRepository(redisOptions())
    : createFileRepository(roomDataPath(process.env.ROOM_DATA_FILE || 'data/rooms.json', projectRoot));
  let service;
  try { service = await createRoomService({ repository, maxPlayers, ttlMs }); }
  catch (error) { await repository.close?.(); throw error; }
  const instanceId = randomUUID();
  let closing = false;
  const app = express();
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Referrer-Policy', 'same-origin');
    next();
  });
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    path: hosted ? '/api/rooms' : '/socket.io',
    addTrailingSlash: false,
    ...(hosted ? { transports: ['websocket'] } : {}),
    maxHttpBufferSize: 16384,
    allowRequest(req, callback) {
      if (!req.headers.origin) return callback(null, true);
      try {
        const incoming = new URL(req.headers.origin);
        const requestHost = new URL(`http://${req.headers.host}`).hostname;
        callback(null, incoming.origin === configuredOrigin || incoming.hostname === requestHost);
      } catch { callback(null, false); }
    },
  });

  app.get('/api/health', async (req, res) => {
    try { await repository.load(); res.set('Cache-Control', 'no-store').json({ ok: true, storage: repository.transact ? 'redis' : 'file' }); }
    catch { res.status(503).set('Cache-Control', 'no-store').json({ ok: false, code: 'ROOM_STORAGE_UNAVAILABLE' }); }
  });
  app.get('/api/config', (req, res) => {
    const port = httpServer.address()?.port;
    const lanOrigins = Object.values(networkInterfaces()).flat().filter((entry) => entry.family === 'IPv4' && !entry.internal)
      .map((entry) => `http://${entry.address}:${port}`);
    res.set('Cache-Control', 'no-store').json({ publicOrigin: configuredOrigin, lanOrigins: hosted ? [] : lanOrigins,
      socket: { path: hosted ? '/api/rooms' : '/socket.io', addTrailingSlash: false, transports: hosted ? ['websocket'] : ['polling', 'websocket'] } });
  });
  if (serveStatic) app.use(express.static(resolve(projectRoot, 'dist'), { dotfiles: 'deny' }));
  app.use((req, res) => res.status(404).json({ error: 'Không tìm thấy trang.' }));

  const limits = new Map();
  function rateLimit(key, maximum) {
    const now = Date.now();
    if (limits.size > 5000) for (const [entry, value] of limits) if (value.until <= now) limits.delete(entry);
    const bucket = limits.get(key);
    if (!bucket || bucket.until <= now) { limits.set(key, { count: 1, until: now + 60000 }); return; }
    if (++bucket.count > maximum) throw new Error('Bạn thao tác quá nhanh. Hãy đợi một phút rồi thử lại.');
  }
  const unsubscribe = service.subscribe(() => {
    for (const socket of io.sockets.sockets.values()) {
      if (!socket.data.session) continue;
      try { socket.emit('room:view', service.view(socket.data.session)); }
      catch (error) { socket.emit('room:error', error.message); }
    }
  });
  const sessions = () => [...io.sockets.sockets.values()].flatMap((socket) => socket.data.session ? [socket.data.session] : []);
  let unsubscribeRepository;
  try { unsubscribeRepository = repository.subscribe ? await repository.subscribe(() => service.refresh(sessions())) : null; }
  catch (error) {
    unsubscribe();
    await new Promise((resolve) => io.close(resolve));
    await repository.close?.();
    throw error;
  }
  async function attach(socket, session) {
    if (socket.data.session) await service.setConnected(socket.data.session, `${instanceId}:${socket.id}`, false);
    socket.data.session = session;
    await service.setConnected(session, `${instanceId}:${socket.id}`, true);
  }
  io.on('connection', (socket) => {
    for (const event of ['room:create', 'room:join', 'room:resume', 'room:command']) {
      socket.on(event, async (payload, ack) => {
        if (typeof ack !== 'function') return;
        try {
          if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('Yêu cầu không hợp lệ.');
          rateLimit(`socket:${socket.id}`, 120);
          let session = socket.data.session;
          if (repository.transact) await service.refresh(session ? [session] : []);
          if ((event === 'room:create' || event === 'room:join') && session
            && socket.data.entryEvent === event && socket.data.entryRequestId === payload.requestId) {
            return ack({ ok: true, session, view: service.view(session) });
          }
          if (event === 'room:create') {
            rateLimit(`create:${socket.handshake.address}`, 20);
            if (session) throw new Error('Hãy rời phòng hiện tại trước khi tạo phòng mới.');
            session = await service.create(payload.requestId);
          } else if (event === 'room:join') {
            rateLimit(`join:${socket.handshake.address}`, 200);
            if (session) throw new Error('Hãy rời phòng hiện tại trước khi tham gia phòng khác.');
            session = await service.join(payload.code, payload.name, payload.requestId);
          } else if (event === 'room:resume') {
            service.view(payload);
            session = { code: service.view(payload).code, token: payload.token };
          } else {
            if (!session) throw new Error('Hãy tham gia phòng trước khi gửi lựa chọn.');
            await service.command(session, payload.action, payload);
          }
          if (event !== 'room:command') {
            await attach(socket, session);
            if (event !== 'room:resume') { socket.data.entryEvent = event; socket.data.entryRequestId = payload.requestId; }
          }
          ack({ ok: true, session, view: service.view(session) });
        } catch (error) {
          // Không gửi chi tiết đường dẫn hoặc lỗi hệ thống tới người chơi.
          const known = error.code === undefined && !/disk|JSON|ENOENT|EACCES/i.test(error.message);
          if (!known) console.error('Room request failed:', error.code || error.name);
          ack({ ok: false, error: known ? error.message : 'Máy chủ chưa lưu được thay đổi. Hãy thử lại hoặc báo chủ phòng.' });
        }
      });
    }
    socket.on('disconnect', () => {
      if (!closing && socket.data.session) {
        Promise.resolve().then(() => service.setConnected(socket.data.session, `${instanceId}:${socket.id}`, false)).catch(() => {});
      }
      limits.delete(`socket:${socket.id}`);
    });
  });

  const heartbeat = repository.setPresence ? setInterval(async () => {
    if (closing) return;
    try {
      await Promise.all([...io.sockets.sockets.values()].filter((socket) => socket.data.session)
        .map((socket) => repository.setPresence(socket.data.session, `${instanceId}:${socket.id}`, true, false)));
      await service.refresh(sessions());
    } catch { /* Reconnect/next request recovers from temporary storage failure. */ }
  }, 15000) : null;
  heartbeat?.unref();

  return { httpServer, io, service, close: async () => {
    closing = true;
    clearInterval(heartbeat);
    unsubscribe();
    unsubscribeRepository?.();
    await Promise.all([...io.sockets.sockets.values()].filter((socket) => socket.data.session)
      .map((socket) => Promise.resolve().then(() => service.setConnected(socket.data.session, `${instanceId}:${socket.id}`, false)).catch(() => {})));
    await new Promise((resolve) => io.close(resolve));
    await repository.close?.();
  } };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 3001);
  const host = process.env.HOST || '0.0.0.0';
  const server = await createGameServer();
  server.httpServer.listen(port, host, () => console.log(`Cân bằng chuyến xe: http://localhost:${port}`));
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => { server.close().then(() => process.exit(0)); });
}
