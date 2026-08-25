import { loadProgress } from '../lib/progress';

interface IndexEntry {
	id: string;
	q: string;
	cat: string;
	catName: string;
	topic: string;
	topicName: string;
	d: string;
	order: number;
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

/**
 * Computes completed / current / upcoming statuses for every [data-roadmap]
 * list on the page using the lightweight question index + local progress.
 */
export async function paintRoadmaps(): Promise<void> {
	const [entries, p] = await Promise.all([loadIndex(), Promise.resolve(loadProgress())]);

	document.querySelectorAll<HTMLElement>('[data-roadmap]').forEach((list) => {
		const items = Array.from(list.querySelectorAll<HTMLElement>('li[data-topic]'));
		let currentAssigned = false;

		items.forEach((li, i) => {
			const topicId = li.dataset.topic!;
			const total = Number(li.dataset.total);

			let done = 0;
			for (const e of entries) {
				if (e.topic === topicId && p.completed[e.id]) done++;
			}
			li.dataset.done = String(done);

			const isComplete = total > 0 && done >= total;
			const isCurrent = !currentAssigned && !isComplete;
			if (isCurrent) currentAssigned = true;
			const isUpcoming = !isComplete && !isCurrent && i > 0;

			const node = li.querySelector<HTMLElement>('[data-node]')!;
			node.classList.remove(
				'border-emerald-500', 'bg-emerald-50', 'dark:bg-emerald-950/40',
				'border-indigo-500', 'ring-4', 'ring-indigo-500/10',
			);
			node.classList.add('border-line');
			li.classList.toggle('done', isComplete);

			for (const sel of ['[data-icon-lock]', '[data-icon-play]', '[data-icon-check]', '[data-icon-number]']) {
				li.querySelector(sel)?.classList.add('hidden');
			}

			if (isComplete) {
				node.classList.add('border-emerald-500', 'bg-emerald-50', 'dark:bg-emerald-950/40');
				li.querySelector('[data-icon-check]')?.classList.remove('hidden');
			} else if (isCurrent) {
				node.classList.remove('border-line');
				node.classList.add('border-indigo-500', 'ring-4', 'ring-indigo-500/10');
				li.querySelector('[data-icon-play]')?.classList.remove('hidden');
			} else if (isUpcoming) {
				li.querySelector('[data-icon-lock]')?.classList.remove('hidden');
			} else {
				li.querySelector('[data-icon-number]')?.classList.remove('hidden');
			}

			const countLabel = li.querySelector<HTMLElement>('[data-count-label]');
			if (countLabel) countLabel.textContent = `${done} / ${total}`;
		});
	});
}
