import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { roomDataPath } from './server/config.js';

export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, process.cwd(), '');
  const roomFile = roomDataPath(process.env.ROOM_DATA_FILE || environment.ROOM_DATA_FILE || 'data/rooms.json', process.cwd()).replaceAll('\\', '/');
  const roomFilePattern = roomFile.replace(/[()[\]{}*?!+@|]/g, '\\$&');
  const target = `http://127.0.0.1:${process.env.PORT || environment.PORT || 3001}`;
  return {
  plugins: [react()],
  server: {
    fs: {
      deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/server/**', '**/data/**', '**/tests/**', '**/test-results/**', '*.log', roomFilePattern, `${roomFilePattern}.*.tmp`],
    },
    proxy: {
      '/socket.io': { target, ws: true },
      '/api': { target },
    },
  },
  };
});
