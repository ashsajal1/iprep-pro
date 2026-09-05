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

/* ---- global search ------------------------------------------------------ */

interface IndexEntry {
	id: string;
	q: string;
	cat: string;
	catName: string;
	topicName: string;
	d: string;
}

let indexPromise: Promise<IndexEntry[]> | null = null;

function loadIndex(): Promise<IndexEntry[]> {
	if (!indexPromise) {
		indexPromise = fetch('/search-index.json')
			.then((r) => r.json())
			.catch(() => []);
	}
	return indexPromise;
}

const DIFF_CLASS: Record<string, string> = {
	beginner:
		'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400',
	intermediate:
		'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400',
	advanced: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400',
};

function escapeHtml(s: string): string {
	return s
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;');
}

let activeIndex = -1;
let currentResults: IndexEntry[] = [];
const MAX_RESULTS = 10;

function renderSearch(query: string): void {
	const list = document.getElementById('search-results');
	if (!list) return;
	activeIndex = -1;

	if (!query.trim()) {
		currentResults = [];
		list.innerHTML = `
			<li class="px-3 py-6 text-center text-sm text-[color:var(--ink-muted)]">
				Type to search ${''}across every question.<br/>Try “closure”, “useEffect” or “rebase”.
			</li>`;
		return;
	}

	const q = query.toLowerCase();
	loadIndex().then((entries) => {
		const scored = entries
			.map((e) => {
				const title = e.q.toLowerCase();
				let score = -1;
				if (title.startsWith(q)) score = 0;
				else if (title.includes(` ${q}`)) score = 1;
				else if (title.includes(q)) score = 2;
				else if (`${e.catName} ${e.topicName}`.toLowerCase().includes(q)) score = 3;
				return { e, score };
			})
			.filter((r) => r.score >= 0)
			.sort((a, b) => a.score - b.score)
			.slice(0, MAX_RESULTS);

		currentResults = scored.map((s) => s.e);

		if (currentResults.length === 0) {
			list.innerHTML = `
				<li class="px-3 py-8 text-center">
					<p class="text-sm font-medium">No questions match “${escapeHtml(query)}”</p>
					<p class="mt-1 text-xs text-[color:var(--ink-muted)]">Try a shorter keyword, or browse all questions.</p>
					<a href="/questions" class="mt-3 inline-block rounded-lg border border-line px-3 py-1.5 text-xs font-medium hover:bg-surface-raised">Browse all questions</a>
				</li>`;
			return;
		}

		list.innerHTML = currentResults
			.map((e, i) => {
				const idx = e.q.toLowerCase().indexOf(q);
				const title =
					idx >= 0 && q.length > 0
						? escapeHtml(e.q.slice(0, idx)) +
							'<mark class="rounded bg-indigo-100 px-0.5 text-inherit dark:bg-indigo-900/60">' +
							escapeHtml(e.q.slice(idx, idx + q.length)) +
							'</mark>' +
							escapeHtml(e.q.slice(idx + q.length))
						: escapeHtml(e.q);
				return `
				<li role="option" aria-selected="false" data-result-index="${i}">
					<a href="/questions/${e.id}" data-search-result class="flex items-start gap-3 rounded-xl px-3 py-2.5 hover:bg-surface-raised">
						<span class="chip mt-0.5 shrink-0 ${DIFF_CLASS[e.d] ?? ''}">${e.d[0].toUpperCase() + e.d.slice(1)}</span>
						<span class="min-w-0">
							<span class="block truncate text-sm font-medium">${title}</span>
							<span class="block text-xs text-[color:var(--ink-muted)]">${e.catName} · ${e.topicName}</span>
						</span>
					</a>
				</li>`;
			})
			.join('');
		highlightActive();
	});
}

function highlightActive(): void {
	document.querySelectorAll<HTMLElement>('#search-results [data-result-index]').forEach((el) => {
		const i = Number(el.dataset.resultIndex);
		const on = i === activeIndex;
		el.setAttribute('aria-selected', String(on));
		el.firstElementChild?.classList.toggle('bg-surface-raised', on);
		if (on) el.scrollIntoView({ block: 'nearest' });
	});
}

function openSearch(): void {
	const modal = document.getElementById('search-modal');
	const input = document.getElementById('search-input') as HTMLInputElement | null;
	if (!modal || !input) return;
	modal.classList.remove('hidden');
	document.body.style.overflow = 'hidden';
	renderSearch(input.value);
	input.focus();
	input.select();
}

function closeSearch(): void {
	modalCleanup();
}

function modalCleanup(): void {
	const modal = document.getElementById('search-modal');
	const input = document.getElementById('search-input') as HTMLInputElement | null;
	modal?.classList.add('hidden');
	if (document.getElementById('practice-runner') === null) document.body.style.overflow = '';
	input?.blur();
}

function bindSearch(): void {
	document.querySelectorAll('[data-search-open]').forEach((btn) =>
		btn.addEventListener('click', openSearch),
	);
	document.querySelectorAll('[data-search-close]').forEach((btn) =>
		btn.addEventListener('click', closeSearch),
	);
	document.addEventListener('keydown', (e) => {
		const modal = document.getElementById('search-modal');
		const modalOpen = modal && !modal.classList.contains('hidden');

		if ((e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) && !modalOpen) {
			const target = e.target as HTMLElement;
			const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable;
			if (!typing) {
				e.preventDefault();
				openSearch();
			}
			return;
		}
		if (!modalOpen) return;

		if (e.key === 'Escape') {
			e.preventDefault();
			closeSearch();
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			activeIndex = Math.min(activeIndex + 1, currentResults.length - 1);
			highlightActive();
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			activeIndex = Math.max(activeIndex - 1, 0);
			highlightActive();
		} else if (e.key === 'Enter') {
			e.preventDefault();
			const idx = activeIndex >= 0 ? activeIndex : 0;
			const target = currentResults[idx];
			if (target) {
				closeSearch();
				if (window.location.pathname === `/questions/${target.id}`) {
					window.scrollTo({ top: 0, behavior: 'smooth' });
				} else {
					window.location.href = `/questions/${target.id}`;
				}
			}
		}
	});

	const input = document.getElementById('search-input') as HTMLInputElement | null;
	input?.addEventListener('input', () => renderSearch(input.value));

	// Selecting a result with the mouse should always close the modal,
	// even when the target is the page we're already on.
	document.getElementById('search-results')?.addEventListener('click', (e) => {
		if ((e.target as HTMLElement).closest('[data-search-result]')) closeSearch();
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
bindSearch();