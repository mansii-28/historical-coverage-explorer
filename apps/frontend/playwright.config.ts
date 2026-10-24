import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5174',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: '../backend/.venv/bin/python ../../scripts/run_e2e_backend.py',
      url: 'http://127.0.0.1:8001/api/health',
      reuseExistingServer: !process.env.CI,
      timeout: 30000,
    },
    {
      command: 'npm run dev -- --port 5174',
      env: {
        VITE_API_BASE_URL: 'http://127.0.0.1:8001',
      },
      url: 'http://localhost:5174',
      reuseExistingServer: !process.env.CI,
      timeout: 30000,
    },
  ],
})
