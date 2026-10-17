import type { ReactExercise } from "../live/types";

import { counterExercise } from "./exercises/counter";
import { todoExercise } from "./exercises/todo-list";
import { debounceExercise } from "./exercises/debounced-search";
import { infiniteScrollExercise } from "./exercises/infinite-scroll";
import { tabsExercise } from "./exercises/tabs";
import { localStorageExercise } from "./exercises/use-localstorage";
import { loginFormExercise } from "./exercises/login-form";
import { cartExercise } from "./exercises/cart";
import { useFetchExercise } from "./exercises/use-fetch";

/** Ordered playground — counter first (warm-up), custom hook last. */
export const EXERCISES: ReactExercise[] = [
	counterExercise,
	todoExercise,
	debounceExercise,
	infiniteScrollExercise,
	tabsExercise,
	localStorageExercise,
	loginFormExercise,
	cartExercise,
	useFetchExercise,
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
