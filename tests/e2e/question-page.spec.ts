import { expect, test } from '@playwright/test';

test.describe('question practice page', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/questions/js-006');
	});

	test('answer is in the DOM for SEO but hidden until revealed', async ({ page }) => {
		const section = page.locator('#answer-section');
		await expect(section).toBeHidden();
		await expect(section.locator('text=Short answer')).toBeAttached(); // present, not rendered
		await expect(page.getByRole('heading', { name: /closure/i })).toBeVisible();

		await page.getByRole('button', { name: 'Show Answer' }).click();
		await expect(section).toBeVisible();
		await expect(page.getByText('Detailed explanation')).toBeVisible();
		await expect(page.getByText('Interview tip')).toBeVisible();
		await expect(page.getByText('Common mistakes')).toBeVisible();
		await expect(page.locator('#think-area')).toBeHidden();
	});

	test('self-assessment persists to localStorage and updates the status pill', async ({
		page,
	}) => {
		await page.getByRole('button', { name: 'Show Answer' }).click();
		await page.getByRole('button', { name: 'I Know This' }).click();

		await expect(page.locator('#status-pill')).toContainText('know this');
		const stored = await page.evaluate(() =>
			JSON.parse(localStorage.getItem('iprep.progress.v1')!),
		);
		expect(typeof stored.completed['js-006']).toBe('number');
		expect(stored.streak.count).toBe(1);

		// Card status reflects it after reload
		await page.reload();
		await expect(page.locator('#status-pill')).toContainText('know this');
	});

	test('favorite toggles persist and appear on the favorites page', async ({ page }) => {
		const fav = page.locator('[data-favorite-button="js-006"]');
		await fav.click();
		await expect(fav).toHaveAttribute('aria-pressed', 'true');

		await page.goto('/favorites');
		await expect(page.locator('[data-unfav]')).toHaveCount(1);
		await expect(page).not.toHaveURL(/about:blank/);
		await expect(page.getByRole('heading', { name: 'Favorites' })).toBeVisible();

		await page.locator('[data-unfav]').click();
		await expect(page.getByText('No favorites yet')).toBeVisible();
	});
});
