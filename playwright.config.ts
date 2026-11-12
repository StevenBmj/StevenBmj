import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  use: { baseURL: 'http://localhost:3011', channel: process.env.PW_CHANNEL, trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: process.env.PW_PRODUCTION === '1' ? 'npm run start' : 'npm run dev',
    url: 'http://localhost:3011', env: { PORT: '3011', ...(process.env.PW_PRODUCTION === '1' ? { NODE_ENV: 'production' } : {}) },
    reuseExistingServer: false, timeout: 120000,
  },
});
