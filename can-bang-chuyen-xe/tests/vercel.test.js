import { afterEach, describe, expect, it } from 'vitest';
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { io as connect } from 'socket.io-client';
import { createRedisRepository } from '../server/redis-repository.js';
import { createGameServer } from '../server/index.js';
import configHandler from '../api/config.js';
import healthHandler from '../api/health.js';
import { createHostedServer } from '../server/hosted-server.js';

const cleanup = [];
afterEach(async () => { while (cleanup.length) await cleanup.pop()(); });
async function listen(server) {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return `http://127.0.0.1:${server.address().port}`;
}
const request = (socket, event, data = {}) => socket.timeout(4000).emitWithAck(event, data);

it('native Vercel endpoints explain missing room storage instead of returning 404 or creating ephemeral rooms', async () => {
  const previous = { REDIS_URL: process.env.REDIS_URL, KV_URL: process.env.KV_URL };
  delete process.env.REDIS_URL;
  delete process.env.KV_URL;
  try {
    for (const handler of [configHandler, healthHandler]) {
      const server = createServer(handler);
      cleanup.push(() => new Promise((resolve) => server.close(resolve)));
      const origin = await listen(server);
      const response = await fetch(origin);
      expect(response.status).toBe(503);
      expect(await response.json()).toMatchObject({ ok: false, code: 'ROOM_STORAGE_NOT_CONFIGURED' });
      expect(response.headers.get('cache-control')).toContain('no-store');
    }
    await expect(createGameServer({ hosted: true })).rejects.toThrow(/REDIS_URL/);
  } finally {
    for (const [key, value] of Object.entries(previous)) if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
});

it('native browser configuration uses the exact function URL and never includes Redis credentials', async () => {
  const previous = process.env.REDIS_URL;
  process.env.REDIS_URL = 'rediss://user:private-test-password@redis.example:6379';
  try {
    const server = createServer(configHandler);
    cleanup.push(() => new Promise((resolve) => server.close(resolve)));
    const origin = await listen(server);
    const response = await fetch(origin);
    expect(response.status).toBe(200);
    const config = await response.json();
    expect(config.socket).toMatchObject({ path: '/api/rooms', addTrailingSlash: false, transports: ['websocket'] });
    expect(JSON.stringify(config)).not.toContain('private-test-password');
  } finally {
    if (previous === undefined) delete process.env.REDIS_URL; else process.env.REDIS_URL = previous;
  }
});

it('a warm native entry retries failed initialization and forwards subsequent HTTP and WebSocket requests', async () => {
  let attempt = 0;
  let clock = 1000;
  let data = { version: 1, rooms: {} };
  const hosted = createHostedServer({ now: () => clock, initialize: async () => {
    if (++attempt === 1) throw new Error('Temporary test storage failure');
    return createGameServer({ hosted: true, repository: { load: async () => data, save: async (next) => { data = structuredClone(next); } } });
  } });
  cleanup.push(() => hosted.close());
  const origin = await listen(hosted.server);
  const unavailable = await fetch(`${origin}/api/health`);
  expect(unavailable.status).toBe(503);
  expect(await unavailable.json()).toMatchObject({ code: 'ROOM_STORAGE_UNAVAILABLE' });
  clock += 1100;
  expect((await fetch(`${origin}/api/health`)).status).toBe(200);
  const socket = connect(origin, { path: '/api/rooms', addTrailingSlash: false, transports: ['websocket'], reconnection: false });
  cleanup.push(() => socket.close());
  await new Promise((resolve, reject) => { socket.once('connect', resolve); socket.once('connect_error', reject); });
  expect((await request(socket, 'room:create', { requestId: randomUUID() })).ok).toBe(true);
});

describe.skipIf(!process.env.TEST_REDIS_URL)('Vercel-style realtime instances', () => {
  it('disposes an initialization that finishes after the native exported server has closed', async () => {
    const repository = await createRedisRepository({ url: process.env.TEST_REDIS_URL, prefix: `cbcx:test:${randomUUID()}` });
    let release;
    let started;
    const waiting = new Promise((resolve) => { release = resolve; });
    const beginning = new Promise((resolve) => { started = resolve; });
    const hosted = createHostedServer({ initialize: async () => {
      started();
      await waiting;
      return createGameServer({ hosted: true, repository });
    } });
    cleanup.push(() => hosted.close());
    const origin = await listen(hosted.server);
    const controller = new AbortController();
    const pending = fetch(`${origin}/api/health`, { signal: controller.signal }).catch(() => {});
    await beginning;
    controller.abort();
    await pending;
    await new Promise((resolve) => hosted.server.close(resolve));
    release();
    await expect.poll(async () => {
      try { await repository.load(); return false; } catch (error) { return /closed/i.test(error.message); }
    }, { timeout: 1500 }).toBe(true);
  });

  it('updates the host from a player on another instance and resumes onto either instance', async () => {
    const prefix = `cbcx:test:${randomUUID()}`;
    const servers = [];
    const origins = [];
    for (let index = 0; index < 2; index++) {
      const repository = await createRedisRepository({ url: process.env.TEST_REDIS_URL, prefix });
      const server = await createGameServer({ repository, hosted: true });
      servers.push(server);
      cleanup.push(() => server.close());
      origins.push(await listen(server.httpServer));
    }
    async function client(origin) {
      const socket = connect(origin, { path: '/api/rooms', addTrailingSlash: false, transports: ['websocket'], forceNew: true });
      cleanup.push(() => socket.close());
      await new Promise((resolve, reject) => { socket.once('connect', resolve); socket.once('connect_error', reject); });
      return socket;
    }
    const host = await client(origins[0]);
    const player = await client(origins[1]);
    const created = await request(host, 'room:create', { requestId: randomUUID() });
    const joined = await request(player, 'room:join', { code: created.session.code, name: 'An', requestId: randomUUID() });
    expect(joined.ok).toBe(true);
    await request(host, 'room:command', { action: 'start', requestId: randomUUID() });
    const updated = new Promise((resolve) => {
      const listener = (view) => { if (view.players[0]?.total === 219) { host.off('room:view', listener); resolve(view); } };
      host.on('room:view', listener);
    });
    await request(player, 'room:command', { action: 'confirm', round: 1, commission: 25, floor: false, dialogue: false, requestId: randomUUID() });
    const view = await updated;
    expect(view.players[0]).toMatchObject({ total: 219, connected: true });
    expect(JSON.stringify(view)).not.toContain(joined.session.token);
    player.close();
    const resumedClient = await client(origins[0]);
    const resumed = await request(resumedClient, 'room:resume', joined.session);
    expect(resumed.view.self.game.history).toHaveLength(1);
  }, 20000);
});
