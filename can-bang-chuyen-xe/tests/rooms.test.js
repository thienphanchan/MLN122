import { describe, expect, it } from 'vitest';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRoomService } from '../server/rooms.js';
import { createFileRepository } from '../server/repository.js';

function memoryRepository() {
  let saved = { version: 1, rooms: {} };
  return { load: async () => structuredClone(saved), save: async (data) => { saved = structuredClone(data); } };
}
let sequence = 0;
const requestId = () => `request-${++sequence}`;
async function setup(options = {}) {
  const service = await createRoomService({ repository: memoryRepository(), ...options });
  const host = await service.create(requestId());
  const a = await service.join(host.code, 'An', requestId());
  const b = await service.join(host.code, 'Bình', requestId());
  const command = (session, action, payload = {}) => service.command(session, action, { requestId: requestId(), ...payload });
  return { service, host, a, b, command };
}
async function completeGame(command, player) {
  for (let round = 1; round <= 5; round++) {
    await command(player, 'confirm', { round, commission: 25, floor: false, dialogue: false });
    await command(player, 'next', { round });
  }
}

describe('authoritative classroom rooms', () => {
  it('calculates live scores, conceals credentials and rejects participant host commands', async () => {
    const { service, host, a, b, command } = await setup();
    await expect(command(a, 'start')).rejects.toThrow(/chủ phòng/);
    await expect(command(host, 'confirm', { round: 1, commission: 25, floor: false, dialogue: false })).rejects.toThrow();
    await command(host, 'start');
    await command(a, 'confirm', { round: 1, commission: 25, floor: false, dialogue: false, total: 999999 });
    const view = service.view(host);
    expect(view.players.find((p) => p.name === 'An')).toMatchObject({ wins: 1, total: 219, completedDays: 1 });
    expect(view.players.find((p) => p.name === 'Bình')).toMatchObject({ wins: 0, total: 0 });
    expect(JSON.stringify(view)).not.toContain(a.token);
    expect(JSON.stringify(view)).not.toContain(host.token);
    expect(service.view(b).self.game.round).toBe(1);
    expect(() => service.view({ code: host.code, token: 'unknown-token' })).toThrow(/phiên/);
  });

  it('enforces sequential play and makes repeated requests idempotent', async () => {
    const { service, host, a, command } = await setup();
    await command(host, 'start');
    await expect(command(a, 'next', { round: 1 })).rejects.toThrow();
    const payload = { requestId: requestId(), round: 1, commission: 25, floor: false, dialogue: false };
    await service.command(a, 'confirm', payload);
    await service.command(a, 'confirm', payload);
    expect(service.view(host).players.find((p) => p.name === 'An').completedDays).toBe(1);
    await expect(command(a, 'confirm', { round: 1, commission: 25, floor: false, dialogue: false })).rejects.toThrow();
    await expect(command(a, 'quiz', { answers: [1, 2, 0, 3, 1] })).rejects.toThrow();
    await expect(command(a, 'next', { round: 4 })).rejects.toThrow();
  });

  it('grades only complete quizzes after day five and reveals answers only after the room finishes', async () => {
    const { service, host, a, b, command } = await setup();
    await command(host, 'start');
    await completeGame(command, a);
    const pre = service.view(a);
    expect(pre.self.game.screen).toBe('end');
    expect(JSON.stringify(pre)).not.toContain('correctIndex');
    await expect(command(a, 'quiz', { answers: [1] })).rejects.toThrow();
    await expect(command(a, 'quiz', { answers: [1, 2, 0, 3, 7] })).rejects.toThrow();
    const payload = { requestId: requestId(), answers: [1, 2, 0, 3, 1] };
    await service.command(a, 'quiz', payload);
    await service.command(a, 'quiz', payload);
    expect(service.view(host).players.find((p) => p.name === 'An').quizScore).toBe(50);
    expect(service.view(a).self.review).toBeUndefined();
    await expect(command(a, 'quiz', { answers: [0, 0, 0, 0, 0] })).rejects.toThrow();
    await completeGame(command, b);
    await command(b, 'quiz', { answers: [0, 0, 0, 0, 0] });
    expect(service.view(host).status).toBe('finished');
    expect(service.view(a).self.review).toHaveLength(5);
    expect(service.view(b).self.quizScore).toBe(10);
    await expect(command(a, 'next', { round: 5 })).rejects.toThrow();
  });

  it('supports early finish while retaining confirmed scores and zeroing unsubmitted quizzes', async () => {
    const { service, host, a, command } = await setup();
    await command(host, 'start');
    await command(a, 'confirm', { round: 1, commission: 25, floor: false, dialogue: false });
    await command(host, 'finish');
    expect(service.view(a)).toMatchObject({ status: 'finished', self: { quizScore: 0 } });
    expect(service.view(host).players.find((p) => p.name === 'An').total).toBe(219);
  });

  it('validates names, capacity, late joins, expiry and duplicate create/join requests', async () => {
    let time = 1000;
    const { service, host, a, command } = await setup({ now: () => time, maxPlayers: 2, ttlMs: 100 });
    await expect(service.join(host.code, 'An', requestId())).rejects.toThrow(/tên|đầy/);
    await expect(service.join(host.code, '', requestId())).rejects.toThrow(/tên/i);
    await expect(service.join(host.code, 'Cường', requestId())).rejects.toThrow(/đầy/);
    await command(host, 'start');
    await expect(service.join(host.code, 'Cường', requestId())).rejects.toThrow(/bắt đầu/);
    service.setConnected(a, 'socket-a', true);
    service.setConnected(a, 'socket-a2', true);
    service.setConnected(a, 'socket-a', false);
    expect(service.view(host).players.find((p) => p.name === 'An').connected).toBe(true);
    time += 101;
    expect(() => service.view(a)).toThrow(/hết hạn/);

    const id = requestId();
    const room = await service.create(id);
    expect(await service.create(id)).toEqual(room);
    const joinId = requestId();
    const joined = await service.join(room.code, 'Minh', joinId);
    expect(await service.join(room.code, 'Minh', joinId)).toEqual(joined);
    await expect(service.join(room.code, '  MINH  ', requestId())).rejects.toThrow(/tên/);
  });

  it('does not acknowledge or apply a decision when persistence fails', async () => {
    const repository = memoryRepository();
    const { service, host, a, command } = await setup({ repository });
    await command(host, 'start');
    repository.save = async () => { throw new Error('disk full'); };
    await expect(command(a, 'confirm', { round: 1, commission: 25, floor: false, dialogue: false })).rejects.toThrow(/disk full/);
    expect(service.view(a).self.game.history).toHaveLength(0);
  });

  it('serializes simultaneous decisions without dropping either player result', async () => {
    const { service, host, a, b, command } = await setup();
    await command(host, 'start');
    const decision = { round: 1, commission: 25, floor: false, dialogue: false };
    await Promise.all([command(a, 'confirm', decision), command(b, 'confirm', decision)]);
    expect(service.view(host).players.map((player) => player.total)).toEqual([219, 219]);
    expect(service.view(host).players.map((player) => player.rank)).toEqual([1, 1]);
  });

  it('refuses corrupt persisted quiz data at startup instead of creating unusable sessions', async () => {
    const repository = memoryRepository();
    const { host } = await setup({ repository });
    const data = await repository.load();
    data.rooms[host.code].players[0].quizAnswers = [99];
    await repository.save(data);
    await expect(createRoomService({ repository })).rejects.toThrow(/hỏng/);
  });

  it('restores credentials, decisions and quiz results from an atomic file repository', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'cbcx-rooms-'));
    try {
      const filename = join(directory, 'rooms.json');
      const { host, a, command } = await setup({ repository: createFileRepository(filename) });
      await command(host, 'start');
      await completeGame(command, a);
      await command(a, 'quiz', { answers: [1, 2, 0, 3, 1] });
      const restored = await createRoomService({ repository: createFileRepository(filename) });
      expect(restored.view(a).self).toMatchObject({ quizScore: 50, quizSubmitted: true });
      expect(restored.view(a).self.game.history).toHaveLength(5);
      expect(JSON.parse(await readFile(filename, 'utf8')).version).toBe(1);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
