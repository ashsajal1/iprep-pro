import { loadProgress, onProgressChange } from '../lib/progress';

interface IndexEntry {
	id: string;
	q: string;
	cat: string;
	catName: string;
	topicName: string;
	d: string;
}

const DIFF_CLASS: Record<string, string> = {
	beginner:
		'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-400/20',
	intermediate:
		'bg-amber-50 text-amber-700 ring-amber-600/25 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-400/20',
	advanced:
		'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-400/20',
};

function esc(s: string): string {
	return s
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;');
}

async function main(): Promise<void> {
	let entries: IndexEntry[] = [];
	try {
		const res = await fetch('/search-index.json');
		entries = (await res.json()) as IndexEntry[];
	} catch {}

	const listEl = document.getElementById('fav-list')!;
	const emptyEl = document.getElementById('fav-empty')!;

	function paint(): void {
		const p = loadProgress();
		const favIds = Object.keys(p.favorites).sort(
			(a, b) => (p.favorites[b] ?? 0) - (p.favorites[a] ?? 0),
		);
		const favEntries = favIds
			.map((id) => entries.find((e) => e.id === id))
			.filter((x): x is IndexEntry => Boolean(x));

		listEl.classList.toggle('hidden', favEntries.length === 0);
		emptyEl.classList.toggle('hidden', favEntries.length > 0);

		listEl.innerHTML = favEntries
			.map(
				(e) => `
				<article class="card group relative flex flex-col p-4 transition-all duration-150 hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md dark:hover:border-indigo-800">
					<div class="mb-3 flex items-start justify-between gap-2">
						<div class="flex flex-wrap items-center gap-1.5">
							<span class="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${DIFF_CLASS[e.d] ?? ''}">
								<span class="h-1.5 w-1.5 rounded-full bg-current opacity-70"></span>
								${e.d[0].toUpperCase() + e.d.slice(1)}
							</span>
							<a href="/${e.cat}" class="chip bg-surface-raised text-[color:var(--ink-secondary)]">${e.catName}</a>
							<span class="hidden chip bg-surface-raised text-[color:var(--ink-muted)] sm:inline-flex">${esc(e.topicName)}</span>
						</div>
						<button type="button" data-unfav="${e.id}" aria-label="Remove from favorites"
							class="relative z-10 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40">
							<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-[18px] w-[18px]"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
						</button>
					</div>
					<a href="/questions/${e.id}" class="text-[15px] leading-snug font-medium after:absolute after:inset-0 group-hover:text-indigo-700 dark:group-hover:text-indigo-300">
						${esc(e.q)}
					</a>
				</article>`,
			)
			.join('');
	}

	listEl.addEventListener('click', (e) => {
		const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-unfav]');
		if (!btn) return;
		e.preventDefault();
		const id = btn.dataset.unfav!;
		try {
			const s = loadProgress();
			delete s.favorites[id];
			localStorage.setItem('iprep.progress.v1', JSON.stringify(s));
		} catch {}
		document.dispatchEvent(new CustomEvent('iprep:progress-changed'));
	});

	onProgressChange(paint);
}

main();