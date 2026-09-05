import { expect, test } from '@playwright/test';

test.describe('navigation & static pages', () => {
	test('homepage renders hero, categories and how-it-works', async ({ page }) => {
		await page.goto('/');
		await expect(page).toHaveTitle(/iPrep Pro/);
		await expect(page.getByRole('heading', { name: /Master Your Next/i })).toBeVisible();
		await expect(page.locator('[data-category-card]')).toHaveCount(11); // 11 live categories
		await expect(page.locator('#continue-section')).toBeHidden();
	});

	test('navbar shows the streak pill linking to progress', async ({ page }) => {
		await page.goto('/');
		const pill = page.locator('[data-streak-pill]');
		await expect(pill).toBeVisible();
		await expect(pill).toHaveAttribute('href', '/progress');
		await expect(pill.locator('[data-streak-count]')).toHaveText('0');
		await pill.click();
		await expect(page).toHaveURL(/\/progress$/);
	});

	test('streak pill reflects the stored streak', async ({ page }) => {
		await page.addInitScript(() => {
			const d = new Date();
			const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
			localStorage.setItem(
				'iprep.progress.v1',
				JSON.stringify({ completed: {}, review: {}, favorites: {}, history: [], streak: { count: 4, day } }),
			);
		});
		await page.goto('/');
		await expect(page.locator('[data-streak-pill] [data-streak-count]')).toHaveText('4');
		await expect(page.locator('[data-streak-pill] [data-streak-label]')).toHaveText('days');
	});

	test.describe('mobile navbar', () => {
		test.use({ viewport: { width: 390, height: 844 } });

		test('streak pill and menu streak link are visible', async ({ page }) => {
			await page.goto('/');
			await expect(page.locator('[data-streak-pill]')).toBeVisible();
			await page.getByRole('button', { name: 'Open menu' }).click();
			const menuLink = page.locator('[data-streak-menu-link]');
			await expect(menuLink).toBeVisible();
			await expect(menuLink).toHaveAttribute('href', '/progress');
		});
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
