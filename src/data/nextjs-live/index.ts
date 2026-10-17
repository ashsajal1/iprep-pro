import type { ReactExercise } from "../live/types";

import { appNavExercise } from "./exercises/app-nav";
import { pendingFormExercise } from "./exercises/pending-form";
import { optimisticLikesExercise } from "./exercises/optimistic-likes";

/**
 * Next.js App Router drills (docs-based) running in the React Sandpack
 * sandbox. Real Next.js cannot execute in a static in-browser bundler, so the
 * App Router APIs are emulated by visible, read-only stub modules under
 * `/next/` (`./next/link`, `./next/navigation`) and `/actions.js`; the user's
 * code, contracts and specs match the docs concepts they stand in for.
 */
export const EXERCISES: ReactExercise[] = [
	appNavExercise,
	pendingFormExercise,
	optimisticLikesExercise,
];

export type { ReactExercise, Difficulty, ExerciseFile } from "../live/types";
export {
	TESTBED_FILE,
	INDEX_FILE,
	stylesFile,
	BASE_CSS,
	INDEX_JS,
	TESTBED_JS,
} from "../live/shared";
