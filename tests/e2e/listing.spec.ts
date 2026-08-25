import { expect, test } from '@playwright/test';

test.describe('question listing', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/questions');
	});

	test('renders the full bank with live result count', async ({ page }) => {
		await expect(page.locator('[data-question-card]')).toHaveCount(105);
		await expect(page.locator('#results-count')).toContainText('105 of 105');
	});

	test('search narrows results and empty state offers recovery', async ({ page }) => {
		await page.fill('#filter-q', 'closure');
		await expect(page.locator('[data-question-card]:visible')).toHaveCount(1);
		await expect(page.locator('#results-count')).toContainText('1 of 105');

		await page.fill('#filter-q', 'zzqqxxplk');
		await expect(page.locator('#empty-state')).toBeVisible();
		await page.getByRole('button', { name: 'Clear filters' }).last().click();
		await expect(page.locator('#empty-state')).toBeHidden();
		await expect(page.locator('[data-question-card]:visible')).toHaveCount(105);
	});

	test('category + difficulty filters combine and sync to the URL', async ({ page }) => {
		await page.selectOption('#filter-category', 'react');
		await page.selectOption('#filter-difficulty', 'beginner');
		const visible = page.locator('[data-question-card]:visible');
		const count = await visible.count();
		expect(count).toBeGreaterThan(0);
		for (const card of await visible.all()) {
			expect(await card.getAttribute('data-cat')).toBe('react');
			expect(await card.getAttribute('data-difficulty')).toBe('beginner');
		}
		await expect(page).toHaveURL(/\/questions\?category=react&difficulty=beginner/);

		// Deep link with params applies filters on load
		await page.goto('/questions?difficulty=advanced&sort=difficulty');
		const advanced = page.locator('[data-question-card]:visible');
		for (const card of await advanced.all()) {
			expect(await card.getAttribute('data-difficulty')).toBe('advanced');
		}
	});

	test('sort by difficulty orders badges beginner-first', async ({ page }) => {
		await page.selectOption('#filter-sort', 'difficulty');
		const diffs = await page
			.locator('[data-question-card] [data-difficulty]')
			.evaluateAll((els) =>
				els.slice(0, 20).map((el) => el.getAttribute('data-difficulty')),
			);
		const rank: Record<string, number> = { beginner: 0, intermediate: 1, advanced: 2 };
		const ranks = diffs.map((d) => rank[d!]);
		expect(ranks).toEqual([...ranks].sort());
	});
});
