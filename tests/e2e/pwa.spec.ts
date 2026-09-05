import { expect, test } from '@playwright/test';

test.describe('pwa', () => {
	test('serves a valid web manifest with icons', async ({ page }) => {
		const response = await page.request.get('/manifest.webmanifest');
		expect(response.status()).toBe(200);
		expect(response.headers()['content-type']).toContain('json');

		const manifest = await response.json();
		expect(manifest.name).toBe('iPrep Pro');
		expect(manifest.start_url).toBe('/');
		expect(manifest.display).toBe('standalone');
		expect(manifest.icons.length).toBeGreaterThanOrEqual(2);

		for (const icon of manifest.icons) {
			const iconRes = await page.request.get(icon.src);
			expect(iconRes.status()).toBe(200);
		}
	});

	test('homepage links the manifest and icon meta', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', '/manifest.webmanifest');
		await expect(page.locator('meta[name="theme-color"]').first()).toHaveAttribute('content', '#ffffff');
	});

	test('serves the generated service worker file', async ({ page }) => {
		const response = await page.request.get('/sw.js');
		expect(response.status()).toBe(200);
		const body = await response.text();
		expect(body).toContain('PRECACHE');
		expect(body).toContain('networkFirst');
	});

	test('registers the service worker after the build', async ({ page }) => {
		await page.goto('/');
		const registered = await page.evaluate(async () => {
			if (!('serviceWorker' in navigator)) return false;
			const reg = await navigator.serviceWorker.ready;
			return Boolean(reg.active);
		});
		expect(registered).toBe(true);
	});

	test('precaches the offline fallback page', async ({ page }) => {
		await page.goto('/');
		const isCached = await page.evaluate(async () => {
			await navigator.serviceWorker.ready;
			const names = await caches.keys();
			const pageCache = names.find((n) => n.startsWith('iprep-pages-'));
			if (!pageCache) return false;
			const matched = await caches.match('/offline.html', { cacheName: pageCache });
			return Boolean(matched);
		});
		expect(isCached).toBe(true);
	});
});