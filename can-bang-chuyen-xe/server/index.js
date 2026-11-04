import { createServer } from 'node:http';
import { networkInterfaces } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { Server } from 'socket.io';
import { createFileRepository } from './repository.js';
import { createRoomService } from './rooms.js';
import { roomDataPath } from './config.js';

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
  repository = createFileRepository(roomDataPath(process.env.ROOM_DATA_FILE || 'data/rooms.json', projectRoot)),
  origin = process.env.PUBLIC_ORIGIN,
  maxPlayers = Number(process.env.MAX_PLAYERS || 100),
  ttlMs = Number(process.env.ROOM_TTL_HOURS || 24) * 3600000,
} = {}) {
  if (!Number.isInteger(maxPlayers) || maxPlayers < 1 || maxPlayers > 1000 || !Number.isFinite(ttlMs) || ttlMs <= 0) {
    throw new Error('MAX_PLAYERS và ROOM_TTL_HOURS phải là số dương hợp lệ.');
  }
  const configuredOrigin = publicOrigin(origin);
  const service = await createRoomService({ repository, maxPlayers, ttlMs });
  const app = express();
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Referrer-Policy', 'same-origin');
    next();
  });
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
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

  app.get('/api/health', (req, res) => res.set('Cache-Control', 'no-store').json({ ok: true }));
  app.get('/api/config', (req, res) => {
    const port = httpServer.address()?.port;
    const lanOrigins = Object.values(networkInterfaces()).flat().filter((entry) => entry.family === 'IPv4' && !entry.internal)
      .map((entry) => `http://${entry.address}:${port}`);
    res.set('Cache-Control', 'no-store').json({ publicOrigin: configuredOrigin, lanOrigins });
  });
  app.use(express.static(resolve(projectRoot, 'dist'), { dotfiles: 'deny' }));
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
  function attach(socket, session) {
    if (socket.data.session) service.setConnected(socket.data.session, socket.id, false);
    socket.data.session = session;
    service.setConnected(session, socket.id, true);
  }
  io.on('connection', (socket) => {
    for (const event of ['room:create', 'room:join', 'room:resume', 'room:command']) {
      socket.on(event, async (payload, ack) => {
        if (typeof ack !== 'function') return;
        try {
          if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('Yêu cầu không hợp lệ.');
          rateLimit(`socket:${socket.id}`, 120);
          let session = socket.data.session;
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
            session = { code: payload.code, token: payload.token };
          } else {
            if (!session) throw new Error('Hãy tham gia phòng trước khi gửi lựa chọn.');
            await service.command(session, payload.action, payload);
          }
          if (event !== 'room:command') {
            attach(socket, session);
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
      if (socket.data.session) {
        try { service.setConnected(socket.data.session, socket.id, false); } catch { /* Phòng có thể đã hết hạn. */ }
      }
      limits.delete(`socket:${socket.id}`);
    });
  });

  return { httpServer, io, service, close: () => { unsubscribe(); return new Promise((resolve) => io.close(resolve)); } };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 3001);
  const host = process.env.HOST || '0.0.0.0';
  const server = await createGameServer();
  server.httpServer.listen(port, host, () => console.log(`Cân bằng chuyến xe: http://localhost:${port}`));
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => { server.close().then(() => process.exit(0)); });
}
