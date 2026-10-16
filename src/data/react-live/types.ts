export type Difficulty = "Easy" | "Medium" | "Hard";

/**
 * A file that ships with an exercise sandbox.
 *
 * Files are served into the Sandpack editor with these conventions:
 *  - `editable: true`  → the user writes here (visible tab, no TODO lock)
 *  - everything else   → readOnly + hidden (helpers, styles, specs)
 *  - `visible: true`   → non-editable but worth peeking at (e.g. the mock API)
 */
export interface ExerciseFile {
	code: string;
	/** The user edits this file. */
	editable?: boolean;
	/** Show as a read-only tab even when not editable. */
	visible?: boolean;
}

export interface ReactExercise {
	/** URL/stability id, e.g. "infinite-scroll". */
	id: string;
	/** 1-based display order. */
	num: number;
	title: string;
	tagline: string;
	difficulty: Difficulty;
	/** Small chips under the title, e.g. "useEffect", "IntersectionObserver". */
	concepts: string[];
	/** The story behind the task (whitespace-pre-line rendered). */
	brief: string;
	/** Testable contract — what the hidden specs look for. */
	requirements: string[];
	hints: string[];
	/** Full sandbox file map (paths start with "/"). */
	files: Record<string, ExerciseFile>;
	/** path → replacement code, applied when the user reveals the solution. */
	solution: Record<string, string>;
}
