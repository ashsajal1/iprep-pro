import { INDEX_FILE, TESTBED_FILE, stylesFile } from "../../live/shared";
import type { ReactExercise } from "../../live/types";

const LIKES_CSS = `.post {
  padding: 14px;
  border: 1px solid #e4e4e7;
  border-radius: 12px;
}
.post .excerpt {
  margin: 0 0 12px;
  font-size: 13px;
  color: #52525b;
}
.likes {
  display: flex;
  align-items: center;
  gap: 8px;
}
.like-count {
  font-weight: 700;
  font-size: 18px;
  font-variant-numeric: tabular-nums;
  margin: 0 6px 0 0;
}
.like {
  padding: 6px 14px;
  border: 1px solid #d4d4d8;
  border-radius: 999px;
  background: #fff;
  font-size: 12.5px;
  font-weight: 500;
}
.like:disabled { opacity: 0.55; }
.like:hover { background: #fafafa; }
.banner {
  margin: 10px 0 0;
  padding: 8px 12px;
  border-radius: 10px;
  background: #fef2f2;
  color: #b91c1c;
  font-size: 12.5px;
}
`;

const actionsStub = `/**
 * Read-only emulation of a Server Action (docs: Server Actions + useOptimistic).
 * Request-based, like a real like endpoint: the client reports the count it
 * saw (currentLikes) and the intent (delta); the server validates the
 * REQUESTED result against its own rules — a cap of 15, no going below
 * zero — and answers with the settled number. The server stores nothing:
 * every roundtrip echoes the count back, so reruns stay deterministic.
 *
 *   const result = await likeAction(currentLikes, +1);
 *   result.ok  -> true  { likes }   (the server accepted)
 *              -> false { likes, error }   (the server refused)
 */
export const INITIAL_LIKES = 12;

export async function likeAction(currentLikes, delta) {
  await new Promise(function (resolve) {
    setTimeout(resolve, 250);
  });

  var requested = currentLikes + delta;

  if (requested > 15) {
    return {
      ok: false,
      likes: currentLikes,
      error: "Server refused: like cap (15) reached.",
    };
  }
  if (requested < 0) {
    return {
      ok: false,
      likes: currentLikes,
      error: "Server refused: nothing left to unlike.",
    };
  }

  return { ok: true, likes: requested, error: "" };
}
`;

const scaffoldApp = `import React, { useState } from "react";

/**
 * Challenge 03 — Optimistic likes (docs: useOptimistic + Server Actions)
 *
 * Contract:
 *   count    [data-testid="like-count"]    live like display (starts at 12)
 *   add      [data-testid="like-add"]      optimistic +1, then the server confirms
 *   remove   [data-testid="like-remove"]   optimistic -1
 *   refusal  [data-testid="like-error"]    shows the server's error and reverts
 *                                            the optimistic bump
 *
 * Roundtrips happen one at a time: both buttons disable while the action
 * runs and re-enable once the server's answer is applied.
 *
 * The read-only ./actions.js stub owns the like rules:
 *   import { likeAction, INITIAL_LIKES } from "./actions";
 *   const result = await likeAction(currentLikes, delta);
 *   result.ok ? result.likes : result.error
 */
export default function App() {
  const [likes, setLikes] = useState(12);
  const [error, setError] = useState("");

  // TODO:
  //   1. wrap likes in useOptimistic: the reducer maps the payload straight
  //      to the requested value — (_current, requested) => requested
  //   2. every click runs inside startTransition(async () => { ... })
  //      - compute requested = likes + delta
  //      - addOptimistic(requested) FIRST (instant UI flip)
  //      - await likeAction(likes, delta), then settle with result.likes
  //      - when result.ok is false, show result.error instead of clearing it
  //   3. track the roundtrip in local state: busy disables both buttons
  //      while the action runs (clear it when the server's answer lands)
  const like = (delta) => {
    // TODO
  };

  return (
    <main className="demo">
      <h2>Ship of Theseus</h2>

      <article className="post">
        <p className="excerpt">
          Replaced plank by plank. Interviewers still ask if it's the same ship.
        </p>
        <div className="likes">
          <p data-testid="like-count" className="like-count">
            {likes}
          </p>
          <button data-testid="like-add" className="like" onClick={() => like(1)}>
            ▲ Like
          </button>
          <button
            data-testid="like-remove"
            className="like"
            onClick={() => like(-1)}
          >
            ▼ Unlike
          </button>
        </div>

        {error ? (
          <p data-testid="like-error" className="banner">
            {error}
          </p>
        ) : null}
      </article>
    </main>
  );
}
`;

const solutionApp = `import React, { startTransition, useState, useOptimistic } from "react";
import { likeAction, INITIAL_LIKES } from "./actions";

export default function App() {
  const [likes, setLikes] = useState(INITIAL_LIKES);
  const [optimisticLikes, addOptimistic] = useOptimistic(
    likes,
    (_current, requested) => requested,
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const like = (delta) => {
    if (busy) {
      return;
    }
    setBusy(true);
    startTransition(async function () {
      const requested = likes + delta;
      addOptimistic(requested);

      const result = await likeAction(likes, delta);
      setLikes(result.likes);

      if (result.ok === false) {
        setError(result.error);
      } else {
        setError("");
      }
      setBusy(false);
    });
  };

  return (
    <main className="demo">
      <h2>Ship of Theseus</h2>

      <article className="post">
        <p className="excerpt">
          Replaced plank by plank. Interviewers still ask if it's the same ship.
        </p>
        <div className="likes">
          <p data-testid="like-count" className="like-count">
            {optimisticLikes}
          </p>
          <button
            data-testid="like-add"
            className="like"
            onClick={() => like(1)}
            disabled={busy}
          >
            ▲ Like
          </button>
          <button
            data-testid="like-remove"
            className="like"
            onClick={() => like(-1)}
            disabled={busy}
          >
            ▼ Unlike
          </button>
        </div>

        {error ? (
          <p data-testid="like-error" className="banner">
            {error}
          </p>
        ) : null}
      </article>
    </main>
  );
}
`;

const spec = `import React from "react";
import App from "./App";
import { clickable, mount, sleep, waitFor } from "./_testbed";

describe("Optimistic likes", () => {
  function soft(app, testId) {
    return app.container.querySelector('[data-testid="' + testId + '"]');
  }

  function textOf(app, testId) {
    const el = soft(app, testId);
    return el ? el.textContent.trim() : "";
  }

  /* One roundtrip at a time: click, prove the optimistic paint landed well
   * inside the 250ms roundtrip, then wait for the buttons to re-enable —
   * the app's settle signal — before judging the final count. */
  async function roundtrip(app, testId, expected) {
    clickable(testId, app.container).click();

    await sleep(80);
    expect(textOf(app, "like-count")).toBe(String(expected)); // optimistic
    expect(clickable("like-add", app.container).disabled).toBe(true);

    await waitFor(
      () => clickable("like-add", app.container).disabled === false,
      "roundtrip settles and the buttons re-enable",
      1600,
    );
    expect(textOf(app, "like-count")).toBe(String(expected));
  }

  test("starts at 12 with both buttons present", () => {
    const app = mount(<App />);
    try {
      expect(textOf(app, "like-count")).toBe("12");
      clickable("like-add", app.container);
      clickable("like-remove", app.container);
      expect(soft(app, "like-error")).toBeFalsy();
    } finally {
      app.unmount();
    }
  });

  test("a like flips the count instantly, before the server responds", async () => {
    const app = mount(<App />);
    try {
      await roundtrip(app, "like-add", 13);
      expect(soft(app, "like-error")).toBeFalsy();
    } finally {
      app.unmount();
    }
  });

  test("like then unlike settles on the server's numbers", async () => {
    const app = mount(<App />);
    try {
      await roundtrip(app, "like-add", 13);
      await roundtrip(app, "like-remove", 12);
      expect(soft(app, "like-error")).toBeFalsy();
    } finally {
      app.unmount();
    }
  });

  test("the server refuses past the cap: optimistic bump reverts", async () => {
    const app = mount(<App />);
    try {
      await roundtrip(app, "like-add", 13);
      await roundtrip(app, "like-add", 14);
      await roundtrip(app, "like-add", 15);

      // The cap refuses: the optimistic flash paints 16, the settled answer
      // rolls it back to 15 and the server's message appears.
      clickable("like-add", app.container).click();
      await sleep(80);
      expect(textOf(app, "like-count")).toBe("16"); // optimistic flash

      await waitFor(
        () => /cap/i.test(textOf(app, "like-error")),
        "server refusal rendered",
      );
      expect(textOf(app, "like-count")).toBe("15"); // reverted
      expect(clickable("like-add", app.container).disabled).toBe(false);

      await roundtrip(app, "like-remove", 14);
      expect(soft(app, "like-error")).toBeFalsy();
    } finally {
      app.unmount();
    }
  });
});
`;

export const optimisticLikesExercise: ReactExercise = {
	id: "optimistic-likes",
	num: 3,
	title: "Optimistic likes",
	tagline: "useOptimistic against a refusing server action",
	difficulty: "Hard",
	concepts: ["useOptimistic", "server actions", "startTransition"],
	brief: `The docs' optimistic-update story with teeth: while a like roundtrip runs the UI paints the expected result instantly (useOptimistic inside an async startTransition), then adopts whatever the server answers. Roundtrips run one at a time — the buttons disable while the action is in flight. And the server can answer NO: past the cap it refuses, the optimistic bump must roll back, and the error message goes on screen. The read-only action is request-based and deterministic, so every run plays out the same.`,
	requirements: [
		'data-testid "like-count" renders optimistically: +1 shows within ~80ms, well inside the 250ms roundtrip',
		"both buttons disable while a roundtrip runs; the settled value always comes from the server (likeAction)",
		'a refused request renders data-testid "like-error" with the server message and reverts the count (15 after a 16 flash)',
		"the error clears on the next accepted action",
	],
	hints: [
		"useOptimistic takes (serverValue, reducer): useOptimistic(likes, (_current, requested) => requested) — render the FIRST return value, never the raw state.",
		"Optimistic actions only 'count' inside async transitions: startTransition(async () => { addOptimistic(requested); const result = await likeAction(likes, delta); ... }).",
		"When the server refuses, still settle the number with result.likes (the un-bumped one), then render result.error — the transition's end is what rolls the optimistic value back.",
		"One roundtrip at a time: a busy flag disables both buttons on dispatch and clears when the server's answer is applied, so rapid clicks never race the optimistic state.",
	],
	files: {
		"/App.js": {
			code: scaffoldApp,
			editable: true,
		},
		"/App.spec.jsx": { code: spec },
		"/actions.js": { code: actionsStub, visible: true },
		"/_testbed.js": TESTBED_FILE,
		"/index.js": INDEX_FILE,
		"/styles.css": stylesFile(LIKES_CSS),
	},
	solution: {
		"/App.js": solutionApp,
	},
};
