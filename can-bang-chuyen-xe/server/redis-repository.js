import { createClient } from 'redis';
import { setTimeout as delay } from 'node:timers/promises';

const EMPTY = () => ({ version: 1, rooms: {} });
const COMMIT = `
local current = redis.call('GET', KEYS[1])
if (current or '') ~= ARGV[1] then return 0 end
redis.call('SET', KEYS[1], ARGV[2])
redis.call('PUBLISH', KEYS[2], 'changed')
return 1
`;
const PRESENCE = `
redis.call('ZREMRANGEBYSCORE', KEYS[1], '-inf', ARGV[1])
return redis.call('ZRANGE', KEYS[1], 0, -1)
`;

function decode(raw) {
  const data = raw === null ? EMPTY() : JSON.parse(raw);
  if (data?.version !== 1 || !data.rooms || typeof data.rooms !== 'object' || Array.isArray(data.rooms)) {
    throw new Error('Kho phòng không đúng định dạng. Hãy khôi phục bản sao lưu.');
  }
  return data;
}

export async function createRedisRepository({ url, prefix = 'cbcx:rooms:v1', presenceTtlMs = 45000 }) {
  if (!url || !/^rediss?:\/\//.test(url)) throw new Error('REDIS_URL phải là địa chỉ redis:// hoặc rediss:// hợp lệ.');
  let connectedOnce = false;
  const client = createClient({ url, disableOfflineQueue: true, socket: {
    connectTimeout: 3000,
    reconnectStrategy: (attempt) => !connectedOnce && attempt >= 2 ? new Error('Room storage unavailable') : Math.min(100 * 2 ** attempt, 3000),
  } });
  client.on('ready', () => { connectedOnce = true; });
  // Redis connection errors must never print the URL/password to the browser or logs.
  client.on('error', () => {});
  try { await client.connect(); }
  catch (error) { if (client.isOpen) client.destroy(); throw error; }
  const stateKey = `{${prefix}}:state`;
  const channel = `{${prefix}}:changed`;
  let subscriber;
  const listeners = new Set();
  const presenceKey = (code) => `{${prefix}}:presence:${code}`;
  return {
    async load() { return decode(await client.get(stateKey)); },
    async transact(change) {
      for (let attempt = 0; attempt < 64; attempt++) {
        const raw = await client.get(stateKey);
        const data = decode(raw);
        const result = change(data);
        const applied = await client.eval(COMMIT, { keys: [stateKey, channel], arguments: [raw ?? '', JSON.stringify(data)] });
        if (applied === 1) return { data, result };
        await delay(Math.floor(Math.random() * Math.min(10 + attempt * 3, 100)));
      }
      throw new Error('Phòng đang nhận nhiều lựa chọn cùng lúc. Hãy thử lại; điểm chưa được tính hai lần.');
    },
    async subscribe(listener) {
      listeners.add(listener);
      if (!subscriber) {
        let subscriberReady = false;
        subscriber = client.duplicate({ socket: { connectTimeout: 3000,
          reconnectStrategy: (attempt) => !subscriberReady && attempt >= 2 ? new Error('Room notifications unavailable') : Math.min(100 * 2 ** attempt, 3000),
        } });
        subscriber.on('ready', () => { subscriberReady = true; });
        subscriber.on('error', () => {});
        await subscriber.connect();
        await subscriber.subscribe(channel, () => { for (const notify of listeners) Promise.resolve().then(notify).catch(() => {}); });
      }
      return () => listeners.delete(listener);
    },
    async setPresence(session, id, connected, notify = true) {
      const key = presenceKey(session.code);
      const member = `${session.token}:${id}`;
      if (connected) {
        await client.multi().zAdd(key, { score: Date.now() + presenceTtlMs, value: member }).pExpire(key, presenceTtlMs * 2).exec();
      } else await client.zRem(key, member);
      if (notify) await client.publish(channel, 'presence');
    },
    async getPresence(code) {
      const members = await client.eval(PRESENCE, { keys: [presenceKey(code)], arguments: [String(Date.now())] });
      return [...new Set(members.map((member) => member.split(':')[0]))];
    },
    async close() {
      listeners.clear();
      if (subscriber?.isOpen) subscriber.destroy();
      if (client.isOpen) client.destroy();
    },
  };
}
