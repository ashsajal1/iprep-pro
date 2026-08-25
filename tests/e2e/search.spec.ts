import { expect, test } from '@playwright/test';

test.describe('global search', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
	});

	test('opens via the "/" shortcut and focuses the input', async ({ page }) => {
		await page.keyboard.press('/');
		await expect(page.locator('#search-modal')).toBeVisible();
		await expect(page.locator('#search-input')).toBeFocused();
	});

	test('opens from the navbar button and closes with Escape', async ({ page }) => {
		await page.locator('[data-search-open]').first().click();
		await expect(page.locator('#search-modal')).toBeVisible();
		await page.keyboard.press('Escape');
		await expect(page.locator('#search-modal')).toBeHidden();
	});

	test('finds "closure" and Enter navigates to the question', async ({ page }) => {
		await page.keyboard.press('/');
		await page.fill('#search-input', 'closure');
		const results = page.locator('#search-results a');
		await expect(results.first()).toContainText('What is a closure');
		await page.keyboard.press('Enter');
		await expect(page).toHaveURL(/\/questions\/js-006$/);
	});

	test('shows a friendly empty state for gibberish', async ({ page }) => {
		await page.keyboard.press('/');
		await page.fill('#search-input', 'zzqqxxplk');
		await expect(page.getByText(/No questions match/i)).toBeVisible();
	});
});
