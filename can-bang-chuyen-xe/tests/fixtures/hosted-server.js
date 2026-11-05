import { createHostedServer } from '../../server/hosted-server.js';
import { createGameServer } from '../../server/index.js';

if (!process.env.REDIS_URL) throw new Error('Set TEST_REDIS_URL before running the hosted browser suite.');
const hosted = createHostedServer({ initialize: () => createGameServer({ hosted: true, serveStatic: true }) });
hosted.server.listen(Number(process.env.PORT || 4174), '127.0.0.1');
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => { hosted.close().then(() => process.exit(0)); });
