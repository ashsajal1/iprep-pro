import { defineConfig, devices } from '@playwright/test';

/**
 * Integration tests run against the production build served by `astro preview`,
 * so what they verify is exactly what gets deployed.
 */
export default defineConfig({
	testDir: 'tests/e2e',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	reporter: [['list']],
	timeout: 30_000,

	use: {
		baseURL: 'http://127.0.0.1:4173',
		...devices['Desktop Chrome'],
	},

	webServer: {
		command: 'pnpm build && pnpm preview --port 4173 --host 127.0.0.1',
		url: 'http://127.0.0.1:4173/',
		reuseExistingServer: !process.env.CI,
		timeout: 240_000,
		stdout: 'pipe',
	},
});
