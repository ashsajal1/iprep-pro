import { INDEX_FILE, TESTBED_FILE, stylesFile } from "../../live/shared";
import type { ReactExercise } from "../../live/types";

const INFINITE_CSS = `.feed-frame { padding: 14px; }
.feed {
  height: 240px;
  overflow-y: auto;
  border: 1px solid #e4e4e7;
  border-radius: 12px;
  background: #fff;
  display: grid;
  gap: 4px;
  padding: 10px;
  overscroll-behavior: contain;
}
.feed-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  border-bottom: 1px solid #f4f4f5;
  padding: 3px 4px;
}
.feed-row .name { font-weight: 600; }
.feed-row .role { color: #a1a1aa; font-size: 12px; }
.feed-hint {
  text-align: center;
  color: #a1a1aa;
  font-size: 12px;
  margin: 6px 0 2px;
}
.end-marker {
  text-align: center;
  color: #059669;
  font-size: 12px;
  margin: 6px 0 2px;
  font-weight: 600;
}
`;

const API_JS = `/**
 * Fake paginated user API — read-only.
 * Every call is recorded in window.__iprepCalls so the tests can verify
 * exactly which pages were requested (and that nothing was re-requested).
 */
var NAMES = [
  "Aria", "Bo", "Cleo", "Dara", "Enzo", "Faye", "Gus", "Hana",
  "Ivo", "Juno", "Kai", "Lena", "Mil", "Nia", "Otis", "Pia",
  "Quinn", "Rio", "Sol", "Tara", "Uma", "Vito", "Wren", "Xio",
  "Yara", "Zeke",
];

export var PAGE_SIZE = 10;
export var MAX_PAGES = 3;

export function resetCalls() {
  window.__iprepCalls = [];
}

export function calls() {
  return window.__iprepCalls || [];
}

export function fetchUsers(page) {
  if (!window.__iprepCalls) window.__iprepCalls = [];
  window.__iprepCalls.push(page);

  return new Promise(function (resolve) {
    setTimeout(function () {
      var users = [];
      for (var i = 0; i < PAGE_SIZE; i++) {
        var n = (page - 1) * PAGE_SIZE + i;
        users.push({
          id: n + 1,
          name: NAMES[n % NAMES.length] + " " + String.fromCharCode(65 + (n % 26)) + ". #" + (n + 1),
          role: n % 2 === 0 ? "Designer" : "Developer",
        });
      }
      resolve(users);
    }, 300);
  });
}
`;

const scaffoldApp = `import React, { useEffect, useRef, useState } from "react";
import { MAX_PAGES, PAGE_SIZE, fetchUsers } from "./api";

/**
 * Challenge 04 — Infinite scroll feed
 *
 * Contract:
 *   container   [data-testid="feed"]      scrollable list (CSS already sized)
 *   row         [data-testid="user-row"]  one per user
 *   loading row [data-testid="loading"]   while a fetch is in flight
 *   end marker  [data-testid="end"]       once the last page (MAX_PAGES = 3) loaded
 *
 * Rules:
 *   • fetch page 1 on mount (useEffect, once)
 *   • when the user scrolls within 40px of the bottom → fetch the NEXT page
 *   • never fire a second fetch while one is in flight
 *   • when page MAX_PAGES is loaded, stop fetching and show the end marker
 *
 * scroll math:
 *   distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight
 */
export default function App() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const page = useRef(1);

  const handleScroll = (event) => {
    // TODO: if within 40px of the bottom kick off the next load
    //   (guard: loading.state + page.current < MAX_PAGES)
  };

  const loadPage = async (pageToLoad) => {
    // TODO:
    //   1. flag the fetch as in flight (this is your double-fire guard!)
    //   2. const next = await fetchUsers(pageToLoad)
    //   3. append: setUsers(prev => prev.concat(next))
    //   4. update page.current, clear the loading flag
  };

  useEffect(() => {
    // TODO: fetch page 1 once on mount
  }, []);

  return (
    <main className="demo feed-frame">
      <div className="feed" data-testid="feed" onScroll={handleScroll}>
        {users.map((user) => (
          <article key={user.id} data-testid="user-row" className="feed-row">
            <span className="name">{user.name}</span>
            <span className="role">{user.role}</span>
          </article>
        ))}

        {loading && (
          <p data-testid="loading" className="feed-hint">Loading…</p>
        )}
        <p className="feed-hint muted">Scroll to load more…</p>

        {/* TODO: show [data-testid="end"] once MAX_PAGES is loaded */}
      </div>
    </main>
  );
}
`;

const solutionApp = `import React, { useCallback, useEffect, useRef, useState } from "react";
import { MAX_PAGES, fetchUsers } from "./api";

export default function App() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const page = useRef(1);
  const loadingRef = useRef(false);

  const loadPage = useCallback(async (pageToLoad) => {
    if (pageToLoad > MAX_PAGES || loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const next = await fetchUsers(pageToLoad);
      setUsers((prev) => prev.concat(next));
      page.current = pageToLoad;
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPage(1);
  }, [loadPage]);

  const handleScroll = (event) => {
    const el = event.currentTarget;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceToBottom > 40) return;
    if (loadingRef.current || page.current >= MAX_PAGES) return;
    loadPage(page.current + 1);
  };

  return (
    <main className="demo feed-frame">
      <div className="feed" data-testid="feed" onScroll={handleScroll}>
        {users.map((user) => (
          <article key={user.id} data-testid="user-row" className="feed-row">
            <span className="name">{user.name}</span>
            <span className="role">{user.role}</span>
          </article>
        ))}

        {loading && (
          <p data-testid="loading" className="feed-hint">Loading…</p>
        )}
        {page.current === MAX_PAGES ? (
          <p data-testid="end" className="end-marker">You reached the end ✨</p>
        ) : (
          <p className="feed-hint muted">Scroll to load more…</p>
        )}
      </div>
    </main>
  );
}
`;

const spec = `import React from "react";
import App from "./App";
import { clickable, mount, q, rows, scrollBottom, sleep, waitFor } from "./_testbed";
import { MAX_PAGES, PAGE_SIZE, calls, resetCalls } from "./api";

describe("Infinite scroll feed", () => {
  test("loads the first page on mount", async () => {
    resetCalls();
    const app = mount(<App />);
    try {
      await waitFor(
        () => rows("user-row", app.container).length === PAGE_SIZE,
        "10 users after mount",
      );
      expect(calls().length).toBe(1);
    } finally {
      app.unmount();
    }
  });

  test("scrolling near the bottom fetches page 2 (with a loading state)", async () => {
    resetCalls();
    const app = mount(<App />);
    try {
      await waitFor(() => rows("user-row", app.container).length === PAGE_SIZE, "first page");
      resetCalls(); // only scroll-driven calls from here on

      scrollBottom(clickable("feed", app.container));

      await waitFor(() => Boolean(q("loading", app.container)), "loading row appears", 900);
      expect(calls().length).toBe(1);

      await waitFor(
        () => rows("user-row", app.container).length === PAGE_SIZE * 2,
        "20 users after scroll",
      );
    } finally {
      app.unmount();
    }
  });

  test("keeps loading until MAX_PAGES, then shows the end marker", async () => {
    resetCalls();
    const app = mount(<App />);
    try {
      await waitFor(() => rows("user-row", app.container).length === PAGE_SIZE, "page 1");
      resetCalls();

      scrollBottom(clickable("feed", app.container));
      await waitFor(() => rowsCount(app) === PAGE_SIZE * 2, "page 2");
      await sleep(120);

      scrollBottom(clickable("feed", app.container));
      await waitFor(() => rowsCount(app) === PAGE_SIZE * 3, "page " + MAX_PAGES);
      await sleep(150);

      expect(calls().length).toBe(MAX_PAGES - 1);
      expect(q("end", app.container)).toBeTruthy();
    } finally {
      app.unmount();
    }
  });

  test("does not double-fetch while a request is in flight", async () => {
    resetCalls();
    const app = mount(<App />);
    try {
      await waitFor(() => rowsCount(app) === PAGE_SIZE, "first page");
      resetCalls();

      const feed = clickable("feed", app.container);
      scrollBottom(feed); // fetch page 2 starts
      await sleep(100);   // let React commit the in-flight state
      scrollBottom(feed); // this one must be swallowed

      await waitFor(() => rowsCount(app) === PAGE_SIZE * 2, "page 2 lands");
      await sleep(350);   // generous window for any illegal extra call
      expect(calls().length).toBe(1);
    } finally {
      app.unmount();
    }
  });

  test("stops calling the API after the end", async () => {
    resetCalls();
    const app = mount(<App />);
    try {
      await waitFor(() => rowsCount(app) === PAGE_SIZE, "page 1");
      resetCalls();
      const feed = clickable("feed", app.container);

      scrollBottom(feed);
      await waitFor(() => rowsCount(app) === PAGE_SIZE * 2, "page 2");
      await sleep(120);
      scrollBottom(feed);
      await waitFor(() => rowsCount(app) === PAGE_SIZE * 3, "page 3");
      await sleep(150);

      const before = calls().length;
      scrollBottom(feed);
      await sleep(500);
      expect(calls().length).toBe(before);
      expect(q("end", app.container)).toBeTruthy();
    } finally {
      app.unmount();
    }
  });
});

function rowsCount(app) {
  return rows("user-row", app.container).length;
}
`;

export const infiniteScrollExercise: ReactExercise = {
	id: "infinite-scroll",
	num: 4,
	title: "Infinite scroll feed",
	tagline: "Paginated fetches driven by scroll position",
	difficulty: "Medium",
	concepts: ["onScroll math", "fetch guards", "pagination state"],
	brief: `The interview classic. A fake paginated API (300ms latency, records every call) feeds a scrollable feed. You wire the scroll math, the double-fire guard and the end-of-list behavior — the hidden tests watch both the DOM and the recorded API traffic, so "it looked right" isn't enough.`,
	requirements: [
		"page 1 loads automatically on mount (one fetchUsers(1) call)",
		"when [data-testid=\"feed\"] is scrolled within 40px of the bottom, fetch the next page",
		"[data-testid=\"loading\"] renders while a request is in flight",
		"a request in flight must never trigger a duplicate fetch",
		"after page 3 (MAX_PAGES), show [data-testid=\"end\"] and never fetch again",
		"rows append (3 pages × 10 = 30 [data-testid=\"user-row\"] entries)",
	],
	hints: [
		"event.currentTarget is the scroll container in handleScroll — scrollHeight − scrollTop − clientHeight is your distance to the bottom.",
		"React state updates are async between renders: a duplicate scroll can fire before `loading` commits. Keep the guard in a useRef (loadingRef) or a ref-managed flag.",
		"Append results immutably: setUsers((prev) => prev.concat(next)).",
	],
	files: {
		"/api.js": {
			code: API_JS,
			visible: true,
		},
		"/App.js": {
			code: scaffoldApp,
			editable: true,
		},
		"/App.spec.jsx": { code: spec },
		"/_testbed.js": TESTBED_FILE,
		"/index.js": INDEX_FILE,
		"/styles.css": stylesFile(INFINITE_CSS),
	},
	solution: {
		"/App.js": solutionApp,
	},
};
