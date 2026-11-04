import { expect, it } from 'vitest';
import { createServer } from 'vite';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

it.each(['private[1].json', 'private{a,b}.json', 'private(1).json'])('LAN development protects private sources and configured room file %s', async (privateName) => {
  const directory = await mkdtemp(join(projectRoot, '.room-private-test-'));
  const filename = join(directory, privateName);
  const previous = process.env.ROOM_DATA_FILE;
  let server;
  try {
    await writeFile(filename, '{"private":"PRIVATE_ROOM_SENTINEL"}');
    await writeFile(`${filename}.test.tmp`, '{"private":"PRIVATE_ROOM_SENTINEL"}');
    process.env.ROOM_DATA_FILE = filename;
    server = await createServer({ root: projectRoot, logLevel: 'silent', server: { host: '127.0.0.1', port: 0 }, optimizeDeps: { noDiscovery: true, include: [] } });
    await server.listen();
    const origin = `http://127.0.0.1:${server.httpServer.address().port}`;
    expect((await fetch(`${origin}/`)).status).toBe(200);
    const roomPath = relative(projectRoot, filename).replaceAll('\\', '/');
    for (const path of ['/server/quiz.js', '/server/quiz.js?raw', '/tests/rooms.test.js', '/tests/ui/rooms.e2e.js?raw', `/@fs/${filename.replaceAll('\\', '/')}`, `/${roomPath}`, `/${roomPath}?raw`, `/${roomPath}.test.tmp`]) {
      const response = await fetch(`${origin}${path}`);
      expect([403, 404], path).toContain(response.status);
      expect(await response.text()).not.toContain('PRIVATE_ROOM_SENTINEL');
    }
  } finally {
    if (server) await server.close();
    if (previous === undefined) delete process.env.ROOM_DATA_FILE; else process.env.ROOM_DATA_FILE = previous;
    // Only remove the exact absolute fixture directory created inside this workspace.
    if (directory.startsWith(join(projectRoot, '.room-private-test-'))) await rm(directory, { recursive: true, force: true });
  }
}, 20000);
