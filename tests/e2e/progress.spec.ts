import { expect, test } from '@playwright/test';

test.describe('progress dashboard & roadmap', () => {
	test.beforeEach(async ({ page }) => {
		// Seed a little history so the dashboard has something to show.
		// Runs before app scripts on every navigation, so reloads keep state.
		await page.addInitScript(() => {
			localStorage.setItem(
				'iprep.progress.v1',
				JSON.stringify({
					completed: { 'js-001': 1, 'js-002': 1 },
					review: { 'js-003': 1 },
					favorites: { 'js-001': 1 },
					history: [
						{ id: 'js-003', ts: 1, r: 'review' },
						{ id: 'js-002', ts: 2, r: 'known' },
					],
					lastCategory: 'javascript',
					streak: { count: 4, day: new Date().toISOString().slice(0, 10) },
				}),
			);
		});
	});

	test('dashboard reflects seeded progress', async ({ page }) => {
		await page.goto('/progress');
		await expect(page.locator('#overall-pct')).toHaveText('1%'); // 2 / 161
		await expect(page.locator('#stat-streak')).toHaveText('4');
		await expect(page.locator('#stat-favorites')).toHaveText('1');
		await expect(page.locator('#stat-review')).toHaveText('1');
		await expect(page.locator('#category-bars')).toContainText('JavaScript');
	});

	test('recent list links to practiced questions', async ({ page }) => {
		await page.goto('/progress');
		const recent = page.locator('#recent-list a');
		await expect(recent).toHaveCount(2);
		await expect(recent.first()).toHaveAttribute('href', /js-003/);
	});

	test('homepage shows a continue-learning card from lastCategory', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('#continue-section')).toBeVisible();
		await expect(page.locator('#continue-link')).toHaveAttribute('href', '/javascript');
	});

	test('roadmap marks the first unfinished stage as current', async ({ page }) => {
		await page.goto('/javascript');
		await expect(page.locator('[data-stat="done"]')).toHaveText('2');

		const currentStage = page.locator('[data-roadmap] li').filter({
			has: page.locator('[data-icon-play]:visible'),
		});
		await expect(currentStage).toHaveCount(1);
		await expect(currentStage).toContainText('Fundamentals'); // js-001/002 live there
	});
});
