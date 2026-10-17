import { expect, test } from '@playwright/test';
import { sandpackReady } from './live-utils';

/**
 * Live-practice tracks (react-live + nextjs-live) ride the same Sandpack
 * arena. Full compile-and-run QA happens in the QA recipe; e2e only proves
 * the routes, the track-aware chrome and cross-track storage isolation.
 */
test.describe('live practice tracks', () => {
	test('coding index lists both live-practice tracks', async ({ page }) => {
		await page.goto('/coding');
		await expect(
			page.getByRole('heading', { name: 'React live practice' }),
		).toBeVisible();
		await expect(
			page.getByRole('heading', { name: 'Next.js live practice' }),
		).toBeVisible();
	});

	test('/coding/nextjs-live redirects to the first exercise', async ({ page }) => {
		await page.goto('/coding/nextjs-live');
		await expect(page).toHaveURL(/\/coding\/nextjs-live\/app-nav$/);
	});

	test('nextjs arena shows the Next.js track with its exercises', async ({ page }) => {
		await page.goto('/coding/nextjs-live/app-nav');
		await sandpackReady(page);

		const select = page.locator('#exercise-select');
		await expect(select).toContainText('01 · Link + usePathname');
		await expect(select).toContainText('02 · Server action form');
		await expect(select).toContainText('03 · Optimistic likes');
		await expect(page.getByText('Next.js live practice · 0/3 solved')).toBeVisible();
		await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Reveal solution' })).toBeVisible();
	});

	test('react arena shows the React track label on its own storage key', async ({ page }) => {
		await page.goto('/coding/react-live/counter');
		await sandpackReady(page);

		await expect(page.getByText(/React live practice · \d\/\d solved/)).toBeVisible();
		await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible();
	});

	test('tracks persist progress under separate localStorage keys', async ({ page }) => {
		await page.goto('/coding/nextjs-live/app-nav');
		await sandpackReady(page);
		await page.evaluate(() =>
			window.localStorage.setItem(
				'iprep.nextjs-live.v1',
				JSON.stringify({ edits: {}, runs: { 'app-nav': { pass: 4, fail: 0, total: 4 } }, solved: { 'app-nav': true } }),
			),
		);
		await page.reload();
		await expect(page.getByText('Next.js live practice · 1/3 solved')).toBeVisible();
		await expect(page.locator('#exercise-select')).toContainText('4/4 tests');

		// The react track must not see the nextjs progress: in a fresh
		// context its storage simply isn't there yet.
		await page.goto('/coding/react-live/counter');
		await sandpackReady(page);
		await expect(page.getByText(/React live practice · 0\/\d solved/)).toBeVisible();
		const reactRuns = await page.evaluate(() =>
			window.localStorage.getItem('iprep.react-live.v1'),
		);
		expect(JSON.stringify(reactRuns)).not.toContain('4/4');
	});
});
