import { loadProgress, onProgressChange, displayStreak } from '../lib/progress';

interface IndexEntry {
	id: string;
	q: string;
	cat: string;
	catName: string;
	topicName: string;
	d: string;
}

const DIFF_DOT: Record<string, string> = {
	beginner: 'bg-emerald-500',
	intermediate: 'bg-amber-500',
	advanced: 'bg-rose-500',
};

async function loadIndex(): Promise<IndexEntry[]> {
	try {
		const res = await fetch('/search-index.json');
		return (await res.json()) as IndexEntry[];
	} catch {
		return [];
	}
}

function esc(s: string): string {
	return s
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;');
}

function rowHtml(e: IndexEntry): string {
	return `
		<li>
			<a href="/questions/${e.id}" class="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-surface-raised">
				<span class="h-2 w-2 shrink-0 rounded-full ${DIFF_DOT[e.d] ?? 'bg-zinc-400'}" title="${esc(e.d)}"></span>
				<span class="min-w-0 flex-1 truncate text-sm">${esc(e.q)}</span>
				<span class="hidden shrink-0 text-xs text-ink-muted sm:block">${e.catName}</span>
			</a>
		</li>`;
}

async function main(): Promise<void> {
	const entries = await loadIndex();
	const byId = new Map(entries.map((e) => [e.id, e]));

	const totalsEl = document.querySelector('script[data-category-totals]');
	let totals: Record<string, number> = {};
	if (totalsEl) {
		try { totals = JSON.parse(totalsEl.textContent ?? '{}'); } catch {}
	}
	const grandTotal = Object.values(totals).reduce((a: number, b) => a + b, 0);

	function paint(): void {
		const p = loadProgress();
		const completedIds = Object.keys(p.completed);
		const hasActivity =
			completedIds.length + Object.keys(p.review).length + Object.keys(p.favorites).length > 0;

		document.getElementById('dashboard-content')!.classList.toggle('hidden', !hasActivity);
		document.getElementById('dashboard-empty')!.classList.toggle('hidden', hasActivity);

		if (!hasActivity) return;

		/* Ring + headline numbers */
		const pct = grandTotal ? Math.round((completedIds.length / grandTotal) * 100) : 0;
		const ring = document.getElementById('ring')!;
		ring.style.strokeDashoffset = String(326.7 * (1 - pct / 100));
		document.getElementById('overall-pct')!.textContent = `${pct}%`;
		document.getElementById('stat-completed')!.textContent = String(completedIds.length);
		document.getElementById('stat-remaining')!.textContent = String(grandTotal - completedIds.length);
		document.getElementById('stat-streak')!.textContent = String(displayStreak(p));
		document.getElementById('stat-favorites')!.textContent = String(Object.keys(p.favorites).length);
		document.getElementById('stat-review')!.textContent = String(Object.keys(p.review).length);

		/* Category bars */
		const barsEl = document.getElementById('category-bars')!;
		barsEl.innerHTML = Object.entries(totals)
			.map(([catId, total]) => {
				let done = 0;
				for (const id of completedIds) {
					const prefixMap: Record<string, string> = {
						js: 'javascript', rct: 'react', ts: 'typescript', nxt: 'nextjs',
						nde: 'nodejs', hcs: 'html-css', git: 'git-github', beh: 'behavioral',
					};
					if (prefixMap[id.split('-')[0]] === catId) done++;
				}
				const catPct = total ? Math.round((done / total) * 100) : 0;
				const label = entries.find((en) => en.cat === catId)?.catName ?? catId;
				return `
					<div>
						<div class="mb-1.5 flex items-center justify-between text-sm">
							<span class="font-medium">${label}</span>
							<span class="text-xs tabular-nums text-ink-muted">${done} / ${total} · ${catPct}%</span>
						</div>
						<div class="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
							role="progressbar" aria-valuenow="${catPct}" aria-valuemin="0" aria-valuemax="100" aria-label="${label}">
							<div class="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-[width] duration-500 ease-out" style="width:${catPct}%"></div>
						</div>
					</div>`;
			})
			.join('');

		/* Recent */
		const recentEl = document.getElementById('recent-list')!;
		const recentEntries = p.history
			.map((h) => byId.get(h.id))
			.filter((x): x is IndexEntry => Boolean(x))
			.slice(0, 8);
		recentEl.innerHTML = recentEntries.map(rowHtml).join('');
		document.getElementById('recent-empty-hint')?.classList.toggle('hidden', recentEntries.length > 0);

		/* Suggested review */
		const reviewEl = document.getElementById('review-list')!;
		const reviewEntries = Object.keys(p.review)
			.map((id) => byId.get(id))
			.filter((x): x is IndexEntry => Boolean(x))
			.slice(0, 8);
		reviewEl.innerHTML = reviewEntries.map(rowHtml).join('');
		document.getElementById('review-empty-hint')?.classList.toggle('hidden', reviewEntries.length > 0);
	}

	paint();
	onProgressChange(paint);
}

main();