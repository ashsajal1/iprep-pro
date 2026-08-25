import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	CATEGORY_PREFIXES,
	categoryOf,
	computeStats,
	dayKey,
	displayStreak,
	loadProgress,
	mutateProgress,
	onProgressChange,
	PROGRESS_EVENT,
	setAssessment,
	toggleFavorite,
} from './progress';

function daysAgoKey(n: number): string {
	const d = new Date();
	d.setDate(d.getDate() - n);
	return dayKey(d);
}

beforeEach(() => {
	localStorage.clear();
});

describe('loadProgress', () => {
	it('returns a fully-shaped empty state on first visit', () => {
		const s = loadProgress();
		expect(s.completed).toEqual({});
		expect(s.review).toEqual({});
		expect(s.favorites).toEqual({});
		expect(s.history).toEqual([]);
		expect(s.streak).toEqual({ count: 0, day: '' });
	});

	it('recovers gracefully from corrupted storage', () => {
		localStorage.setItem('iprep.progress.v1', '{not json');
		expect(loadProgress().completed).toEqual({});
	});
});

describe('setAssessment', () => {
	it('marks known and clears any prior review flag', () => {
		setAssessment('js-001', 'review');
		setAssessment('js-001', 'known');
		const s = loadProgress();
		expect(s.completed['js-001']).toBeTypeOf('number');
		expect(s.review['js-001']).toBeUndefined();
	});

	it('marks review and clears any prior completion', () => {
		setAssessment('js-002', 'known');
		setAssessment('js-002', 'review');
		const s = loadProgress();
		expect(s.completed['js-002']).toBeUndefined();
		expect(s.review['js-002']).toBeTypeOf('number');
	});

	it('clears both when reset to null', () => {
		setAssessment('js-003', 'known');
		setAssessment('js-003', null);
		const s = loadProgress();
		expect(s.completed['js-003']).toBeUndefined();
		expect(s.review['js-003']).toBeUndefined();
	});
});

describe('streak logic', () => {
	it('keeps the count when already active today', () => {
		mutateProgress((s) => {
			s.streak = { count: 3, day: dayKey() };
		});
		setAssessment('js-004', 'known');
		expect(loadProgress().streak.count).toBe(3);
	});

	it('increments when the last active day was yesterday', () => {
		mutateProgress((s) => {
			s.streak = { count: 3, day: daysAgoKey(1) };
		});
		setAssessment('js-005', 'known');
		expect(loadProgress().streak.count).toBe(4);
	});

	it('resets to 1 after a gap of two or more days', () => {
		mutateProgress((s) => {
			s.streak = { count: 9, day: daysAgoKey(3) };
		});
		setAssessment('js-006', 'known');
		expect(loadProgress().streak.count).toBe(1);
	});

	it('displays 0 when the stored streak is stale', () => {
		mutateProgress((s) => {
			s.streak = { count: 9, day: daysAgoKey(2) };
		});
		expect(displayStreak(loadProgress())).toBe(0);
		expect(displayStreak(loadProgress())).not.toBe(9);
	});

	it('displays the stored count for today and yesterday activity', () => {
		mutateProgress((s) => {
			s.streak = { count: 6, day: dayKey() };
		});
		expect(displayStreak(loadProgress())).toBe(6);

		mutateProgress((s) => {
			s.streak = { count: 6, day: daysAgoKey(1) };
		});
		expect(displayStreak(loadProgress())).toBe(6);
	});
});

describe('toggleFavorite', () => {
	it('adds then removes, reporting each transition', () => {
		expect(toggleFavorite('rct-001')).toBe(true);
		expect(loadProgress().favorites['rct-001']).toBeTypeOf('number');
		expect(toggleFavorite('rct-001')).toBe(false);
		expect(loadProgress().favorites['rct-001']).toBeUndefined();
	});
});

describe('history', () => {
	it('records newest first with the assessment result', () => {
		setAssessment('js-007', 'known');
		setAssessment('js-008', 'review');
		const h = loadProgress().history;
		expect(h[0]).toMatchObject({ id: 'js-008', r: 'review' });
		expect(h[1]).toMatchObject({ id: 'js-007', r: 'known' });
	});

	it('caps at 60 entries', () => {
		for (let i = 1; i <= 65; i++) {
			setAssessment(`js-0${String(i).padStart(2, '0')}`, 'known');
		}
		expect(loadProgress().history).toHaveLength(60);
	});
});

describe('event notification', () => {
	it('dispatches a change event on every mutation', () => {
		const listener = vi.fn();
		document.addEventListener(PROGRESS_EVENT, listener);
		toggleFavorite('nde-001');
		document.removeEventListener(PROGRESS_EVENT, listener);
		expect(listener).toHaveBeenCalledTimes(1);
	});

	it('onProgressChange fires immediately and on subsequent changes', () => {
		const cb = vi.fn();
		const off = onProgressChange(cb);
		expect(cb).toHaveBeenCalledTimes(1);
		toggleFavorite('git-001');
		expect(cb).toHaveBeenCalledTimes(2);
		off();
		toggleFavorite('git-001');
		expect(cb).toHaveBeenCalledTimes(2); // unsubscribed
	});
});

describe('category helpers', () => {
	it('maps id prefixes to categories', () => {
		expect(categoryOf('js-001')).toBe('javascript');
		expect(categoryOf('beh-010')).toBe('behavioral');
		expect(categoryOf('hcs-003')).toBe('html-css');
		expect(CATEGORY_PREFIXES.hcs).toBe('html-css');
		expect(categoryOf('xx-999')).toBeUndefined();
	});
});

describe('computeStats', () => {
	function seed(): void {
		mutateProgress((s: ProgressState) => {
			s.completed['js-001'] = Date.now();
			s.completed['js-002'] = Date.now();
			s.completed['rct-001'] = Date.now();
			s.review['ts-001'] = Date.now();
			s.favorites['js-003'] = Date.now();
		});
	}

	it('computes totals, percent and per-category completion', () => {
		seed();
		const stats = computeStats(loadProgress(), { javascript: 20, react: 15 }, 35);
		expect(stats.completedCount).toBe(3);
		expect(stats.percent).toBe(Math.round((3 / 35) * 100));
		expect(stats.categoryDone.javascript).toBe(2);
		expect(stats.categoryDone.react).toBe(1);
		expect(stats.reviewCount).toBe(1);
		expect(stats.favoriteCount).toBe(1);
	});
});
