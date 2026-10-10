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
	/** Official-docs reference rendered as a "Further reading" link. */
	source?: {
		label: string;
		url: string;
	};
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

/* ---- coding challenges ------------------------------------------------- */

/** A single verification case: call `fn` with `args`, deep-compare to `expected`. */
export interface CodingTest {
	fn: string;
	args: unknown[];
	expected: unknown;
}

/** One official solution variant, e.g. an imperative vs a declarative take. */
export interface CodingSolution {
	/** Tab label shown in the solution switcher, e.g. 'Imperative'. */
	approach: string;
	code: string;
	/** Set on the single variant to prefer — rendered as a "Recommended" pill. */
	recommended?: boolean;
	/** One-line guidance on when to use this variant, shown above its code. */
	note?: string;
}

export interface CodingChallenge {
	id: string;
	slug: string;
	title: string;
	topic: string;
	difficulty: Difficulty;
	description: string;
	hints: string[];
	starterCode: string;
	solution: string;
	/**
	 * Optional alternate solution variants rendered as switchable tabs.
	 * When present, the first entry is shown by default — keep `solution`
	 * as the primary so single-solution rendering stays unchanged.
	 */
	solutions?: CodingSolution[];
	tests: CodingTest[];
}
