import { INDEX_FILE, TESTBED_FILE, stylesFile } from "../../live/shared";
import type { ReactExercise } from "../../live/types";

const FORM_CSS = `.card-form {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-width: 320px;
}
.card-form label {
  font-size: 12px;
  font-weight: 600;
  color: #52525b;
}
.card-form input {
  padding: 8px 10px;
  font: inherit;
  font-size: 13px;
  border: 1px solid #d4d4d8;
  border-radius: 9px;
  margin-bottom: 4px;
}
.save {
  margin-top: 8px;
  padding: 9px 14px;
  border: 0;
  border-radius: 9px;
  background: #4f46e5;
  color: #fff;
  font-weight: 600;
  font-size: 13px;
}
.save:disabled {
  background: #a5b4fc;
}
.banner {
  margin: 10px 0 0;
  padding: 9px 12px;
  border-radius: 10px;
  font-size: 13px;
}
.banner.good { background: #ecfdf5; color: #047857; }
.banner.bad { background: #fef2f2; color: #b91c1c; }
`;

const actionsStub = `/**
 * Read-only emulation of a Server Action (docs: Server Actions and Forms).
 * Your form pours its FormData into this function; the "server" reacts to the
 * submit, enforces its own validation and answers with the next state — the
 * exact shape useActionState expects: (prevState, formData) => nextState.
 * Kept for the drill: 250ms of fake latency and real server rules — an empty
 * title or out-of-range points are rejected here, exactly as a server would.
 */
export async function saveCard(_prev, formData) {
  await new Promise(function (resolve) {
    setTimeout(resolve, 250);
  });

  var title = String(formData.get("title") || "").trim();
  var points = Number(formData.get("points") || 0);

  if (!title) {
    return { ok: false, error: "Title is required.", draft: null };
  }
  if (!(points >= 1 && points <= 5)) {
    return { ok: false, error: "Points must be a number from 1 to 5.", draft: null };
  }

  return { ok: true, error: "", draft: { title: title, points: points } };
}
`;

const scaffoldApp = `import React from "react";

/**
 * Challenge 02 — Form wired to a server action (docs: Server Actions and Forms)
 *
 * Contract:
 *   form      [data-testid="card-form"]       the drafts <form>
 *   title     [data-testid="card-title"]      name="title", uncontrolled
 *   points    [data-testid="card-points"]     name="points", type="number"
 *   submit    [data-testid="card-save"]       disabled + "Saving…" while pending
 *   error     [data-testid="card-error"]      visible after the server rejects
 *   success   [data-testid="card-saved"]      "Card saved: <title> (<n> points)"
 *
 * The stub server action lives in the read-only ./actions.js module:
 *   import { saveCard } from "./actions";
 */
export default function App() {
  // TODO:
  //   1. const [state, formAction, isPending] = useActionState(saveCard, {
  //        ok: false, error: "", draft: null,
  //      })
  //   2. hold refs to the form and the two inputs; Save card submits
  //      programmatically: formAction(formData built from the inputs)
  //   3. track the roundtrip: flushSync(setBusy(true)) on dispatch so the
  //      button disables instantly, clear busy when the answer lands (every
  //      result is a new object — an effect on state clears it); "Saving…"
  //   4. render card-error when state.error is set, card-saved when ok
  return (
    <main className="demo">
      <h2>Card drafts</h2>

      <form
        data-testid="card-form"
        className="card-form"
        onSubmit={(event) => event.preventDefault()}
      >
        <label htmlFor="title">Title</label>
        <input
          id="title"
          name="title"
          data-testid="card-title"
          placeholder="What are we drafting?"
        />

        <label htmlFor="points">Story points</label>
        <input
          id="points"
          name="points"
          type="number"
          data-testid="card-points"
          placeholder="1-5"
        />

        <button type="button" data-testid="card-save" className="save">
          Save card
        </button>
      </form>
    </main>
  );
}
`;

const solutionApp = `import React, { useEffect, useActionState, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { saveCard } from "./actions";

export default function App() {
  var formRef = useRef(null);
  var titleRef = useRef(null);
  var pointsRef = useRef(null);
  var [state, formAction] = useActionState(saveCard, {
    ok: false,
    error: "",
    draft: null,
  });
  var [busy, setBusy] = useState(false);

  /* The action settles by handing back a fresh state object, so this effect
   * fires exactly once per roundtrip — accepted or rejected. */
  useEffect(function () {
    setBusy(false);
  }, [state]);

  /* Programmatic submission (docs: useActionState — you can call formAction
   * with a FormData payload yourself). The sandbox never fires native submit
   * events from button clicks, so the button dispatches the action directly;
   * the form's action prop stays the progressive-enhancement path. */
  function handleSave() {
    if (busy || !formRef.current || !titleRef.current || !pointsRef.current) {
      return;
    }
    /* flushSync puts "Saving…" on screen BEFORE the action dispatch —
     * otherwise React defers the pending render until the action settles. */
    flushSync(function () {
      setBusy(true);
    });
    var formData = new FormData();
    formData.append("title", titleRef.current.value);
    formData.append("points", pointsRef.current.value);
    formAction(formData);
  }

  return (
    <main className="demo">
      <h2>Card drafts</h2>

      <form ref={formRef} data-testid="card-form" className="card-form" action={formAction}>
        <label htmlFor="title">Title</label>
        <input
          ref={titleRef}
          id="title"
          name="title"
          data-testid="card-title"
          placeholder="What are we drafting?"
        />

        <label htmlFor="points">Story points</label>
        <input
          ref={pointsRef}
          id="points"
          name="points"
          type="number"
          data-testid="card-points"
          placeholder="1-5"
        />

        <button
          type="button"
          data-testid="card-save"
          className="save"
          onClick={handleSave}
          disabled={busy}
        >
          {busy ? "Saving…" : "Save card"}
        </button>
      </form>

      {state.ok && state.draft ? (
        <p data-testid="card-saved" className="banner good">
          Card saved: {state.draft.title} ({state.draft.points} points)
        </p>
      ) : null}
      {!state.ok && state.error ? (
        <p data-testid="card-error" className="banner bad">
          {state.error}
        </p>
      ) : null}
    </main>
  );
}
`;

const spec = `import React from "react";
import App from "./App";
import { clickable, mount, typeText, waitFor } from "./_testbed";

describe("Server-action form", () => {
  function soft(app, testId) {
    return app.container.querySelector('[data-testid="' + testId + '"]');
  }

  function textOf(app, testId) {
    const el = soft(app, testId);
    return el ? el.textContent : "";
  }

  function saveWith(app, title, points) {
    typeText(clickable("card-title", app.container), title);
    typeText(clickable("card-points", app.container), points);
    clickable("card-save", app.container).click();
  }

  test("form, inputs and submit button exist with names React can read", () => {
    const app = mount(<App />);
    try {
      clickable("card-form", app.container);
      const title = clickable("card-title", app.container);
      expect(title.getAttribute("name")).toBe("title");
      const points = clickable("card-points", app.container);
      expect(points.getAttribute("name")).toBe("points");
      clickable("card-save", app.container);
    } finally {
      app.unmount();
    }
  });

  test("an empty title is rejected by the server", async () => {
    const app = mount(<App />);
    try {
      clickable("card-save", app.container).click();
      await waitFor(
        () => /required/i.test(textOf(app, "card-error")),
        "validation error rendered",
      );
      expect(soft(app, "card-saved")).toBeFalsy();
    } finally {
      app.unmount();
    }
  });

  test("out-of-range points are rejected too", async () => {
    const app = mount(<App />);
    try {
      saveWith(app, "Rum rations", "0");
      await waitFor(
        () => /1 to 5/.test(textOf(app, "card-error")),
        "points range error rendered",
      );
      expect(soft(app, "card-saved")).toBeFalsy();
    } finally {
      app.unmount();
    }
  });

  test("a pending submit disables the button, then resolves to a saved banner", async () => {
    const app = mount(<App />);
    try {
      saveWith(app, "Rum rations", "2");

      await waitFor(
        () => clickable("card-save", app.container).disabled === true,
        "button disabled while the action runs",
        800,
      );
      expect(/saving/i.test(textOf(app, "card-save"))).toBe(true);

      await waitFor(
        () => textOf(app, "card-saved").indexOf("Rum rations") !== -1,
        "saved banner with the draft title",
      );
      expect(textOf(app, "card-saved")).toContain("2 points");
      expect(soft(app, "card-error")).toBeFalsy();
      expect(clickable("card-save", app.container).disabled).toBe(false);
    } finally {
      app.unmount();
    }
  });
});

`;

export const pendingFormExercise: ReactExercise = {
	id: "pending-form",
	num: 2,
	title: "Server action form",
	tagline: "useActionState end to end against a real server contract",
	difficulty: "Medium",
	concepts: ["server actions", "useActionState", "pending states"],
	brief: `The docs' form recipe, minus the progressive-enhancement part a browser sandbox can't replay: a form posting FormData to a server function, validation that runs on the server, and a submit button that knows it's pending. The specs fill the inputs, click Save, watch the button disable while the 250ms roundtrip runs, and check both the rejection and the success banners. The action is a visible read-only stub with the exact shape useActionState expects. Because the sandbox never fires native submit events from button clicks, the button submits programmatically — formAction(formData) — the docs' programmatic option.`,
	requirements: [
		"state and dispatch come from useActionState(saveCard, initialState) — no local state mirroring",
		'card-save disables and shows "Saving…" while the action runs, then re-enables',
		'a rejected draft renders data-testid "card-error" with the server message (e.g. "required", "1 to 5")',
		'a valid draft renders data-testid "card-saved" containing the title and points, and hides any error',
	],
	hints: [
		'useActionState always returns [state, formAction, isPending]. Both dispatch styles are docs-listed: <form action={formAction}> or calling formAction(formData) yourself — the sandbox needs the second one.',
		"Build the FormData payload yourself (new FormData() + append) — or grab the input values through refs — then hand it to formAction.",
		"With a programmatic dispatch you own the pending state: flushSync(setBusy(true)) on click so the disabled state lands immediately, then an effect on state clears busy when the server's fresh state object arrives (accepted or rejected).",
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
		"/styles.css": stylesFile(FORM_CSS),
	},
	solution: {
		"/App.js": solutionApp,
	},
};
