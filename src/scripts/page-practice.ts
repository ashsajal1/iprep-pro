import { setAssessment, setLastCategory, displayStreak, loadProgress } from '../lib/progress';

/* ------------------------------------------------------------------ */
/* Practice runner — Learn / Practice / Quick modes                    */
/* ------------------------------------------------------------------ */

interface RunnerQuestion {
	id: string;
	category: string;
	topic: string;
	question: string;
	difficulty: 'beginner' | 'intermediate' | 'advanced';
	shortAnswer: string;
	explanation: string;
	example?: string;
	exampleLanguage?: string;
	interviewTip?: string;
	commonMistakes?: string[];
	categoryName: string;
	topicName: string;
}

const mountNode = document.getElementById('practice-runner');
if (mountNode) {
	const mount = mountNode;
	const categoryId = mount.dataset.category ?? 'all';

	// Mode is read from the URL at runtime (pages are statically generated).
	const VALID_MODES = ['learn', 'practice', 'quick'];
	const urlMode = new URLSearchParams(window.location.search).get('mode');
	const mode: 'learn' | 'practice' | 'quick' = VALID_MODES.includes(urlMode ?? '')
		? (urlMode as 'learn' | 'practice' | 'quick')
		: 'learn';

	// Highlight the active mode tab.
	document.querySelectorAll<HTMLElement>('[data-mode-tab]').forEach((tab) => {
		const active = tab.dataset.modeTab === mode;
		tab.classList.toggle('bg-surface', active);
		tab.classList.toggle('text-ink', active);
		tab.classList.toggle('shadow-xs', active);
		if (active) tab.setAttribute('aria-current', 'page');
		else tab.removeAttribute('aria-current');
	});

	interface QueueItem {
		q: RunnerQuestion;
		result?: 'known' | 'review';
		revealed: boolean;
	}

	let queue: QueueItem[] = [];
	let index = 0;
	let finished = false;
	let allQuestions: RunnerQuestion[] = [];
	let lastDifficulty: string | undefined;
	let started = mode !== 'practice'; // practice mode shows a difficulty picker first

	const DIFF_CLASS: Record<string, string> = {
		beginner: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-400/20',
		intermediate: 'bg-amber-50 text-amber-700 ring-amber-600/25 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-400/20',
		advanced: 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-400/20',
	};

	function esc(s: string): string {
		return s
			.replaceAll('&', '&amp;')
			.replaceAll('<', '&lt;')
			.replaceAll('>', '&gt;')
			.replaceAll('"', '&quot;');
	}

	function codeBlock(code: string): string {
		return `<pre class="overflow-x-auto rounded-xl border border-line bg-zinc-50 p-4 font-mono text-[13px] leading-relaxed dark:bg-zinc-900"><code>${esc(code.trim())}</code></pre>`;
	}

	function answerHtml(q: RunnerQuestion): string {
		return `
			<div class="mt-8 space-y-5 animate-fade-in" data-answer>
				<section class="rounded-2xl border border-line bg-surface p-5">
					<h3 class="text-xs font-semibold tracking-wide text-indigo-600 uppercase dark:text-indigo-400">Short answer</h3>
					<p class="mt-2 text-[15px] leading-relaxed font-medium">${esc(q.shortAnswer)}</p>
				</section>
				<section class="rounded-2xl border border-line bg-surface p-5">
					<h3 class="text-xs font-semibold tracking-wide text-indigo-600 uppercase dark:text-indigo-400">Explanation</h3>
					<p class="mt-2 text-[15px] leading-relaxed text-[color:var(--ink-secondary)]">${esc(q.explanation)}</p>
				</section>
				${q.example ? codeBlock(q.example) : ''}
				${q.interviewTip ? `
				<section class="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-5 dark:border-indigo-900/60 dark:bg-indigo-950/30">
					<h3 class="text-xs font-semibold tracking-wide text-indigo-700 uppercase dark:text-indigo-300">Interview tip</h3>
					<p class="mt-2 text-[15px] leading-relaxed text-[color:var(--ink-secondary)] dark:text-zinc-300">${esc(q.interviewTip)}</p>
				</section>` : ''}
				${q.commonMistakes?.length ? `
				<section class="rounded-2xl border border-line bg-surface p-5">
					<h3 class="text-xs font-semibold tracking-wide text-rose-600 uppercase dark:text-rose-400">Common mistakes</h3>
					<ul class="mt-2 space-y-2">
						${q.commonMistakes.map((m) => `
							<li class="flex items-start gap-2 text-sm leading-relaxed text-[color:var(--ink-secondary)]">
								<span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400"></span>${esc(m)}
							</li>`).join('')}
					</ul>
				</section>` : ''}
				<a href="/questions/${q.id}" class="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
					View full question page →
				</a>
			</div>`;
	}

	function questionCard(item: QueueItem): string {
		const { q } = item;
		return `
			<article class="card p-6 sm:p-8" data-qid="${q.id}">
				<div class="flex flex-wrap items-center gap-2">
					<span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${DIFF_CLASS[q.difficulty]}">
						<span class="h-1.5 w-1.5 rounded-full bg-current opacity-70"></span>
						${q.difficulty[0].toUpperCase() + q.difficulty.slice(1)}
					</span>
					<span class="chip bg-surface-raised text-[color:var(--ink-secondary)]">${esc(categoryLabel(q))}</span>
					<span class="hidden chip bg-surface-raised text-[color:var(--ink-muted)] sm:inline-flex">${esc(topicLabel(q))}</span>
				</div>

				<h1 class="mt-4 text-xl leading-snug font-semibold tracking-tight text-balance sm:text-2xl">${esc(q.question)}</h1>

				${item.revealed
					? answerHtml(q)
					: mode === 'learn'
						? ''
						: `<div class="mt-6 rounded-2xl border-2 border-dashed border-line p-8 text-center">
							<p class="text-sm font-medium text-[color:var(--ink-secondary)]">Take a moment.</p>
							<p class="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-[color:var(--ink-muted)]">
								Say your answer out loud before revealing — retrieval is what makes it stick.
							</p>
						</div>`}
			</article>`;
	}

	let labelsCache: Record<string, { cat: string; topic: string }> = {};
	function categoryLabel(q: RunnerQuestion): string {
		if (!categoryId || categoryId === 'all') return labelsCache[q.id]?.cat ?? q.category;
		return q.categoryName;
	}
	function topicLabel(q: RunnerQuestion): string {
		return q.topicName ?? '';
	}

	function controlsHtml(item: QueueItem): string {
		const revealed = item.revealed || mode === 'learn';
		if (!revealed) {
			return `
				<button type="button" data-action="reveal" class="btn btn-primary px-6 py-3 w-full sm:w-auto">
					Show Answer <span class="kbd !border-0 !bg-white/15 !text-white hidden sm:inline-flex">Space</span>
				</button>
				<button type="button" data-action="next" class="btn btn-ghost px-4 py-3">Skip</button>`;
		}
		if (mode === 'learn') {
			return `
				<button type="button" data-action="know" class="btn btn-success px-5 py-3">Mark as Learned</button>
				<button type="button" data-action="review" class="btn btn-danger-soft px-5 py-3">Still Learning</button>
				<button type="button" data-action="next" class="btn btn-secondary px-5 py-3 ml-auto">Next <span class="kbd hidden sm:inline-flex">→</span></button>`;
		}
		return `
			<button type="button" data-action="know" class="btn btn-success px-5 py-3">
				I Know This <span class="kbd !border-0 !bg-white/15 !text-white hidden sm:inline-flex">1</span>
			</button>
			<button type="button" data-action="review" class="btn btn-danger-soft px-5 py-3">
				Need to Learn <span class="kbd hidden sm:inline-flex">2</span>
			</button>
			<button type="button" data-action="next" class="btn btn-ghost px-4 py-3 ml-auto">Skip <span class="kbd hidden sm:inline-flex">→</span></button>`;
	}

	function render(): void {
		const bar = document.querySelector<HTMLElement>('[data-progress-bar]');
		const meta = document.getElementById('runner-meta');

		if (finished) {
			renderSummary();
			if (bar) bar.style.width = '100%';
			return;
		}

		if (!started) {
			renderDifficultyPicker();
			if (bar) bar.style.width = '0%';
			return;
		}

		const item = queue[index];
		meta!.textContent = `Question ${index + 1} of ${queue.length}`;
		if (bar) bar.style.width = `${Math.round(((index) / Math.max(queue.length - 1, 1)) * 100)}%`;

		mount.innerHTML = `
			<div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
				<div class="min-w-0">
					${questionCard(item)}
					<div class="mt-5 flex flex-wrap items-center gap-3">${controlsHtml(item)}</div>
				</div>
				<aside class="space-y-4 lg:sticky lg:top-24 lg:self-start">
					<div class="card p-5">
						<h2 class="text-xs font-semibold tracking-wide text-ink-muted uppercase">This session</h2>
						<dl class="mt-3 space-y-2 text-sm">
							<div class="flex justify-between"><dt class="text-ink-secondary">Known</dt><dd class="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400" data-count-known>${knownCount()}</dd></div>
							<div class="flex justify-between"><dt class="text-ink-secondary">To review</dt><dd class="font-semibold tabular-nums text-amber-600 dark:text-amber-400" data-count-review>${reviewCount()}</dd></div>
							<div class="flex justify-between"><dt class="text-ink-secondary">Remaining</dt><dd class="font-semibold tabular-nums">${queue.length - index}</dd></div>
						</dl>
					</div>
					<div class="card p-5 text-center">
						<p class="flex items-center justify-center gap-1.5 text-sm font-semibold">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 text-orange-500"><path d="M12 2.5S5.5 8 5.5 13.5a6.5 6.5 0 0 0 13 0c0-1.2-.4-2.4-1.1-3.6-.9 1.7-2 2.6-3.2 2.6 1-2.5.4-6.5-2.2-10z"/></svg>
							${displayStreak(loadProgress())} day streak
						</p>
						<p class="mt-1 text-xs text-ink-muted">Every honest assessment counts.</p>
					</div>
				</aside>
			</div>`;
	}

	function knownCount(): number {
		return queue.filter((x) => x.result === 'known').length;
	}
	function reviewCount(): number {
		return queue.filter((x) => x.result === 'review').length;
	}

	function revealCurrent(): void {
		const item = queue[index];
		if (!item || item.revealed) return;
		item.revealed = true;
		render();
	}

	function assess(result: 'known' | 'review'): void {
		const item = queue[index];
		if (!item) return;
		item.result = result;
		item.revealed = true;
		setAssessment(item.q.id, result);
		next();
	}

	/** Bring the current question card to the top of the viewport, below the sticky navbar. */
	function scrollToCurrentQuestion(): void {
		requestAnimationFrame(() => {
			const card = mount.querySelector<HTMLElement>('article[data-qid]');
			if (!card) return;
			const top = card.getBoundingClientRect().top + window.scrollY - 84;
			window.scrollTo({ top: Math.max(top, 0), behavior: 'auto' });
		});
	}

	function next(): void {
		if (!started || queue.length === 0) return;
		if (index >= queue.length - 1) {
			finished = true;
			render();
			window.scrollTo({ top: 0, behavior: 'auto' });
			return;
		}
		index++;
		render();
		scrollToCurrentQuestion();
	}

	function restart(): void {
		buildQueue(lastDifficulty);
		finished = false;
		index = 0;
		render();
		scrollToCurrentQuestion();
	}

	function buildQueue(difficulty?: string): void {
		let pool = [...allQuestions];
		if (difficulty && difficulty !== 'all') {
			pool = pool.filter((q) => q.difficulty === difficulty);
		}
		if (mode === 'quick') {
			shuffle(pool);
			pool = pool.slice(0, Math.min(10, pool.length));
		}
		queue = pool.map((q) => ({ q, revealed: false }));
	}

	function renderDifficultyPicker(): void {
		const meta = document.getElementById('runner-meta');
		if (meta) meta.textContent = 'Choose difficulty';
		mount.innerHTML = `
			<div class="mx-auto max-w-md animate-fade-in text-center">
				<h1 class="text-xl font-semibold tracking-tight sm:text-2xl">How confident are you feeling?</h1>
				<p class="mt-2 text-sm text-ink-secondary">Pick a level to drill — you see only the question until you reveal.</p>
				<div class="mt-8 grid gap-3">
					<button type="button" data-difficulty="beginner" class="card flex items-center justify-between p-4 text-left transition-colors hover:border-emerald-300 dark:hover:border-emerald-700">
						<span><span class="block font-medium">Beginner</span><span class="text-xs text-ink-muted">Warm up with fundamentals</span></span>
						<span class="chip bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">Easy</span>
					</button>
					<button type="button" data-difficulty="intermediate" class="card flex items-center justify-between p-4 text-left transition-colors hover:border-amber-300 dark:hover:border-amber-700">
						<span><span class="block font-medium">Intermediate</span><span class="text-xs text-ink-muted">The core interview range</span></span>
						<span class="chip bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">Medium</span>
					</button>
					<button type="button" data-difficulty="advanced" class="card flex items-center justify-between p-4 text-left transition-colors hover:border-rose-300 dark:hover:border-rose-700">
						<span><span class="block font-medium">Advanced</span><span class="text-xs text-ink-muted">Senior-level deep dives</span></span>
						<span class="chip bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400">Hard</span>
					</button>
					<button type="button" data-difficulty="all" class="btn btn-secondary mt-2 w-full py-3">Mixed — all levels (${allQuestions.length} questions)</button>
				</div>
			</div>`;

		mount.querySelectorAll<HTMLButtonElement>('[data-difficulty]').forEach((btn) => {
			btn.addEventListener('click', () => {
				lastDifficulty = btn.dataset.difficulty;
				buildQueue(lastDifficulty);
				started = true;
				index = 0;
				render();
				scrollToCurrentQuestion();
			});
		});
	}

	function shuffle<T>(arr: T[]): void {
		for (let i = arr.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[arr[i], arr[j]] = [arr[j], arr[i]];
		}
	}

	function renderSummary(): void {
		const known = knownCount();
		const review = reviewCount();
		const total = queue.length;
		const pct = total ? Math.round((known / total) * 100) : 0;

		mount.innerHTML = `
			<div class="mx-auto max-w-xl animate-fade-in text-center">
				<div class="mb-6 inline-grid place-items-center">
					<span class="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" class="h-7 w-7"><polyline points="20 6 9 17 4 12"/></svg>
					</span>
				</div>
				<h1 class="text-2xl font-semibold tracking-tight">Session complete!</h1>
				<p class="mt-2 text-sm text-ink-secondary">
					You practiced ${total} question${total === 1 ? '' : 's'}.
					Completion: <strong>${pct}%</strong>
				</p>

				<div class="mt-8 grid grid-cols-2 gap-4">
					<div class="card p-5">
						<p class="text-3xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">${known}</p>
						<p class="mt-1 text-xs font-medium text-ink-muted">Known answers</p>
					</div>
					<div class="card p-5">
						<p class="text-3xl font-bold tabular-nums text-amber-600 dark:text-amber-400">${review}</p>
						<p class="mt-1 text-xs font-medium text-ink-muted">To review later</p>
					</div>
				</div>

				<div class="mt-8 flex flex-wrap items-center justify-center gap-3">
					<button type="button" id="retry-btn" class="btn btn-primary px-6 py-3">
						${mode === 'quick' ? 'New random round' : 'Practice again'}
					</button>
					<a href="/progress" class="btn btn-secondary px-6 py-3">View progress</a>
					<a href="/practice" class="btn btn-ghost px-6 py-3">Change track</a>
				</div>

				${review > 0 ? `
				<div class="card mt-8 p-5 text-left">
					<h2 class="text-sm font-semibold">Flagged for review</h2>
					<ul class="mt-3 space-y-2">
						${queue.filter((x) => x.result === 'review').map((x) => `
							<li>
								<a href="/questions/${x.q.id}" class="block truncate rounded-lg px-3 py-2 text-sm hover:bg-surface-raised">
									<span class="chip mr-2 bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">Review</span>
									${esc(x.q.question)}
								</a>
							</li>`).join('')}
					</ul>
				</div>` : ''}
			</div>`;

		document.getElementById('retry-btn')?.addEventListener('click', restart);
	}

	/* ---- event delegation ------------------------------------------------ */

	mount.addEventListener('click', (e) => {
		const target = e.target as HTMLElement;
		const action = target.closest<HTMLElement>('[data-action]')?.dataset.action;
		if (!action) return;
		if (action === 'reveal') revealCurrent();
		else if (action === 'know') assess('known');
		else if (action === 'review') assess('review');
		else if (action === 'next') next();
	});

	document.addEventListener('keydown', (e) => {
		if (!started || finished) return;
		if (document.getElementById('search-modal')?.classList.contains('hidden') === false) return;
		if ((e.target as HTMLElement).closest('input, textarea')) return;

		const item = queue[index];
		if (e.code === 'Space' && item && !(item.revealed || mode === 'learn')) {
			e.preventDefault();
			revealCurrent();
		} else if (e.key === '1' && item && (item.revealed || mode === 'learn')) {
			e.preventDefault();
			assess('known');
		} else if (e.key === '2' && item && (item.revealed || mode === 'learn')) {
			e.preventDefault();
			assess('review');
		} else if (e.key === 'ArrowRight') {
			e.preventDefault();
			next();
		}
	});

	/* ---- boot ------------------------------------------------------------ */

	async function boot(): Promise<void> {
		try {
			const res = await fetch(`/api/questions/${categoryId}.json`);
			const data = (await res.json()) as { questions: RunnerQuestion[] };
			allQuestions = data.questions;

			if (categoryId === 'all') {
				try {
					const idxRes = await fetch('/search-index.json');
					const entries = (await idxRes.json()) as { id: string; topicName: string; catName: string }[];
					labelsCache = Object.fromEntries(
						entries.map((en) => [en.id, { cat: en.catName, topic: en.topicName }]),
					);
				} catch {}
			}

			if (data.questions.length === 0) {
				mount.innerHTML = '<div class="card p-12 text-center text-sm text-ink-muted">No questions available yet for this track.</div>';
				return;
			}

			setLastCategory(categoryId);
			buildQueue();
			render();
		} catch {
			mount.innerHTML = '<div class="card p-12 text-center text-sm text-ink-muted">Could not load questions. Please refresh and try again.</div>';
		}
	}

	boot();
}