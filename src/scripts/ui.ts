import '../styles/global.css';
import { CATEGORY_PREFIXES, displayStreak, loadProgress, onProgressChange, toggleFavorite } from '../lib/progress';

/* ---- theme ------------------------------------------------------------ */

function bindTheme(): void {
	document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
		btn.addEventListener('click', () => {
			const isDark = document.documentElement.classList.toggle('dark');
			localStorage.setItem('iprep.theme', isDark ? 'dark' : 'light');
			window.dispatchEvent(new Event('iprep:theme-changed'));
		});
	});
}

/* ---- mobile menu -------------------------------------------------------- */

function bindMobileMenu(): void {
	const toggle = document.querySelector('[data-mobile-toggle]');
	const menu = document.getElementById('mobile-menu');
	if (!toggle || !menu) return;
	toggle.addEventListener('click', () => {
		const open = menu.classList.toggle('hidden') === false;
		toggle.setAttribute('aria-expanded', String(open));
		toggle.querySelector('[data-icon-open]')?.classList.toggle('hidden', open);
		toggle.querySelector('[data-icon-close]')?.classList.toggle('hidden', !open);
	});
}

/* ---- navbar streak -------------------------------------------------------- */

function paintStreak(): void {
	const n = displayStreak(loadProgress());
	document.querySelectorAll<HTMLElement>('[data-streak-count]').forEach((el) => {
		el.textContent = String(n);
	});
	document.querySelectorAll<HTMLElement>('[data-streak-label]').forEach((el) => {
		el.textContent = n === 1 ? 'day' : 'days';
	});
}

/* ---- localStorage progress UI sync ------------------------------------- */

interface ProgressSnapshot {
	completed: Record<string, number>;
	review: Record<string, number>;
	favorites: Record<string, number>;
}

function readProgress(): ProgressSnapshot {
	try {
		const parsed = JSON.parse(localStorage.getItem('iprep.progress.v1') ?? '{}') as Partial<ProgressSnapshot>;
		return {
			completed: parsed.completed ?? {},
			review: parsed.review ?? {},
			favorites: parsed.favorites ?? {},
		};
	} catch {
		return { completed: {}, review: {}, favorites: {} };
	}
}

function readCategoryTotals(): Record<string, number> {
	const el = document.querySelector('script[data-category-totals]');
	if (!el) return {};
	try {
		return JSON.parse(el.textContent ?? '{}');
	} catch {
		return {};
	}
}

const ALL_STATUS_CLASSES = [
	'text-[color:var(--ink-muted)]',
	'text-emerald-600', 'dark:text-emerald-400',
	'text-amber-600', 'dark:text-amber-400',
];

function syncProgressUI(): void {
	const state = readProgress();

	document.querySelectorAll<HTMLButtonElement>('[data-favorite-button]').forEach((btn) => {
		const active = Boolean(state.favorites[btn.dataset.favoriteButton!]);
		btn.setAttribute('aria-pressed', String(active));
		btn.setAttribute(
			'aria-label',
			active ? 'Remove from favorites' : 'Add to favorites',
		);
	});

	document.querySelectorAll<HTMLElement>('[data-question-card]').forEach((card) => {
		const id = card.dataset.qid!;
		const statusEl = card.querySelector<HTMLElement>('[data-status-indicator]');
		if (!statusEl) return;
		statusEl.classList.remove(...ALL_STATUS_CLASSES);

		if (state.completed[id]) {
			statusEl.classList.add('text-emerald-600', 'dark:text-emerald-400');
			statusEl.innerHTML =
				'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="h-3.5 w-3.5"><polyline points="20 6 9 17 4 12"/></svg> Completed';
		} else if (state.review[id]) {
			statusEl.classList.add('text-amber-600', 'dark:text-amber-400');
			statusEl.innerHTML =
				'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-3.5 w-3.5"><path d="M12 2.5S5.5 8 5.5 13.5a6.5 6.5 0 0 0 13 0c0-1.2-.4-2.4-1.1-3.6-.9 1.7-2 2.6-3.2 2.6 1-2.5.4-6.5-2.2-10z"/></svg> To review';
		} else {
			statusEl.classList.add('text-[color:var(--ink-muted)]');
			statusEl.innerHTML =
				'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-3.5 w-3.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> Not practiced yet';
		}
	});

	const totals = readCategoryTotals();
	document.querySelectorAll<HTMLElement>('[data-progress-for^="category:"]').forEach((bar) => {
		const catId = bar.dataset.progressFor!.split(':')[1];
		let total = totals[catId];
		if (total == null) {
			const card = bar.closest<HTMLElement>('[data-category-card]');
			total = card ? Number(card.dataset.total) : NaN;
		}
		const done = Object.keys(state.completed).filter((id) => {
			return CATEGORY_PREFIXES[id.split('-')[0]] === catId;
		}).length;
		const pct = total ? Math.round((done / total) * 100) : 0;

		const fill = bar.querySelector<HTMLElement>('[data-progress-bar]');
		if (fill) fill.style.width = `${pct}%`;
		bar.setAttribute('aria-valuenow', String(pct));
		const labelRow = bar.previousElementSibling;
		const valueLabel = labelRow?.querySelector('[data-progress-value]');
		if (valueLabel) valueLabel.textContent = `${pct}%`;
	});
}

document.addEventListener('iprep:progress-changed', syncProgressUI);
document.addEventListener('iprep:progress-changed', paintStreak);
window.addEventListener('storage', syncProgressUI);
window.addEventListener('storage', paintStreak);

/* Favorite buttons toggle */
document.addEventListener('click', (e) => {
	const btn = (e.target as HTMLElement).closest?.('[data-favorite-button]');
	if (!btn) return;
	e.preventDefault();
	e.stopPropagation();
	const id = btn.getAttribute('data-favorite-button')!;
	toggleFavorite(id);
	syncProgressUI();
});

syncProgressUI();
onProgressChange(paintStreak);

bindTheme();
bindMobileMenu();