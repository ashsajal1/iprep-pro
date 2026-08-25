export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

/** Shape of each question record inside src/data/<category>/<topic>.json */
export interface RawQuestion {
	id: string;
	category: string;
	topic: string;
	question: string;
	difficulty: Difficulty;
	shortAnswer: string;
	explanation: string;
	example?: string;
	exampleLanguage?: string;
	interviewTip?: string;
	commonMistakes?: string[];
	relatedQuestions?: string[];
}

/** Question enriched with resolved category/topic metadata + stable ordering. */
export interface Question extends RawQuestion {
	topicName: string;
	categoryName: string;
	categoryIcon: string;
	order: number;
	seq: number; // 1-based position within its category
	totalInCategory: number;
}

export interface TopicMeta {
	id: string;
	name: string;
	blurb: string;
	file: string;
}

export interface CategoryMeta {
	id: string;
	name: string;
	icon: string;
	accent: string;
	description: string;
	soon?: boolean;
	topics: TopicMeta[];
}

export interface CategoryWithStats extends CategoryMeta {
	count: number;
}

/** Lightweight record used by client search / favorites / recent lists. */
export interface QuestionIndexEntry {
	id: string;
	q: string;
	cat: string;
	catName: string;
	topic: string;
	topicName: string;
	d: Difficulty;
	order: number;
}

export const DIFFICULTY_ORDER: Record<Difficulty, number> = {
	beginner: 0,
	intermediate: 1,
	advanced: 2,
};
