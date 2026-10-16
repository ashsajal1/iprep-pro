import { INDEX_FILE, TESTBED_FILE, stylesFile } from "../shared";
import type { ReactExercise } from "../types";

const SEARCH_CSS = `.search { display: flex; gap: 8px; align-items: center; }
.search input {
  flex: 1;
  min-width: 0;
  padding: 9px 12px;
  border: 1px solid #e4e4e7;
  border-radius: 10px;
  font: inherit;
}
.search input:focus { outline: 2px solid #6366f1; outline-offset: 0; }
.status { font-size: 12px; color: #71717a; margin: 10px 0 8px; }
.results { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
.results li {
  display: flex;
  justify-content: space-between;
  border: 1px solid #e4e4e7;
  border-radius: 10px;
  padding: 8px 12px;
  background: #fff;
}
.results .handle { color: #a1a1aa; font-size: 12px; }
.empty { text-align: center; color: #a1a1aa; padding: 14px 0 6px; }
`;

const scaffoldApp = `import React, { useEffect, useState } from "react";

const NAMES = [
  "Amelia", "Andres", "Bianca", "Anna",
  "Marcus", "Priya", "Xander", "Leandro",
];
const DEBOUNCE_MS = 300;

/**
 * Challenge 03 — Debounced search
 *
 * The results list must refresh only 300ms after the user STOPPED typing.
 * Two pieces of state make this easy to reason about:
 *   query     — every keystroke, instantly
 *   committed — the debounced snapshot the results are computed from
 *
 * Contract:
 *   input  [data-testid="search"]      controlled search field
 *   row    [data-testid="result-row"]  one per match (case-insensitive)
 *   status [data-testid="status"]      "N of 8 shown"
 */
export default function App() {
  const [query, setQuery] = useState("");
  const [committed, setCommitted] = useState("");

  useEffect(() => {
    // TODO: debounce committed ← query
    //   1. schedule a timer for DEBOUNCE_MS
    //   2. when it fires, copy query into committed
    //   3. cancel the pending timer on the next keystroke (the cleanup!)
  }, [query]);

  const shown = NAMES; // TODO: filter NAMES by the committed query, case-insensitively

  return (
    <main className="demo">
      <h2>Team directory</h2>

      <input
        className="search"
        data-testid="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Type a name to filter…"
      />

      <p data-testid="status" className="status">
        {shown.length} of {NAMES.length} shown
      </p>

      <ul className="results">
        {shown.map((name, index) => (
          <li key={name} data-testid="result-row">
            <span>{name}</span>
            <span className="handle">@{name.toLowerCase().slice(0, 2)}</span>
          </li>
        ))}
        {shown.length === 0 && (
          <li className="empty">Nobody matches that query.</li>
        )}
      </ul>
    </main>
  );
}
`;

const solutionApp = `import React, { useEffect, useState } from "react";

const NAMES = [
  "Amelia", "Andres", "Bianca", "Anna",
  "Marcus", "Priya", "Xander", "Leandro",
];
const DEBOUNCE_MS = 300;

export default function App() {
  const [query, setQuery] = useState("");
  const [committed, setCommitted] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setCommitted(query), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const needle = committed.trim().toLowerCase();
  const shown = NAMES.filter((name) => name.toLowerCase().includes(needle));

  return (
    <main className="demo">
      <h2>Team directory</h2>

      <input
        className="search"
        data-testid="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Type a name to filter…"
      />

      <p data-testid="status" className="status">
        {shown.length} of {NAMES.length} shown
      </p>

      <ul className="results">
        {shown.map((name, index) => (
          <li key={name} data-testid="result-row">
            <span>{name}</span>
            <span className="handle">@{name.toLowerCase().slice(0, 2)}</span>
          </li>
        ))}
        {shown.length === 0 && (
          <li className="empty">Nobody matches that query.</li>
        )}
      </ul>
    </main>
  );
}
`;

const spec = `import React from "react";
import App from "./App";
import { clickable, mount, rows, sleep, typeText, waitFor } from "./_testbed";

var ALL = 8;

describe("Debounced search", () => {
  test("starts with the full list", async () => {
    const app = mount(<App />);
    try {
      await waitFor(
        () => rows("result-row", app.container).length === ALL,
        "8 rows before any filter",
      );
    } finally {
      app.unmount();
    }
  });

  test("filters after the debounce settles", async () => {
    const app = mount(<App />);
    try {
      await waitFor(() => rows("result-row", app.container).length === ALL, "initial list");
      typeText(clickable("search", app.container), "an");
      await waitFor(
        () => rows("result-row", app.container).length === 5,
        "five matches for 'an' after 300ms",
      );
    } finally {
      app.unmount();
    }
  });

  test("does NOT filter mid-debounce (typing is still going)", async () => {
    const app = mount(<App />);
    try {
      await waitFor(() => rows("result-row", app.container).length === ALL, "initial list");
      typeText(clickable("search", app.container), "an");
      await sleep(150); // strictly inside the 300ms window
      expect(rows("result-row", app.container).length).toBe(ALL);
      await waitFor(
        () => rows("result-row", app.container).length === 5,
        "list updates once debounce fires",
      );
    } finally {
      app.unmount();
    }
  });

  test("matching is case-insensitive", async () => {
    const app = mount(<App />);
    try {
      await waitFor(() => rows("result-row", app.container).length === ALL, "initial list");
      typeText(clickable("search", app.container), "amel");
      await waitFor(
        () => rows("result-row", app.container).length === 1,
        "'amel' matches Amelia",
      );
    } finally {
      app.unmount();
    }
  });

  test("clearing the query restores everything", async () => {
    const app = mount(<App />);
    try {
      await waitFor(() => rows("result-row", app.container).length === ALL, "initial list");
      typeText(clickable("search", app.container), "an");
      await waitFor(() => rows("result-row", app.container).length === 5, "filtered to 5");
      typeText(clickable("search", app.container), "");
      await waitFor(
        () => rows("result-row", app.container).length === ALL,
        "back to 8 rows",
      );
    } finally {
      app.unmount();
    }
  });
});
`;

export const debounceExercise: ReactExercise = {
	id: "debounced-search",
	num: 3,
	title: "Debounced search",
	tagline: "Only react when the user stops typing",
	difficulty: "Medium",
	concepts: ["useEffect cleanup", "timers in hooks", "controlled inputs"],
	brief: `"Filter as you type, but don't react to every keystroke" — the middle state between controlled inputs and real network search. The trick is separating what the user is typing (query) from what the app acts on (committed), and cleaning up your timer in useEffect.`,
	requirements: [
		'query mirrors [data-testid="search"] on every keystroke',
		"results only refresh 300ms after the last keystroke (no mid-debounce re-render of the list)",
		"matches are case-insensitive and use the trimmed committed query",
		"an empty committed query shows all 8 names",
		'status shows "N of 8 shown"',
	],
	hints: [
		"Schedule the timer inside a useEffect keyed on [query] and clear it in the cleanup — timer churn is cancelled for free.",
		"The setup already gives you two states: setCommitted(query) when the timer fires.",
		"Filter with name.toLowerCase().includes(needle) so 'amel' finds Amelia.",
	],
	files: {
		"/App.js": {
			code: scaffoldApp,
			editable: true,
		},
		"/App.spec.jsx": { code: spec },
		"/_testbed.js": TESTBED_FILE,
		"/index.js": INDEX_FILE,
		"/styles.css": stylesFile(SEARCH_CSS),
	},
	solution: {
		"/App.js": solutionApp,
	},
};
