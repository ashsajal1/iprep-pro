/**
 * Track-agnostic plumbing for the live-coding arenas.
 *
 * `react-live` and `nextjs-live` are separate tracks — each has its own
 * exercise registry, route family and localStorage key — but they share the
 * same sandbox plumbing: one testbed (`shared.ts`), one exercise shape
 * (`types.ts`, a React-in-Sandpack exercise regardless of harness flavor).
 */
import type { ReactExercise } from "./types";

export type { Difficulty, ExerciseFile, ReactExercise } from "./types";
export {
	BASE_CSS,
	INDEX_FILE,
	INDEX_JS,
	TESTBED_FILE,
	TESTBED_JS,
	stylesFile,
} from "./shared";

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
