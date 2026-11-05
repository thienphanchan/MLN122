import { afterEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { createRedisRepository } from '../server/redis-repository.js';
import { createRoomService } from '../server/rooms.js';
import { createGameServer } from '../server/index.js';

const repositories = [];
afterEach(async () => { await Promise.all(repositories.splice(0).map((repository) => repository.close())); });
const requestId = () => randomUUID();
async function repositoryPair(options = {}) {
  const config = { url: process.env.TEST_REDIS_URL, prefix: `cbcx:test:${randomUUID()}`, ...options };
  const a = await createRedisRepository(config);
  const b = await createRedisRepository(config);
  repositories.push(a, b);
  return [a, b];
}

describe.skipIf(!process.env.TEST_REDIS_URL)('real Redis distributed room authority', () => {
  it('atomically applies competing updates without losing either instance data', async () => {
    const [a, b] = await repositoryPair();
    await Promise.all(Array.from({ length: 24 }, (_, index) => (index % 2 ? a : b).transact((data) => {
      data.counter = (data.counter ?? 0) + 1;
      return data.counter;
    })));
    expect((await a.load()).counter).toBe(24);
    expect((await b.load()).counter).toBe(24);
  });

  it('preserves authoritative progress and private grading when a player switches instances', async () => {
    const [a, b] = await repositoryPair();
    const first = await createRoomService({ repository: a });
    const second = await createRoomService({ repository: b });
    const host = await first.create(requestId());
    const player = await second.join(host.code, 'An', requestId());
    await first.command(host, 'start', { requestId: requestId() });
    for (let round = 1; round <= 5; round++) {
      await second.command(player, 'confirm', { requestId: requestId(), round, commission: 25, floor: false, dialogue: false });
      await first.command(player, 'next', { requestId: requestId(), round });
    }
    const submission = { requestId: requestId(), answers: [1, 2, 0, 3, 1] };
    await first.command(player, 'quiz', submission);
    await second.command(player, 'quiz', submission);
    await second.refresh([host, player]);
    expect(second.view(host)).toMatchObject({ status: 'finished' });
    expect(second.view(player).self).toMatchObject({ quizScore: 50, quizSubmitted: true });
    expect(second.view(player).self.game.history).toHaveLength(5);
    expect(JSON.stringify(second.view(host))).not.toContain(player.token);
  });

  it('notifies other instances only after commit and expires failed-instance presence', async () => {
    const [a, b] = await repositoryPair({ presenceTtlMs: 120 });
    let notify;
    const secondSawCommit = new Promise((resolve) => { notify = resolve; });
    await b.subscribe(async () => { notify(await b.load()); });
    await a.transact((data) => { data.counter = 7; });
    expect((await secondSawCommit).counter).toBe(7);
    const session = { code: 'ABC234', token: 'test-private-token' };
    await a.setPresence(session, 'server-a:socket-1', true);
    expect(await b.getPresence(session.code)).toContain(session.token);
    await new Promise((resolve) => setTimeout(resolve, 160));
    expect(await b.getPresence(session.code)).not.toContain(session.token);
  });

  it('releases Redis resources after initialization fails so warm retries do not leak connections', async () => {
    const [repository] = await repositoryPair();
    await repository.transact((data) => { data.rooms.ABC234 = { code: 'ABC234' }; });
    await expect(createGameServer({ repository, hosted: true })).rejects.toThrow(/hỏng/);
    await expect(repository.load()).rejects.toThrow(/closed/i);
  });
});
