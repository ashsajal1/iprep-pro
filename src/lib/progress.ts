/**
 * Client-side progress store. Everything lives in localStorage — no accounts.
 *
 * Shape:
 * {
 *   completed: { [questionId]: timestamp },
 *   review:    { [questionId]: timestamp },   // "need to learn"
 *   favorites: { [questionId]: timestamp },
 *   history:   [{ id, ts, r }],               // recently practiced, newest first
 *   lastCategory: string,
 *   streak: { count, day }                    // day = YYYY-MM-DD
 * }
 */

export type Assessment = 'known' | 'review';

export interface HistoryItem {
	id: string;
	ts: number;
	r?: Assessment;
}

export interface ProgressState {
	completed: Record<string, number>;
	review: Record<string, number>;
	favorites: Record<string, number>;
	/** Solved coding challenges: { [challengeId]: timestamp } */
	challenges?: Record<string, number>;
	history: HistoryItem[];
	lastCategory?: string;
	streak: { count: number; day: string };
}

const STORAGE_KEY = 'iprep.progress.v1';
export const PROGRESS_EVENT = 'iprep:progress-changed';

function emptyState(): ProgressState {
	return {
		completed: {},
		review: {},
		favorites: {},
		challenges: {},
		history: [],
		streak: { count: 0, day: '' },
	};
}

export function dayKey(date = new Date()): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}

function yesterdayKey(): string {
	const d = new Date();
	d.setDate(d.getDate() - 1);
	return dayKey(d);
}

export function loadProgress(): ProgressState {
	if (typeof localStorage === 'undefined') return emptyState();
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return emptyState();
		const parsed = JSON.parse(raw) as Partial<ProgressState>;
		return { ...emptyState(), ...parsed };
	} catch {
		return emptyState();
	}
}

export function saveProgress(state: ProgressState): void {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
	document.dispatchEvent(new CustomEvent(PROGRESS_EVENT));
}

/** Read-modify-write with an event dispatched afterwards. */
export function mutateProgress(fn: (state: ProgressState) => void): ProgressState {
	const state = loadProgress();
	fn(state);
	saveProgress(state);
	return state;
}

/* ---- assessments ----------------------------------------------------- */

export function setAssessment(id: string, result: Assessment | null): void {
	mutateProgress((s) => {
		delete s.completed[id];
		delete s.review[id];
		if (result === 'known') s.completed[id] = Date.now();
		if (result === 'review') s.review[id] = Date.now();
		if (result) touchStreak(s);
		pushHistory(s, id, result ?? undefined);
	});
}

export function getAssessment(id: string): Assessment | null {
	const s = loadProgress();
	if (s.completed[id]) return 'known';
	if (s.review[id]) return 'review';
	return null;
}

/* ---- favorites -------------------------------------------------------- */

export function toggleFavorite(id: string): boolean {
	let added = false;
	mutateProgress((s) => {
		if (s.favorites[id]) delete s.favorites[id];
		else {
			s.favorites[id] = Date.now();
			added = true;
		}
	});
	return added;
}

export function isFavorite(id: string): boolean {
	return Boolean(loadProgress().favorites[id]);
}

/* ---- coding challenges -------------------------------------------------- */

export function markChallengeSolved(id: string): boolean {
	let firstSolve = false;
	mutateProgress((s) => {
		s.challenges ??= {};
		if (!s.challenges[id]) {
			s.challenges[id] = Date.now();
			firstSolve = true;
			touchStreak(s);
		}
	});
	return firstSolve;
}

export function isChallengeSolved(id: string): boolean {
	const s = loadProgress();
	return Boolean(s.challenges?.[id]);
}

/* ---- misc ------------------------------------------------------------- */

export function setLastCategory(categoryId: string): void {
	mutateProgress((s) => {
		s.lastCategory = categoryId;
	});
}

function pushHistory(s: ProgressState, id: string, r?: Assessment): void {
	s.history = s.history.filter((h, i) => !(h.id === id && i === 0));
	s.history.unshift({ id, ts: Date.now(), ...(r ? { r } : {}) });
	s.history = s.history.slice(0, 60);
}

function touchStreak(s: ProgressState): void {
	const today = dayKey();
	if (s.streak.day === today) return;
	s.streak = {
		count: s.streak.day === yesterdayKey() ? s.streak.count + 1 : 1,
		day: today,
	};
}

/** Streak shown to the user: resets visually if the last active day was before yesterday. */
export function displayStreak(s: ProgressState): number {
	if (s.streak.day === dayKey() || s.streak.day === yesterdayKey()) return s.streak.count;
	return 0;
}

/* ---- derived stats ----------------------------------------------------- */

export interface ProgressStats {
	completedCount: number;
	reviewCount: number;
	favoriteCount: number;
	total: number;
	percent: number;
	streak: number;
	categoryDone: Record<string, number>;
	categoryTotal: Record<string, number>;
}

export function computeStats(
	state: ProgressState,
	totalsByCategory: Record<string, number>,
	grandTotal: number,
): ProgressStats {
	const categoryDone: Record<string, number> = {};
	for (const id of Object.keys(state.completed)) {
		const cat = categoryOf(id);
		if (cat) categoryDone[cat] = (categoryDone[cat] ?? 0) + 1;
	}
	const completedCount = Object.keys(state.completed).length;
	const reviewCount = Object.keys(state.review).length;
	return {
		completedCount,
		reviewCount,
		favoriteCount: Object.keys(state.favorites).length,
		total: grandTotal,
		percent: grandTotal ? Math.round((completedCount / grandTotal) * 100) : 0,
		streak: displayStreak(state),
		categoryDone,
		categoryTotal: totalsByCategory,
	};
}

/** Question ids are prefixed by category (e.g. js-001 → javascript). */
export const CATEGORY_PREFIXES: Record<string, string> = {
	js: 'javascript',
	rct: 'react',
	ts: 'typescript',
	nxt: 'nextjs',
	nde: 'nodejs',
	hcs: 'html-css',
	git: 'git-github',
	beh: 'behavioral',
	sd: 'system-design',
	db: 'database',
};

export function categoryOf(id: string): string | undefined {
	return CATEGORY_PREFIXES[id.split('-')[0]];
}

/* ---- subscription helper ------------------------------------------------ */

export function onProgressChange(cb: () => void): () => void {
	const handler = () => cb();
	document.addEventListener(PROGRESS_EVENT, handler);
	window.addEventListener('storage', handler);
	cb(); // initial paint
	return () => {
		document.removeEventListener(PROGRESS_EVENT, handler);
		window.removeEventListener('storage', handler);
	};
}
