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
		// `astro preview` daemonizes here, so: build, start it detached, wait
		// until it answers, then hold this process open for the test run.
		// If a previous server already owns the port, preview exits fast and
		// the readiness loop still succeeds.
		command:
			'pnpm build && sh -c \'(npx astro preview --port 4173 --host 127.0.0.1 > /dev/null 2>&1 &); for i in $(seq 1 240); do curl -sf http://127.0.0.1:4173/ > /dev/null 2>&1 && break; sleep 0.5; done; exec tail -f /dev/null\'',
		url: 'http://127.0.0.1:4173/',
		reuseExistingServer: !process.env.CI,
		timeout: 240_000,
		stdout: 'pipe',
	},
});
