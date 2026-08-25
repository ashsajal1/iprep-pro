import { expect, test } from '@playwright/test';

test.describe('navigation & static pages', () => {
	test('homepage renders hero, categories and how-it-works', async ({ page }) => {
		await page.goto('/');
		await expect(page).toHaveTitle(/iPrep Pro/);
		await expect(page.getByRole('heading', { name: /Master Your Next/i })).toBeVisible();
		await expect(page.locator('[data-category-card]')).toHaveCount(11); // 8 live + 3 coming soon
		await expect(page.locator('#continue-section')).toBeHidden();
	});

	test('navbar routes to every section with active state', async ({ page }) => {
		await page.goto('/');
		const mainNav = page.getByRole('navigation', { name: 'Main' });
		for (const [label, path] of [
			['Questions', '/questions'],
			['Roadmap', '/roadmap'],
			['Practice', '/practice'],
			['Progress', '/progress'],
		] as const) {
			await mainNav.getByRole('link', { name: label }).click();
			await expect(page).toHaveURL(new RegExp(path + '$'));
			await expect(
				page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: label }),
			).toHaveAttribute('aria-current', 'page');
		}
	});

	test('unknown route serves the custom 404 with a way back', async ({ page }) => {
		await page.goto('/this/page/does-not-exist');
		await expect(page.getByText('took a wrong turn')).toBeVisible();
		await page.getByRole('link', { name: 'Back to Questions' }).click();
		await expect(page).toHaveURL(/\/questions$/);
	});
});
