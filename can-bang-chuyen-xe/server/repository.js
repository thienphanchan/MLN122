import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';

export function createFileRepository(filename) {
  return {
    async load() {
      try {
        const data = JSON.parse(await readFile(filename, 'utf8'));
        if (data?.version !== 1 || !data.rooms || typeof data.rooms !== 'object' || Array.isArray(data.rooms)) {
          throw new Error('Kho phòng không đúng định dạng. Hãy khôi phục bản sao lưu.');
        }
        return data;
      } catch (error) {
        if (error.code === 'ENOENT') return { version: 1, rooms: {} };
        throw error;
      }
    },
    async save(data) {
      await mkdir(dirname(filename), { recursive: true });
      const temporary = `${filename}.${randomUUID()}.tmp`;
      await writeFile(temporary, JSON.stringify(data), { encoding: 'utf8', mode: 0o600 });
      await rename(temporary, filename);
    },
  };
}
