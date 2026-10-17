/** Helpers shared by the live-practice track specs. */

/**
 * Waits until Sandpack has mounted in the arena. Sandpack is `client:only`,
 * so the provider's iframe + CodeMirror editor appear well after hydration;
 * calling tests before this would race the island.
 */
export async function sandpackReady(page: any): Promise<void> {
	await page.waitForSelector('.sp-wrapper iframe, .sp-layout iframe', {
		state: 'attached',
	});
}
