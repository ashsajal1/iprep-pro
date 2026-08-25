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
		// `astro preview` daemonizes in this setup, so start it detached and
		// hold the command open until the server answers. If a previous server
		// is already bound to the port, preview exits fast and curl still
		// succeeds — both paths work.
		command:
			'pnpm build && sh -c \'(npx astro preview --port 4173 --host 127.0.0.1 > /dev/null 2>&1 &); until curl -sf http://127.0.0.1:4173/ > /dev/null 2>&1; do sleep 0.5; done\'',
		url: 'http://127.0.0.1:4173/',
		reuseExistingServer: !process.env.CI,
		timeout: 240_000,
		stdout: 'pipe',
	},
});
