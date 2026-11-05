import { createServer } from 'node:http';
import { createGameServer } from './index.js';
import { storageFailure } from './hosted-config.js';

// Keep the exported native server stable while allowing failed cold-start
// initialization to retry. Only a successfully initialized runtime is cached.
export function createHostedServer({ initialize = () => createGameServer({ hosted: true, serveStatic: false }), now = Date.now } = {}) {
  let runtime;
  let initializing;
  let retryAt = 0;
  let lastError;
  let closed = false;
  async function ready() {
    if (closed) throw new Error('Room server is closing');
    if (runtime) return runtime;
    if (now() < retryAt) throw lastError;
    if (!initializing) {
      initializing = initialize().then(async (value) => {
        if (closed) { await value.close(); throw new Error('Room server is closing'); }
        runtime = value;
        return value;
      }).catch((error) => {
        lastError = error;
        retryAt = now() + 1000;
        throw error;
      }).finally(() => { initializing = null; });
    }
    return initializing;
  }
  const server = createServer((request, response) => {
    ready().then(({ httpServer }) => {
      if (!response.destroyed) httpServer.emit('request', request, response);
    }).catch((error) => { if (!response.destroyed) storageFailure(response, error); });
  });
  server.on('upgrade', (request, socket, head) => {
    ready().then(({ httpServer }) => {
      if (!socket.destroyed) httpServer.emit('upgrade', request, socket, head);
    }).catch(() => {
      if (!socket.destroyed) socket.end('HTTP/1.1 503 Service Unavailable\r\nConnection: close\r\nContent-Length: 0\r\n\r\n');
    });
  });
  server.once('close', () => { if (!closed) { closed = true; runtime?.close().catch(() => {}); } });
  return { server, close: async () => {
    closed = true;
    try { await initializing; } catch { /* Initialization may already have failed. */ }
    await runtime?.close();
    await new Promise((resolve) => server.close(resolve));
  } };
}
