import { redisOptions, sendJson, storageFailure } from '../server/hosted-config.js';
import { createRedisRepository } from '../server/redis-repository.js';

export default async function handler(request, response) {
  let repository;
  try {
    repository = await createRedisRepository(redisOptions());
    await repository.load();
    sendJson(response, 200, { ok: true, storage: 'redis' });
  } catch (error) { storageFailure(response, error); }
  finally { await repository?.close(); }
}
