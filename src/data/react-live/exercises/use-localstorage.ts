import { INDEX_FILE, TESTBED_FILE, stylesFile } from "../../live/shared";
import type { ReactExercise } from "../../live/types";

const NOTES_CSS = `textarea {
  width: 100%;
  min-height: 130px;
  border: 1px solid #e4e4e7;
  border-radius: 10px;
  padding: 10px 12px;
  font: inherit;
  resize: vertical;
  background: #fff;
}
textarea:focus { outline: 2px solid #6366f1; outline-offset: 0; }
.ghost {
  padding: 7px 14px;
  border: 1px solid #e4e4e7;
  border-radius: 10px;
  background: #fff;
  font-weight: 500;
}
.ghost:hover { background: #f4f4f5; }
.toolbar { display: flex; justify-content: space-between; align-items: center; margin-top: 10px; }
`;

const scaffoldHook = `import { useState } from "react";

const KEY_PREFIX = "iprep-live:";

/**
 * Challenge 06 — useLocalStorage
 *
 * A custom hook: [value, setValue] that mirrors its state into localStorage
 * under "KEY_PREFIX + key" (JSON-encoded).
 *
 * Requirements:
 *   1. Initial value: JSON.parse the stored entry. If it is missing or corrupt,
 *      fall back to initialValue — never throw.
 *   2. setValue(next) updates the state and persists it.
 *      Support BOTH forms: setValue("text") and setValue((prev) => next).
 *   3. Storage errors (private mode, quota) must not crash the component.
 *
 * The App.js on the other tab already consumes the hook — Scratchpad
 * shows exactly how [value, setValue] is used in practice.
 */
export default function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(initialValue);

  // TODO: initial value from localStorage (lazy useState initializer!)
  //   try {
  //     const raw = window.localStorage.getItem(KEY_PREFIX + key)
  //     … JSON.parse → value, catch → initialValue
  //   }

  // TODO: persist on every change
  //   — wrap setValue: if (typeof next === "function") next(value) else next
  //   — update local state, then window.localStorage.setItem(KEY_PREFIX + key, JSON.stringify(next))
  //   (the setItem can also live inside a try/catch)

  return [value, setValue];
}
`;

const solutionHook = `import { useState } from "react";

const KEY_PREFIX = "iprep-live:";

export default function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = window.localStorage.getItem(KEY_PREFIX + key);
      if (raw === null || raw === undefined) return initialValue;
      return JSON.parse(raw);
    } catch (err) {
      return initialValue;
    }
  });

  const update = (next) => {
    const resolved = typeof next === "function" ? next(value) : next;
    setValue(resolved);
    try {
      window.localStorage.setItem(KEY_PREFIX + key, JSON.stringify(resolved));
    } catch (err) {
      /* private mode / quota — the component keeps working */
    }
  };

  return [value, update];
}
`;

const scaffoldApp = `import React from "react";
import useLocalStorage from "./useLocalStorage";

/**
 * Scratchpad — this file consumes your hook, no edits needed.
 * The tests type into the textarea, inspect localStorage, and mount <App />
 * TWICE in fresh containers to prove the note survives a remount.
 */
export default function App() {
  const [note, setNote] = useLocalStorage("note", "Draft a note…");

  return (
    <main className="demo">
      <h2>Scratchpad</h2>
      <textarea
        data-testid="note"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <div className="toolbar">
        <p className="muted">Typed values persist — even across remounts.</p>
        <button data-testid="clear" className="ghost" onClick={() => setNote("")}>
          Clear
        </button>
      </div>
    </main>
  );
}
`;

const spec = `import React from "react";
import App from "./App";
import { clickable, mount, q, typeText, waitFor } from "./_testbed";

var NOTE_KEY = "iprep-live:note";

describe("useLocalStorage", () => {
  test("stores typed text under the namespaced key", async () => {
    try { window.localStorage.removeItem(NOTE_KEY); } catch (e) {}

    const app = mount(<App />);
    try {
      typeText(clickable("note", app.container), "hello from the spec");
      await waitFor(() => {
        var raw = window.localStorage.getItem(NOTE_KEY);
        try {
          return raw !== null && JSON.parse(raw) === "hello from the spec";
        } catch (e) {
          return false;
        }
      }, "JSON-encoded note saved");
    } finally {
      app.unmount();
    }
  });

  test("a fresh mount restores the saved note", async () => {
    try { window.localStorage.removeItem(NOTE_KEY); } catch (e) {}

    const first = mount(<App />);
    typeText(clickable("note", first.container), "persisted across mounts");
    await waitFor(() => window.localStorage.getItem(NOTE_KEY) !== null, "value stored");
    first.unmount();

    const second = mount(<App />);
    try {
      await waitFor(
        () => q("note", second.container).value === "persisted across mounts",
        "textarea restored from storage",
      );
    } finally {
      second.unmount();
    }
  });

  test("corrupt JSON silently falls back to initialValue", async () => {
    try { window.localStorage.removeItem(NOTE_KEY); } catch (e) {}
    window.localStorage.setItem(NOTE_KEY, "{this is not JSON");

    const app = mount(<App />);
    try {
      await waitFor(
        () => q("note", app.container).value === "Draft a note…",
        "initial value used when JSON.parse throws",
      );
    } finally {
      app.unmount();
      try { window.localStorage.removeItem(NOTE_KEY); } catch (e) {}
    }
  });
});
`;

export const localStorageExercise: ReactExercise = {
	id: "use-localstorage",
	num: 6,
	title: "useLocalStorage hook",
	tagline: "Write a reusable hook with a persistence side effect",
	difficulty: "Medium",
	concepts: ["custom hooks", "lazy initializers", "try/catch"],
	brief: `Write your own reusable hook. You edit TWO files this time: the hook (useLocalStorage.js) and you can already see App.js consuming it on the second tab. The hidden specs type into the textarea, read the raw localStorage entry, remount the whole app in a fresh container, and even feed corrupt JSON — so defensive defaults matter.`,
	requirements: [
		"initial read: JSON.parse what is stored under iprep-live:<key>, fall back on miss OR invalid JSON (never throw)",
		"setValue(next) persists under iprep-live:<key> and updates the state",
		"the functional form setValue((prev) => next) resolves correctly",
		"storage errors (private mode, quota) are swallowed",
		"a fresh <App /> mount restores the previously stored note",
	],
	hints: [
		"Initialize with the lazy form so the read only happens once: useState(() => attemptRead(key, initialValue)).",
		"Wrap JSON.parse in try/catch — corrupt strings are a normal reality of localStorage.",
		"In the update wrapper handle both setValue(\"x\") and setValue((prev) => x): resolve next with typeof next === 'function' ? next(value) : next.",
	],
	files: {
		"/useLocalStorage.js": {
			code: scaffoldHook,
			editable: true,
		},
		"/App.js": {
			code: scaffoldApp,
			editable: true,
		},
		"/App.spec.jsx": { code: spec },
		"/_testbed.js": TESTBED_FILE,
		"/index.js": INDEX_FILE,
		"/styles.css": stylesFile(NOTES_CSS),
	},
	solution: {
		"/useLocalStorage.js": solutionHook,
	},
};
