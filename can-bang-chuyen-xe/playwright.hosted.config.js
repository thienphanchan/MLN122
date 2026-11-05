import { defineConfig } from '@playwright/test';
import base from './playwright.config.js';

if (!process.env.TEST_REDIS_URL) throw new Error('TEST_REDIS_URL is required for npm run test:hosted.');
export default defineConfig({
  ...base,
  testMatch: '**/rooms.e2e.js',
  use: { ...base.use, baseURL: 'http://127.0.0.1:4174' },
  webServer: {
    command: 'node tests/fixtures/hosted-server.js',
    url: 'http://127.0.0.1:4174/api/health',
    reuseExistingServer: false,
    env: { PORT: '4174', REDIS_URL: process.env.TEST_REDIS_URL, ROOM_REDIS_PREFIX: `cbcx:browser:${Date.now()}`, PUBLIC_ORIGIN: 'http://127.0.0.1:4174' },
  },
});
