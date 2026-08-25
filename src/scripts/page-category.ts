import { loadProgress, onProgressChange, setLastCategory } from '../lib/progress';
import { paintRoadmaps } from './roadmap-status';

const page = document.querySelector<HTMLElement>('[data-category-total]');
if (page) {
	const catId = page.dataset.categoryTotal!;
	setLastCategory(catId);

	function paint() {
		const p = loadProgress();
		const prefix = prefixOf(catId);
		const inCat = (id: string) => id.startsWith(prefix + '-');

		let done = 0;
		for (const id of Object.keys(p.completed)) if (inCat(id)) done++;
		let review = 0;
		for (const id of Object.keys(p.review)) if (inCat(id)) review++;
		let fav = 0;
		for (const id of Object.keys(p.favorites)) if (inCat(id)) fav++;

		const total = Number(page!.dataset.categoryTotal);
		const pct = total ? Math.round((done / total) * 100) : 0;
		const fill = page!.querySelector<HTMLElement>('[data-progress-bar]');
		const label = page!.querySelector<HTMLElement>('[data-progress-value]');
		if (fill) fill.style.width = `${pct}%`;
		if (label) label.textContent = `${pct}%`;

		const set = (stat: string, value: number | string) => {
			const el = document.querySelector<HTMLElement>(`[data-stat="${stat}"]`);
			if (el) el.textContent = String(value);
		};
		set('done', done);
		set('review', review);
		set('fav', fav);
	}

	paint();
	paintRoadmaps();
	onProgressChange(() => {
		paint();
		paintRoadmaps();
	});
}

function prefixOf(categoryId: string): string {
	const map: Record<string, string> = {
		javascript: 'js',
		react: 'rct',
		typescript: 'ts',
		nextjs: 'nxt',
		nodejs: 'nde',
		'html-css': 'hcs',
		'git-github': 'git',
		behavioral: 'beh',
	};
	return map[categoryId] ?? categoryId.slice(0, 3);
}
