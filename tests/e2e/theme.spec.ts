import { expect, test } from '@playwright/test';

test.describe('theming', () => {
	test('defaults to system preference and persists manual choice', async ({ page }) => {
		await page.addInitScript(() => {
			// Force light OS preference for determinism
			window.matchMedia = (q: string) =>
				({ matches: false, media: q }) as MediaQueryList;
		});

		await page.goto('/');
		await expect(page.locator('html')).not.toHaveClass(/dark/);

		await page.locator('[data-theme-toggle]').click();
		await expect(page.locator('html')).toHaveClass(/dark/);
		expect(await page.evaluate(() => localStorage.getItem('iprep.theme'))).toBe('dark');

		// Choice survives a full reload
		await page.reload();
		await expect(page.locator('html')).toHaveClass(/dark/);

		await page.locator('[data-theme-toggle]').click();
		expect(await page.evaluate(() => localStorage.getItem('iprep.theme'))).toBe('light');
	});
});
