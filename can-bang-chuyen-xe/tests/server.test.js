import { afterEach, expect, it } from 'vitest';
import { io as connect } from 'socket.io-client';
import { createGameServer } from '../server/index.js';

const cleanup = [];
afterEach(async () => { while (cleanup.length) await cleanup.pop()(); });
const request = (socket, event, payload = {}) => socket.timeout(3000).emitWithAck(event, payload);
async function serverAndClients() {
  let saved = { version: 1, rooms: {} };
  const server = await createGameServer({ repository: { load: async () => saved, save: async (data) => { saved = structuredClone(data); } } });
  await new Promise((resolve) => server.httpServer.listen(0, '127.0.0.1', resolve));
  cleanup.push(() => server.close());
  const origin = `http://127.0.0.1:${server.httpServer.address().port}`;
  async function client() {
    const socket = connect(origin, { forceNew: true, reconnection: false });
    cleanup.push(() => socket.close());
    await new Promise((resolve) => socket.once('connect', resolve));
    return socket;
  }
  return { server, origin, client };
}

it('broadcasts authoritative scores over real sockets, resumes sessions and blocks unauthenticated commands', async () => {
  const { origin, client } = await serverAndClients();
  expect((await fetch(`${origin}/api/health`)).ok).toBe(true);
  const host = await client();
  const player = await client();
  const created = await request(host, 'room:create', { requestId: 'create-00001' });
  expect(created.ok).toBe(true);
  const replayedCreate = await request(host, 'room:create', { requestId: 'create-00001' });
  expect(replayedCreate.session).toEqual(created.session);
  const joined = await request(player, 'room:join', { code: created.session.code, name: 'An', requestId: 'join-0000001' });
  expect(joined.ok).toBe(true);
  const replayedJoin = await request(player, 'room:join', { code: created.session.code, name: 'An', requestId: 'join-0000001' });
  expect(replayedJoin.session).toEqual(joined.session);
  expect((await request(player, 'room:command', { action: 'start', requestId: 'start-invalid' })).ok).toBe(false);
  expect((await request(host, 'room:command', { action: 'start', requestId: 'start-00001' })).ok).toBe(true);
  const update = new Promise((resolve) => {
    const listener = (view) => {
      if (view.players[0]?.total === 219) { host.off('room:view', listener); resolve(view); }
    };
    host.on('room:view', listener);
  });
  expect((await request(player, 'room:command', { action: 'confirm', requestId: 'confirm-0001', round: 1, commission: 25, floor: false, dialogue: false })).ok).toBe(true);
  expect((await update).players[0]).toMatchObject({ name: 'An', total: 219 });
  player.close();
  const reconnected = await client();
  const resumed = await request(reconnected, 'room:resume', joined.session);
  expect(resumed.view.self.game.history).toHaveLength(1);
  const stranger = await client();
  expect((await request(stranger, 'room:resume', { ...joined.session, token: created.session.code })).ok).toBe(false);
  expect((await request(stranger, 'room:command', { action: 'finish', requestId: 'finish-0001' })).ok).toBe(false);
});

it('rejects malformed envelopes and does not expose room storage or answer keys through HTTP', async () => {
  const { origin, client } = await serverAndClients();
  const socket = await client();
  expect((await request(socket, 'room:create', null)).ok).toBe(false);
  expect((await request(socket, 'room:join', { code: '<bad>', name: 'An' })).ok).toBe(false);
  for (const path of ['/data/rooms.json', '/server/quiz.js', '/.env']) {
    const response = await fetch(`${origin}${path}`);
    expect(response.status).toBe(404);
  }
});

it('keeps a local HTTP polling connection available when WebSocket upgrades are blocked', async () => {
  const { origin } = await serverAndClients();
  const config = await (await fetch(`${origin}/api/config`)).json();
  const socket = connect(origin, { ...config.socket, upgrade: false, forceNew: true, reconnection: false });
  cleanup.push(() => socket.close());
  await new Promise((resolve, reject) => { socket.once('connect', resolve); socket.once('connect_error', reject); });
  expect(socket.io.engine.transport.name).toBe('polling');
  expect((await request(socket, 'room:create', { requestId: 'polling-request-1' })).ok).toBe(true);
});

it('refuses a configured room file inside a directory served to browsers', async () => {
  const previous = process.env.ROOM_DATA_FILE;
  try {
    for (const filename of ['public/rooms.json', 'dist/rooms.json']) {
      process.env.ROOM_DATA_FILE = filename;
      await expect(createGameServer()).rejects.toThrow(/ROOM_DATA_FILE/);
    }
  } finally {
    if (previous === undefined) delete process.env.ROOM_DATA_FILE; else process.env.ROOM_DATA_FILE = previous;
  }
});
