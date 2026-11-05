import { redisOptions, sendJson, storageFailure } from '../server/hosted-config.js';

export default function handler(request, response) {
  try {
    redisOptions();
    sendJson(response, 200, { publicOrigin: process.env.PUBLIC_ORIGIN || null, lanOrigins: [],
      socket: { path: '/api/rooms', addTrailingSlash: false, transports: ['websocket'] } });
  } catch (error) { storageFailure(response, error); }
}
