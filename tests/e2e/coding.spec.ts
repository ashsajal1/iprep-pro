import { expect, test } from '@playwright/test';

/**
 * Coding-challenge workspace: editor + sandboxed worker execution.
 * Tests drive the page through its public __iprep hooks so they work
 * identically whether Monaco loaded from CDN or the textarea fallback.
 */

async function waitForEditor(page: import('@playwright/test').Page): Promise<void> {
	await page.waitForFunction(() => {
		const w = window as any;
		return Boolean(w.__iprep) && !(document.getElementById('run-btn') as HTMLButtonElement).disabled;
	});
}

async function solveWith(
	page: import('@playwright/test').Page,
	code: string,
): Promise<void> {
	await waitForEditor(page);
	await page.evaluate((c) => (window as any).__iprep.setCode(c), code);
	await page.evaluate(() => (window as any).__iprep.run());
}

test.describe('coding challenges', () => {
	test('index lists all challenges with meta', async ({ page }) => {
		await page.goto('/coding');
		await expect(page.locator('[data-challenge-card]')).toHaveCount(14);
		await expect(page.getByText('Reverse a String')).toBeVisible();
		await expect(page.locator('[data-solved-badge]:visible')).toHaveCount(0);
	});

	test('solving a challenge shows success and persists', async ({ page }) => {
		await page.goto('/coding/reverse-string');
		await expect(page.getByRole('heading', { name: 'Reverse a String' })).toBeVisible();

		await solveWith(
			page,
			'function reverseString(str) {\n  return str.split("").reverse().join("");\n}',
		);

		const banner = page.locator('#run-banner');
		await expect(banner).toContainText('tests passing');
		await expect(banner).toContainText('challenge solved');
		await expect(page.locator('#score-line')).toContainText('4 / 4');

		const stored = await page.evaluate(() =>
			JSON.parse(localStorage.getItem('iprep.progress.v1')!),
		);
		expect(typeof stored.challenges['code-001']).toBe('number');

		// Solved badge visible on the index afterwards
		await page.goto('/coding');
		await expect(page.locator('[data-solved-badge]:visible')).toHaveCount(1);
	});

	test('wrong answers show expected vs received per test', async ({ page }) => {
		await page.goto('/coding/reverse-string');
		await solveWith(page, 'function reverseString(str) {\n  return str;\n}');

		await expect(page.locator('#run-banner')).toContainText(/failing/);
		const failedRow = page.locator('[data-row="0"]');
		await expect(failedRow).toContainText('✗');
		await expect(failedRow).toContainText('expected "olleh"');
		await expect(failedRow).toContainText('received "hello"');
	});

	test('syntax errors surface a compile banner', async ({ page }) => {
		await page.goto('/coding/reverse-string');
		await solveWith(page, 'function reverseString(str { return str;');

		await expect(page.locator('#run-banner')).toContainText('Syntax error');
	});

	test('runtime errors report the thrown message', async ({ page }) => {
		await page.goto('/coding/reverse-string');
		await solveWith(page, 'function reverseString(str) {\n  throw new TypeError("boom");\n}');

		const row = page.locator('[data-row="0"]');
		await expect(row).toContainText('✗');
		await expect(row).toContainText('TypeError: boom');
	});

	test('infinite loops are terminated by the timeout guard', async ({ page }) => {
		test.setTimeout(20_000);
		await page.goto('/coding/fibonacci');
		await solveWith(
			page,
			'function fib(n) {\n  let x = true;\n  while (x) { /* forever */ }\n  return n;\n}',
		);

		await expect(page.locator('#run-banner')).toContainText(/Timed out.*infinite loop/s, {
			timeout: 10_000,
		});
	});

	test('console.log output is captured from inside the worker', async ({ page }) => {
		await page.goto('/coding/reverse-string');
		await solveWith(
			page,
			'function reverseString(str) {\n  console.log("working on", str);\n  return [...str].reverse().join("");\n}',
		);
		await expect(page.locator('#console-output')).toContainText('working on hello');
	});
});
