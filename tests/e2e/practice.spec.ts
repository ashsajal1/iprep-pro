import { expect, test } from '@playwright/test';

test.describe('practice runner', () => {
	test('learn mode advances and marks questions learned', async ({ page }) => {
		await page.goto('/practice/javascript?mode=learn');
		await expect(page.locator('#runner-meta')).toContainText('Question 1 of 20');
		await expect(page.locator('[data-answer]')).toBeVisible(); // learn shows the answer immediately
		await expect(page.locator('#practice-runner .shiki').first()).toBeVisible(); // syntax-highlighted example

		await page.getByRole('button', { name: 'Mark as Learned' }).click();
		await expect(page.locator('#runner-meta')).toContainText('Question 2 of 20');

		// Card lands below the sticky header after advancing
		const top = await page
			.locator('#practice-runner article')
			.evaluate((el) => Math.round(el.getBoundingClientRect().top));
		expect(top).toBeGreaterThanOrEqual(60);

		const stored = await page.evaluate(() =>
			JSON.parse(localStorage.getItem('iprep.progress.v1')!),
		);
		expect(typeof stored.completed['js-001']).toBe('number');
	});

	test('practice mode requires a difficulty choice, then reveal + assess', async ({ page }) => {
		await page.goto('/practice/javascript?mode=practice');
		await expect(page.getByText('How confident are you feeling?')).toBeVisible();

		await page.click('[data-difficulty="intermediate"]');
		await expect(page.locator('#runner-meta')).toContainText('Question 1 of');
		await expect(page.locator('[data-answer]')).toHaveCount(0); // hidden until reveal

		await page.getByRole('button', { name: 'Show Answer' }).click();
		await expect(page.locator('[data-answer]')).toBeVisible();
		await page.getByRole('button', { name: 'I Know This' }).click();
		await expect(page.locator('[data-count-known]')).toHaveText('1');
	});

	test('mode tabs deep-link correctly', async ({ page }) => {
		await page.goto('/practice/react?mode=learn');
		await expect(page.locator('[data-mode-tab="learn"]')).toHaveAttribute(
			'aria-current',
			'page',
		);
		await page.locator('[data-mode-tab="practice"]').click();
		await expect(page).toHaveURL(/mode=practice$/);
		await expect(page.getByText('How confident are you feeling?')).toBeVisible();
	});

	test('finishing a learn session lands on the summary', async ({ page }) => {
		await page.goto('/practice/javascript?mode=learn');
		for (let i = 0; i < 20; i++) {
			await page.locator('[data-action="know"]').click();
			await page.waitForTimeout(60);
		}

		await expect(page.getByRole('heading', { name: 'Session complete!' })).toBeVisible();
		await expect(page.getByText(/Completion:/)).toContainText('100%');
		await expect(page.locator('#retry-btn')).toBeVisible();
	});
});
