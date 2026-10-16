import type { ReactExercise } from "./types";

import { counterExercise } from "./exercises/counter";
import { todoExercise } from "./exercises/todo-list";
import { debounceExercise } from "./exercises/debounced-search";
import { infiniteScrollExercise } from "./exercises/infinite-scroll";
import { tabsExercise } from "./exercises/tabs";
import { localStorageExercise } from "./exercises/use-localstorage";

/** Ordered playground — counter first (warm-up), scroll in the middle. */
export const EXERCISES: ReactExercise[] = [
	counterExercise,
	todoExercise,
	debounceExercise,
	infiniteScrollExercise,
	tabsExercise,
	localStorageExercise,
];

export type { ReactExercise, Difficulty, ExerciseFile } from "./types";
export { TESTBED_FILE, INDEX_FILE, stylesFile, BASE_CSS, INDEX_JS, TESTBED_JS } from "./shared";

/**
 * Every editable path of an exercise — the files the user writes into.
 */
export function editablePaths(exercise: ReactExercise): string[] {
	return Object.keys(exercise.files).filter(
		(path) => exercise.files[path].editable === true,
	);
}

/**
 * Convert an authored exercise into Sandpack's file map:
 * - editable files keep default flags (+ `active` on the first one)
 * - helpers become readOnly; hidden unless `visible` was set
 */
export function toSandpackFiles(
	exercise: ReactExercise,
	userEdits: Record<string, string> = {},
): Record<
	string,
	{ code: string; readOnly?: boolean; hidden?: boolean; active?: boolean }
> {
	const out: Record<
		string,
		{ code: string; readOnly?: boolean; hidden?: boolean; active?: boolean }
	> = {};
	let activeAssigned = false;

	for (const [path, file] of Object.entries(exercise.files)) {
		const edited = userEdits[path] ?? null;
		const code = file.editable && edited !== null ? edited : file.code;

		if (file.editable) {
			out[path] = { code, active: !activeAssigned };
			activeAssigned = true;
		} else {
			out[path] = {
				code,
				readOnly: true,
				hidden: file.visible !== true,
			};
		}
	}

	return out;
}
