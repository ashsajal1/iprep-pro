import type {
	CategoryMeta,
	CategoryWithStats,
	CodingChallenge,
	Difficulty,
	Question,
	QuestionIndexEntry,
	RawQuestion,
	TopicMeta,
} from './types';
import { DIFFICULTY_ORDER } from './types';
import categoriesJson from '../data/categories.json';

/**
 * Content layer — the single place questions are loaded from disk.
 *
 * Every JSON file under src/data/<category>/<topic>.json is picked up
 * automatically, so adding questions is just: drop a new file (or append to an
 * existing one). Nothing else in the app needs to change.
 */
const modules = import.meta.glob('../data/**/*.json', { eager: true }) as Record<
	string,
	{ default: RawQuestion[] }
>;

export const categoryMetas = categoriesJson as unknown as CategoryMeta[];

/** All live (non "coming soon") categories. */
export const categories: CategoryMeta[] = categoryMetas.filter((c) => !c.soon);

function buildQuestions(): Question[] {
	const all: Question[] = [];
	let catOrder = 0;

	for (const cat of categories) {
		const catQuestions: Question[] = [];

		cat.topics.forEach((topic: TopicMeta, topicIdx) => {
			const path = `../data/${cat.id}/${topic.file}.json`;
			const mod = modules[path];
			if (!mod?.default) return;

			mod.default.forEach((raw) => {
				if (raw.category !== cat.id || raw.topic !== topic.id) return;
				catQuestions.push({
					...raw,
					topicName: topic.name,
					categoryName: cat.name,
					categoryIcon: cat.icon,
					order: catOrder * 100_000 + topicIdx * 1_000 + catQuestions.length,
					seq: 0,
					totalInCategory: 0,
				});
			});
		});

		catQuestions.sort((a, b) => a.order - b.order);
		catQuestions.forEach((q, i) => {
			q.seq = i + 1;
			q.totalInCategory = catQuestions.length;
		});
		all.push(...catQuestions);
		catOrder++;
	}
	return all;
}

export const allQuestions: Question[] = buildQuestions();

const questionMap = new Map(allQuestions.map((q) => [q.id, q]));

export function getCategory(id: string): CategoryMeta | undefined {
	return categoryMetas.find((c) => c.id === id);
}

export function getCategoriesWithStats(): CategoryWithStats[] {
	return categoryMetas.map((c) => ({
		...c,
		count: c.soon ? 0 : allQuestions.filter((q) => q.category === c.id).length,
	}));
}

export function getQuestionsByCategory(categoryId: string): Question[] {
	return allQuestions.filter((q) => q.category === categoryId);
}

export function getQuestionById(id: string): Question | undefined {
	return questionMap.get(id);
}

export function getRelatedQuestions(q: Question): Question[] {
	return (q.relatedQuestions ?? [])
		.map((id) => questionMap.get(id))
		.filter((x): x is Question => Boolean(x));
}

export function countByTopic(categoryId: string): Record<string, number> {
	const counts: Record<string, number> = {};
	for (const q of getQuestionsByCategory(categoryId)) {
		counts[q.topic] = (counts[q.topic] ?? 0) + 1;
	}
	return counts;
}

export interface SearchFilters {
	query?: string;
	category?: string;
	topic?: string;
	difficulty?: Difficulty | '';
}

export function searchQuestions(filters: SearchFilters): Question[] {
	const query = filters.query?.trim().toLowerCase() ?? '';
	return allQuestions.filter((q) => {
		if (filters.category && q.category !== filters.category) return false;
		if (filters.topic && q.topic !== filters.topic) return false;
		if (filters.difficulty && q.difficulty !== filters.difficulty) return false;
		if (query) {
			const haystack = `${q.question} ${q.topicName} ${q.categoryName}`.toLowerCase();
			if (!haystack.includes(query)) return false;
		}
		return true;
	});
}

export type SortMode = 'newest' | 'difficulty' | 'alphabetical' | 'progress';

export function sortQuestions(
	questions: Question[],
	mode: SortMode,
	isDone: (q: Question) => boolean = () => false,
): Question[] {
	const list = [...questions];
	switch (mode) {
		case 'alphabetical':
			list.sort((a, b) => a.question.localeCompare(b.question));
			break;
		case 'difficulty':
			list.sort(
				(a, b) =>
					DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty] ||
					a.order - b.order,
			);
			break;
		case 'progress':
			list.sort((a, b) => Number(isDone(a)) - Number(isDone(b)) || a.order - b.order);
			break;
		case 'newest':
		default:
			list.sort((a, b) => b.order - a.order);
			break;
	}
	return list;
}

/** Lightweight entries for client-side search, favorites and recents. */
export function buildSearchIndex(): QuestionIndexEntry[] {
	return allQuestions.map((q) => ({
		id: q.id,
		q: q.question,
		cat: q.category,
		catName: q.categoryName,
		topic: q.topic,
		topicName: q.topicName,
		d: q.difficulty,
		order: q.order,
	}));
}

export function topicsFor(categoryId: string): TopicMeta[] {
	return getCategory(categoryId)?.topics ?? [];
}

/* ---- coding challenges -------------------------------------------------- */

const codingModules = import.meta.glob('../data/coding/*.json', {
	eager: true,
}) as Record<string, { default: CodingChallenge[] }>;

function buildChallenges(): CodingChallenge[] {
	const list: CodingChallenge[] = [];
	for (const [path, mod] of Object.entries(codingModules)) {
		for (const c of mod.default) list.push(c);
		void path;
	}
	return list.sort((a, b) => a.id.localeCompare(b.id));
}

/** All coding challenges across every file under src/data/coding/. */
export const allChallenges: CodingChallenge[] = buildChallenges();

const challengeBySlug = new Map(allChallenges.map((c) => [c.slug, c]));

export function getChallengeBySlug(slug: string): CodingChallenge | undefined {
	return challengeBySlug.get(slug);
}
