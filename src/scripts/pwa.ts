/* ---- PWA: service-worker registration + install prompt + theme color ---- */

// Service workers only make sense in production builds (dev has no /sw.js).
const canUseSW = 'serviceWorker' in navigator && !import.meta.env.DEV;

// ---- Service worker registration + update checks ----
if (canUseSW) {
	navigator.serviceWorker
		.register('/sw.js')
		.then((reg) => {
			console.log('[PWA] Service worker registered.', reg);

			// Periodically check for a new version so users get the update
			// toast without waiting for their next visit.
			setInterval(() => {
				reg.update().catch((err) => {
					console.error('[PWA] Update check failed.', err);
				});
			}, 60 * 60 * 1000);
		})
		.catch((err) => {
			console.error('[PWA] Service worker registration failed.', err);
		});
}

// ---- Update theme-color meta dynamically to match the active theme ----
function updateThemeColor(): void {
	const metas = document.querySelectorAll<HTMLMetaElement>(
		'meta[name="theme-color"]'
	);
	if (!metas.length) return;
	const dark = document.documentElement.classList.contains('dark');
	const color = dark ? '#101012' : '#ffffff';
	metas.forEach((meta) => {
		meta.content = color;
	});
}

// Listen for theme changes that the ui.ts module triggers
document.addEventListener('iprep:theme-changed', updateThemeColor);
updateThemeColor();

// ---- Install prompt ----
// Astro reloads this module on every full-page navigation, which would spawn
// a fresh install toast per page. Persist the user's choice in sessionStorage
// (tab-session scoped) so a dismissed prompt stays dismissed across pages.
const installState = sessionStorage.getItem('iprep.pwa-install');
let deferredPrompt: any = null;
let toast: HTMLElement | null = null;

function createInstallToast(): HTMLElement {
	const el = document.createElement('div');
	el.className =
		'fixed right-4 bottom-20 z-50 flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-sm shadow-lg backdrop-blur-md';
	el.innerHTML = `
		<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M21 16V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2z"></path>
			<path d="M7 10h.01"></path>
			<path d="M11 10h.01"></path>
			<path d="M15 10h.01"></path>
			<path d="M7 14h.01"></path>
			<path d="M11 14h.01"></path>
			<path d="M15 14h.01"></path>
		</svg>
		<span>Install iPrep Pro for offline access</span>
		<button type="button" class="shrink-0 rounded-lg bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-500" data-pwa-install>Install</button>
		<button type="button" class="shrink-0 text-ink-secondary hover:text-ink" data-pwa-dismiss>
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M18 6 6 18M6 6l12 12"></path>
			</svg>
		</button>
	`;
	return el;
}

window.addEventListener('beforeinstallprompt', (e: any) => {
	e.preventDefault();
	deferredPrompt = e;

	// Already dismissed (this session) or visible — do not nag again.
	if (installState === 'dismissed' || toast) return;

	toast = createInstallToast();
	document.body.appendChild(toast);

	const installBtn = toast.querySelector('[data-pwa-install]') as HTMLButtonElement;
	const dismissBtn = toast.querySelector('[data-pwa-dismiss]') as HTMLButtonElement;

	installBtn.addEventListener('click', async () => {
		toast?.remove();
		toast = null;
		deferredPrompt?.prompt();
		const { outcome } = await deferredPrompt!.userChoice;
		deferredPrompt = null;
		sessionStorage.setItem(
			'iprep.pwa-install',
			outcome === 'accepted' ? 'accepted' : 'dismissed'
		);
		if (outcome === 'accepted') {
			console.log('PWA installed');
		}
	});

	dismissBtn.addEventListener('click', () => {
		toast?.remove();
		toast = null;
		sessionStorage.setItem('iprep.pwa-install', 'dismissed');
	});
});

// Auto-hide install toast when the app is successfully installed
window.addEventListener('appinstalled', () => {
	if (toast) {
		toast.remove();
		toast = null;
	}
	deferredPrompt = null;
	sessionStorage.setItem('iprep.pwa-install', 'accepted');
});

// ---- Update notification ----
// Only pages already controlled by a service worker can genuinely report a new
// version. On first-ever install, clients.claim() would otherwise fire
// controllerchange spuriously and show a false update toast.
const hadController = 'serviceWorker' in navigator && Boolean(navigator.serviceWorker.controller);

if ('serviceWorker' in navigator) {
	navigator.serviceWorker.addEventListener('controllerchange', () => {
		if (!hadController) return;

		const newVersionToast = document.createElement('div');
		newVersionToast.className =
			'fixed right-4 bottom-20 z-50 flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-sm shadow-lg backdrop-blur-md pwa-update-toast';
		newVersionToast.innerHTML = `
			<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M12 2v4m0 0 2-2m-2 2-2-2M4 12a8 8 0 0 1 14.45-4.45"></path>
			</svg>
			<span>New version available. Refresh to update.</span>
			<button type="button" class="shrink-0 rounded-lg bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-500">Reload</button>
		`;
		const existing = document.querySelector('.pwa-update-toast');
		existing?.remove();
		document.body.appendChild(newVersionToast);

		const reloadBtn = newVersionToast.querySelector('button') as HTMLButtonElement;
		reloadBtn.addEventListener('click', () => location.reload());
	});
}