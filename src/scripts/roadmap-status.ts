import { loadProgress } from '../lib/progress';

/**
 * Computes completed / current / upcoming statuses for every [data-roadmap]
 * list on the page. Each li[data-topic] carries its build-time question ids
 * (data-ids JSON) — combined with local progress no network index is needed.
 */
export function paintRoadmaps(): Promise<void> {
	const p = loadProgress();

	document.querySelectorAll<HTMLElement>('[data-roadmap]').forEach((list) => {
		const items = Array.from(list.querySelectorAll<HTMLElement>('li[data-topic]'));
		let currentAssigned = false;

		items.forEach((li, i) => {
			const total = Number(li.dataset.total);

			let ids: string[] = [];
			try {
				ids = JSON.parse(li.dataset.ids ?? '[]') as string[];
			} catch {}
			const done = ids.filter((id) => p.completed[id]).length;
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

	return Promise.resolve();
}
