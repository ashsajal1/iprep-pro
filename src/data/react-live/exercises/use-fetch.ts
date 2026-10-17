import { INDEX_FILE, TESTBED_FILE, stylesFile } from "../shared";
import type { ReactExercise } from "../types";

const FETCH_CSS = `.row {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}
.row button {
  padding: 7px 13px;
  border: 1px solid #d4d4d8;
  border-radius: 999px;
  background: #fff;
  font-size: 12.5px;
  font-weight: 500;
}
.row button.bad { border-color: #fca5a5; color: #b91c1c; }
.chip {
  display: inline-block;
  padding: 8px 12px;
  border-radius: 999px;
  background: #f4f4f5;
  color: #52525b;
  font-size: 12.5px;
}
.chip.loading { background: #eef2ff; color: #4338ca; }
.chip.error { background: #fef2f2; color: #b91c1c; }
.user-card {
  margin-top: 10px;
  padding: 12px;
  border: 1px solid #e4e4e7;
  border-radius: 12px;
}
.user-card p { margin: 0; }
.user-card [data-testid="user-name"] { font-weight: 600; }
.user-card .muted { font-size: 12px; margin-top: 2px; }
`;

const scaffoldUseFetch = `import { useEffect, useState } from "react";
import { fetchUser } from "./api";

/**
 * Challenge 09 — Write the useFetch hook
 *
 * Contract (what App consumes):
 *   const { status, user, error } = useFetch(id);
 *   status  "loading" | "done" | "error"
 *   user    the resolved user object (or null)
 *   error   the rejected Error (or null)
 *
 * Behavior:
 *   • starts "loading" whenever id changes
 *   • fetchUser(id) resolves -> "done" + the user
 *   • fetchUser(id) rejects  -> "error" + the error (user stays null)
 *   • refetch on every id change; ignore results from stale requests
 */
export default function useFetch(id) {
  // TODO:
  //   1. keep { status, user, error } in useState
  //   2. useEffect on [id]: kick off fetchUser(id)
  //   3. resolve -> status "done"; reject -> status "error"
  //   4. an 'alive' flag stops a finished request from overwriting the next one
  return { status: "loading", user: null, error: null };
}
`;

const solutionUseFetch = `import { useEffect, useState } from "react";
import { fetchUser } from "./api";

export default function useFetch(id) {
  const [state, setState] = useState({ status: "loading", user: null, error: null });

  useEffect(() => {
    let alive = true;
    setState({ status: "loading", user: null, error: null });

    fetchUser(id).then(
      function (user) {
        if (alive) setState({ status: "done", user: user, error: null });
      },
      function (error) {
        if (alive) setState({ status: "error", user: null, error: error });
      },
    );

    return function () {
      alive = false;
    };
  }, [id]);

  return state;
}
`;

const scaffoldApp = `import React, { useState } from "react";
import useFetch from "./useFetch";

/**
 * Challenge 09 — Wire a custom hook into the UI
 *
 * App is complete already. The work lives in ./useFetch.js — its contract:
 *   const { status, user, error } = useFetch(id)
 *
 * Buttons flip the id: 1 and 2 are valid, -1 always rejects. Every state
 * change the specs look for comes out of the hook you write.
 */
export default function App() {
  const [userId, setUserId] = useState(1);
  const { status, user, error } = useFetch(userId);

  return (
    <main className="demo">
      <h2>Team directory</h2>

      <div className="row">
        <button data-testid="load-1" onClick={() => setUserId(1)}>
          Load #1
        </button>
        <button data-testid="load-2" onClick={() => setUserId(2)}>
          Load #2
        </button>
        <button data-testid="load-bad" className="bad" onClick={() => setUserId(-1)}>
          Bad id
        </button>
      </div>

      {status === "loading" && (
        <p data-testid="status-loading" className="chip loading">
          Loading…
        </p>
      )}
      {status === "error" && (
        <p data-testid="status-error" className="chip error">
          {error && error.message ? error.message : String(error)}
        </p>
      )}
      {status === "done" && user && (
        <div className="user-card" data-testid="user-card">
          <p data-testid="user-name">{user.name}</p>
          <p className="muted">requested id: {user.id}</p>
        </div>
      )}
    </main>
  );
}
`;

const apiJs = `/**
 * Mock API used by the hidden specs and the sandbox UI.
 * Promise resolves after 80ms; ids <= 0 always reject.
 */
export function fetchUser(id) {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      if (id <= 0) {
        reject(new Error("No such user: " + id));
        return;
      }
      resolve({
        id: id,
        name: "User #" + id,
        role: "Engineer",
      });
    }, 80);
  });
}
`;

const spec = `import React from "react";
import App from "./App";
import { clickable, mount, waitFor } from "./_testbed";

describe("useFetch hook", () => {
  function soft(app, testId) {
    return app.container.querySelector('[data-testid="' + testId + '"]');
  }

  function textOf(app, testId) {
    const el = soft(app, testId);
    return el ? el.textContent : "";
  }

  test("the first render shows loading, not data", async () => {
    const app = mount(<App />);
    try {
      expect(soft(app, "status-loading")).toBeTruthy();
      expect(soft(app, "user-name")).toBeFalsy();
    } finally {
      app.unmount();
    }
  });

  test("a valid id resolves to its user and clears loading", async () => {
    const app = mount(<App />);
    try {
      await waitFor(
        () => textOf(app, "user-name") === "User #1",
        "User #1 rendered",
      );
      expect(soft(app, "status-loading")).toBeFalsy();
      expect(soft(app, "status-error")).toBeFalsy();
    } finally {
      app.unmount();
    }
  });

  test("an invalid id surfaces the error message", async () => {
    const app = mount(<App />);
    try {
      clickable("load-bad", app.container).click();
      await waitFor(
        () => /No such user/.test(textOf(app, "status-error")),
        "error chip rendered",
      );
      expect(soft(app, "user-name")).toBeFalsy();
      expect(soft(app, "status-loading")).toBeFalsy();
    } finally {
      app.unmount();
    }
  });

  test("changing the id refetches and swaps the name", async () => {
    const app = mount(<App />);
    try {
      await waitFor(() => Boolean(soft(app, "user-name")), "initial user");
      clickable("load-2", app.container).click();

      await waitFor(
        () => textOf(app, "user-name") === "User #2",
        "name swapped to User #2",
      );
      expect(soft(app, "status-error")).toBeFalsy();
    } finally {
      app.unmount();
    }
  });
});
`;

export const useFetchExercise: ReactExercise = {
	id: "use-fetch",
	num: 9,
	title: "useFetch hook",
	tagline: "Custom hook with async state, error handling and stale guards",
	difficulty: "Medium",
	concepts: ["custom hooks", "useEffect cleanup", "async state"],
	brief: `Your first real custom hook. App is fully built and consumes a contract: useFetch(id) returns { status, user, error } with "loading" / "done" / "error". You write the hook — kick off the mock API in an effect, land promises in state, and guard against a resolved-but-stale request overwriting a newer one. Two editable tabs: the hook you write, and the App it powers.`,
	requirements: [
		'useFetch(id) returns { status, user, error }; status is "loading" | "done" | "error"',
		"loading chip shows first; a valid id resolves to data-testid \"user-name\" with the fetched name",
		"an id that rejects renders data-testid \"status-error\" with the error message while user stays null",
		"changing the id refetches — the new user's name replaces the old one",
	],
	hints: [
		"Keep one useState object: { status, user, error } — reset it at the START of every effect run.",
		"fetchUser(id).then(onOk, onFail) takes both callbacks; don't forget the reject one.",
		"let alive = true inside the effect, set it false in cleanup, and only setState when alive — that's what kills stale updates.",
	],
	files: {
		"/useFetch.js": {
			code: scaffoldUseFetch,
			editable: true,
		},
		"/App.js": {
			code: scaffoldApp,
			editable: true,
		},
		"/api.js": {
			code: apiJs,
			visible: true,
		},
		"/App.spec.jsx": { code: spec },
		"/_testbed.js": TESTBED_FILE,
		"/index.js": INDEX_FILE,
		"/styles.css": stylesFile(FETCH_CSS),
	},
	solution: {
		"/useFetch.js": solutionUseFetch,
		"/App.js": scaffoldApp,
	},
};
