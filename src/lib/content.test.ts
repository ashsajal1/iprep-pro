import { describe, expect, it } from 'vitest';
import {
	allQuestions,
	buildSearchIndex,
	categories,
	categoryMetas,
	countByTopic,
	getCategoriesWithStats,
	getCategory,
	getQuestionById,
	getQuestionsByCategory,
	getRelatedQuestions,
	searchQuestions,
	sortQuestions,
} from './content';
import { DIFFICULTY_ORDER } from './types';
import type { Difficulty, Question } from './types';

const EXPECTED_COUNTS: Record<string, number> = {
	javascript: 20,
	react: 15,
	typescript: 15,
	nextjs: 15,
	nodejs: 10,
	'html-css': 10,
	'git-github': 20,
	behavioral: 10,
	'system-design': 15,
	database: 15,
};

describe('question bank integrity', () => {
	it('loads exactly the expected number of questions', () => {
		const total = Object.values(EXPECTED_COUNTS).reduce((a, b) => a + b, 0);
		expect(allQuestions).toHaveLength(total);
	});

	it('matches the expected count per category', () => {
		for (const [catId, expected] of Object.entries(EXPECTED_COUNTS)) {
			expect(getQuestionsByCategory(catId), catId).toHaveLength(expected);
		}
	});

	it('has globally unique ids', () => {
		const ids = allQuestions.map((q) => q.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it('uses id prefixes consistent with the declared category', () => {
		const prefixToCategory: Record<string, string> = {
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
		for (const q of allQuestions) {
			const prefix = q.id.split('-')[0];
			expect(prefixToCategory[prefix], q.id).toBe(q.category);
		}
	});

	it('only uses topics declared for the category', () => {
		for (const q of allQuestions) {
			const cat = getCategory(q.category);
			expect(cat, q.id).toBeDefined();
			expect(cat!.topics.some((t) => t.id === q.topic), `${q.id} topic=${q.topic}`).toBe(true);
		}
	});

	it('only uses valid difficulty levels', () => {
		const valid = Object.keys(DIFFICULTY_ORDER);
		for (const q of allQuestions) expect(valid).toContain(q.difficulty);
	});

	it('never ships empty core fields', () => {
		for (const q of allQuestions) {
			expect(q.question.trim(), q.id).toBeTruthy();
			expect(q.shortAnswer.trim(), q.id).toBeTruthy();
			expect(q.explanation.trim(), q.id).toBeTruthy();
			for (const m of q.commonMistakes ?? []) {
				expect(m.trim(), `${q.id} mistake`).toBeTruthy();
			}
		}
	});

	it('references only existing related questions', () => {
		for (const q of allQuestions) {
			for (const rel of q.relatedQuestions ?? []) {
				expect(getQuestionById(rel), `${q.id} → ${rel}`).toBeDefined();
			}
		}
	});
});

describe('loader metadata', () => {
	it('assigns sequential numbering within each category', () => {
		for (const cat of categories) {
			const qs = getQuestionsByCategory(cat.id);
			qs.forEach((q, i) => {
				expect(q.seq).toBe(i + 1);
				expect(q.totalInCategory).toBe(qs.length);
			});
		}
	});

	it('orders questions by category, then topic order from categories.json', () => {
		const orders = allQuestions.map((q) => q.order);
		const sorted = [...orders].sort((a, b) => a - b);
		expect(orders).toEqual(sorted);

		const js = getQuestionsByCategory('javascript');
		const fundamentals = js.filter((q) => q.topic === 'fundamentals');
		const asyncs = js.filter((q) => q.topic === 'async');
		expect(Math.max(...fundamentals.map((q) => q.order))).toBeLessThan(
			Math.min(...asyncs.map((q) => q.order)),
		);
	});

	it('resolves topic/category display names onto every question', () => {
		for (const q of allQuestions) {
			expect(q.categoryName).toBe(getCategory(q.category)!.name);
			expect(q.topicName).toBeTruthy();
		}
	});
});

describe('lookups', () => {
	it('finds a question by id and returns undefined otherwise', () => {
		const q = getQuestionById('js-006');
		expect(q?.category).toBe('javascript');
		expect(getQuestionById('nope-999')).toBeUndefined();
	});

	it('returns undefined for unknown categories', () => {
		expect(getCategory('javascript')).toBeDefined();
		expect(getCategory('not-a-category')).toBeUndefined();
	});

	it('excludes coming-soon categories from live categories but keeps them in stats', () => {
		expect(categories.some((c) => c.soon)).toBe(false);
		const soon = getCategoriesWithStats().filter((c) => c.soon);
		expect(soon.length).toBeGreaterThan(0);
		for (const c of soon) expect(c.count).toBe(0);
	});

	it('counts questions per topic', () => {
		const jsCounts = countByTopic('javascript');
		const sum = Object.values(jsCounts).reduce((a, b) => a + b, 0);
		expect(sum).toBe(EXPECTED_COUNTS.javascript);

		const emptySoon = countByTopic('web-dev');
		expect(emptySoon).toEqual({});
	});
});

describe('getRelatedQuestions', () => {
	it('returns only existing questions, preserving declared order', () => {
		const withRelated = allQuestions.find(
			(q) => (q.relatedQuestions?.length ?? 0) >= 2,
		)!;
		const related = getRelatedQuestions(withRelated);
		expect(related.length).toBe(withRelated.relatedQuestions!.length);
		expect(related.map((r) => r.id)).toEqual(withRelated.relatedQuestions);
	});

	it('skips dangling references instead of throwing', () => {
		const fake: Question = {
			...getQuestionById('js-001')!,
			id: 'fake-001',
			relatedQuestions: ['js-002', 'ghost-000'],
		};
		const related = getRelatedQuestions(fake);
		expect(related.map((r) => r.id)).toEqual(['js-002']);
	});
});

describe('searchQuestions', () => {
	it('finds questions by keyword in the title', () => {
		const results = searchQuestions({ query: 'closure' });
		expect(results.length).toBeGreaterThan(0);
		expect(results.every((q) => resultsIncludes(results, q))).toBe(true);
		expect(results.some((q) => q.id === 'js-006')).toBe(true);
	});

	it('matches case-insensitively', () => {
		expect(searchQuestions({ query: 'CLOSURE' })).toHaveLength(
			searchQuestions({ query: 'closure' }).length,
		);
	});

	it('combines filters', () => {
		const reactBeginner = searchQuestions({
			query: '',
			category: 'react',
			difficulty: 'beginner',
		});
		expect(reactBeginner.length).toBeGreaterThan(0);
		expect(reactBeginner.every((q) => q.category === 'react')).toBe(true);
		expect(reactBeginner.every((q) => q.difficulty === 'beginner')).toBe(true);
	});

	it('filters by topic', () => {
		const hooks = searchQuestions({ category: 'react', topic: 'hooks' });
		expect(hooks.length).toBeGreaterThan(0);
		expect(hooks.every((q) => q.topic === 'hooks')).toBe(true);
	});

	it('returns nothing for gibberish', () => {
		expect(searchQuestions({ query: 'zzqqxxplk' })).toHaveLength(0);
	});
});

function resultsIncludes(list: Question[], q: Question): boolean {
	return list.includes(q);
}

describe('sortQuestions', () => {
	const sample = [...getQuestionsByCategory('javascript')];

	it('alphabetical sorts by title', () => {
		const sorted = sortQuestions(sample, 'alphabetical');
		const titles = sorted.map((q) => q.question.toLowerCase());
		expect(titles).toEqual([...titles].sort());
	});

	it('difficulty sorts beginner → intermediate → advanced', () => {
		const ranks = sortQuestions(sample, 'difficulty').map(
			(q) => DIFFICULTY_ORDER[q.difficulty as Difficulty],
		);
		expect(ranks).toEqual([...ranks].sort());
	});

	it('newest reverses default order', () => {
		const sorted = sortQuestions(sample, 'newest');
		const reversed = [...sample].sort((a, b) => b.order - a.order);
		expect(sorted.map((q) => q.id)).toEqual(reversed.map((q) => q.id));
	});

	it('progress pushes completed questions last', () => {
		const doneId = sample[0].id;
		const isDone = (q: Question) => q.id === doneId;
		const sorted = sortQuestions(sample, 'progress', isDone);
		expect(sorted.at(-1)!.id).toBe(doneId);
	});
});

describe('buildSearchIndex', () => {
	it('mirrors every question with lightweight fields', () => {
		const index = buildSearchIndex();
		expect(index).toHaveLength(allQuestions.length);
		const entry = index.find((e) => e.id === 'js-001')!;
		expect(entry.q).toContain('let, const');
		expect(entry.catName).toBe('JavaScript');
		expect(entry.d).toBe('beginner');
	});
});

describe('categories.json consistency', () => {
	it('declares at least one topic for every live category', () => {
		for (const cat of categories) {
			expect(cat.topics.length, cat.id).toBeGreaterThan(0);
		}
	});

	it('has a matching data file for each declared topic', () => {
		for (const cat of categories) {
			for (const t of cat.topics) {
				const count = allQuestions.filter(
					(q) => q.category === cat.id && q.topic === t.id,
				).length;
				expect(count, `${cat.id}/${t.file}`).toBeGreaterThan(0);
			}
		}
	});

	it('covers every category meta present in the file', () => {
		expect(categoryMetas.length).toBeGreaterThanOrEqual(categories.length);
	});
});
