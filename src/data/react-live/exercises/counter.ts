import { INDEX_FILE, TESTBED_FILE, stylesFile } from "../shared";
import type { ReactExercise } from "../types";

const COUNTER_CSS = `.count {
  font-size: 44px;
  font-weight: 700;
  text-align: center;
  margin: 2px 0 16px;
  font-variant-numeric: tabular-nums;
}
.row {
  display: flex;
  gap: 8px;
  justify-content: center;
}
.row button {
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid #e4e4e7;
  background: #ffffff;
  font-weight: 600;
}
.row button:hover { background: #f4f4f5; }
.row button:active { transform: translateY(1px); }
`;

const scaffoldApp = `import React, { useState } from "react";

/**
 * Challenge 01 — Counter
 *
 * Wire up three buttons:
 *   data-testid="inc"   → adds one
 *   data-testid="dec"   → subtracts one, but never below 0
 *   data-testid="reset" → back to 0
 *
 * The current number renders inside [data-testid="count"].
 * Click save? There is nothing to save — state lives in React.
 */
export default function App() {
  const [count, setCount] = useState(0);

  return (
    <main className="demo">
      <h2>Counter</h2>
      <p className="count" data-testid="count">{count}</p>

      <div className="row">
        <button data-testid="inc" onClick={() => {
          // TODO: add one
        }}>
          +1
        </button>
        <button data-testid="dec" onClick={() => {
          // TODO: subtract one, but never let the count drop below 0
        }}>
          −1
        </button>
        <button data-testid="reset" onClick={() => {
          // TODO: back to zero
        }}>
          Reset
        </button>
      </div>
    </main>
  );
}
`;

const solutionApp = `import React, { useState } from "react";

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <main className="demo">
      <h2>Counter</h2>
      <p className="count" data-testid="count">{count}</p>

      <div className="row">
        <button data-testid="inc" onClick={() => setCount((c) => c + 1)}>
          +1
        </button>
        <button data-testid="dec" onClick={() => setCount((c) => Math.max(0, c - 1))}>
          −1
        </button>
        <button data-testid="reset" onClick={() => setCount(0)}>
          Reset
        </button>
      </div>
    </main>
  );
}
`;

const spec = `import React from "react";
import App from "./App";
import { clickable, mount, q, waitFor } from "./_testbed";

describe("Counter", () => {
  test("starts at 0", async () => {
    const app = mount(<App />);
    try {
      await waitFor(() => q("count", app.container).textContent === "0", "count is 0");
    } finally {
      app.unmount();
    }
  });

  test("+1 adds one per click", async () => {
    const app = mount(<App />);
    try {
      clickable("inc", app.container).click();
      clickable("inc", app.container).click();
      await waitFor(() => q("count", app.container).textContent === "2", "count is 2");
    } finally {
      app.unmount();
    }
  });

  test("−1 subtracts and never goes below 0", async () => {
    const app = mount(<App />);
    try {
      clickable("inc", app.container).click();
      clickable("inc", app.container).click();
      await waitFor(() => q("count", app.container).textContent === "2", "count is 2 first");

      clickable("dec", app.container).click();
      await waitFor(() => q("count", app.container).textContent === "1", "count is 1 after dec");

      clickable("dec", app.container).click();
      await waitFor(() => q("count", app.container).textContent === "0", "count is 0 again");

      clickable("dec", app.container).click();
      await waitFor(() => q("count", app.container).textContent === "0", "count floors at 0");
    } finally {
      app.unmount();
    }
  });

  test("reset returns to 0", async () => {
    const app = mount(<App />);
    try {
      clickable("inc", app.container).click();
      clickable("inc", app.container).click();
      await waitFor(() => q("count", app.container).textContent === "2", "count is 2 before reset");

      clickable("reset", app.container).click();
      await waitFor(() => q("count", app.container).textContent === "0", "count is 0 again");
    } finally {
      app.unmount();
    }
  });
});
`;

export const counterExercise: ReactExercise = {
	id: "counter",
	num: 1,
	title: "Counter",
	tagline: "Warm-up: state, events and the floor rule",
	difficulty: "Easy",
	concepts: ["useState", "event handlers", "functional updates"],
	brief: `The classic "count the clicks" warm-up. It looks trivial, and that is the point — interviewers use small components to check that you reach for the right tool (a function updater) instead of reading state directly.`,
	requirements: [
		'[data-testid="count"] always shows the current number',
		"inc adds exactly 1 per click",
		"dec subtracts 1 but the count never drops below 0",
		"reset brings the count back to 0 from any value",
	],
	hints: [
		'Use the functional form setCount((c) => ...) so you never depend on a stale value between rapid clicks.',
		"The floor rule is one Math.max away: setCount((c) => Math.max(0, c - 1)).",
	],
	files: {
		"/App.js": {
			code: scaffoldApp,
			editable: true,
		},
		"/App.spec.jsx": { code: spec },
		"/_testbed.js": TESTBED_FILE,
		"/index.js": INDEX_FILE,
		"/styles.css": stylesFile(COUNTER_CSS),
	},
	solution: {
		"/App.js": solutionApp,
	},
};
