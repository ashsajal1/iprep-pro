import { INDEX_FILE, TESTBED_FILE, stylesFile } from "../../live/shared";
import type { ReactExercise } from "../../live/types";

const FORM_CSS = `form .field { margin-bottom: 12px; }
label { display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px; color: #52525b; }
input {
  width: 100%;
  padding: 9px 12px;
  font: inherit;
  border: 1px solid #d4d4d8;
  border-radius: 10px;
  background: #fff;
}
input:focus { outline: 2px solid #6366f1; outline-offset: 1px; border-color: #6366f1; }
button[type="button"] {
  width: 100%;
  padding: 10px 14px;
  border: 0;
  border-radius: 10px;
  background: #4f46e5;
  color: #fff;
  font-weight: 600;
}
button[type="button"]:hover { background: #4338ca; }
.error {
  margin: 10px 0 0;
  padding: 9px 12px;
  border-radius: 10px;
  background: #fef2f2;
  color: #b91c1c;
  font-size: 13px;
}
.welcome {
  margin: 10px 0 0;
  padding: 9px 12px;
  border-radius: 10px;
  background: #ecfdf5;
  color: #047857;
  font-size: 13px;
}
`;

const scaffoldApp = `import React, { useState } from "react";

/**
 * Challenge 07 — Controlled login form
 *
 * Contract:
 *   form     [data-testid="login-form"]
 *   inputs   [data-testid="email-input"]  [data-testid="password-input"]
 *   submit   [data-testid="login-submit"]  (plain button)
 *   error    [data-testid="form-error"]    (rendered only when invalid)
 *   success  [data-testid="welcome"]       (rendered only when valid)
 *
 * Behavior:
 *   • inputs are controlled (value + onChange)
 *   • clicking submit with an empty field shows:
 *       "Email and password are required."
 *   • an email without an "@" shows: "Email must include "@"."
 *   • otherwise it shows "Welcome back, <email>!" and hides the error
 */
export default function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [welcome, setWelcome] = useState("");

  const onSubmit = () => {
    // TODO:
    //   1. empty email or password -> error "Email and password are required."
    //   2. email without "@"        -> error 'Email must include "@".'
    //   3. otherwise                 -> welcome "Welcome back, <email>!"
    };

  return (
    <main className="demo">
      <h2>Signed area</h2>

      <form data-testid="login-form">
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            data-testid="email-input"
            type="text"
            value={email}
            onChange={(event) => {
              // TODO: setEmail(event.target.value)
            }}
          />
        </div>

        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            data-testid="password-input"
            type="password"
            value={password}
            onChange={(event) => {
              // TODO: setPassword(event.target.value)
            }}
          />
        </div>

        <button type="button" data-testid="login-submit" onClick={onSubmit}>
          Log in
        </button>

        {/* TODO: render [data-testid="form-error"] when error is set */}
        {/* TODO: render [data-testid="welcome"] when welcome is set */}
      </form>
    </main>
  );
}
`;

const solutionApp = `import React, { useState } from "react";

export default function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [welcome, setWelcome] = useState("");

  const onSubmit = () => {
    setError("");
    setWelcome("");
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    if (email.indexOf("@") === -1) {
      setError('Email must include "@".');
      return;
    }
    setWelcome("Welcome back, " + email + "!");
  };

  return (
    <main className="demo">
      <h2>Signed area</h2>

      <form data-testid="login-form">
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            data-testid="email-input"
            type="text"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            data-testid="password-input"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        <button type="button" data-testid="login-submit" onClick={onSubmit}>
          Log in
        </button>

        {error && <p data-testid="form-error" className="error">{error}</p>}
        {welcome && <p data-testid="welcome" className="welcome">{welcome}</p>}
      </form>
    </main>
  );
}
`;

const spec = `import React from "react";
import App from "./App";
import { clickable, mount, typeText, waitFor } from "./_testbed";

describe("Login form", () => {
  function q(app, testId) {
    return clickable(testId, app.container);
  }

  function soft(app, testId) {
    return app.container.querySelector('[data-testid="' + testId + '"]');
  }

  function textOf(app, testId) {
    const el = soft(app, testId);
    return el ? el.textContent : "";
  }

  test("email, password and submit inputs exist", async () => {
    const app = mount(<App />);
    try {
      q(app, "email-input");
      q(app, "password-input");
      q(app, "login-submit");
    } finally {
      app.unmount();
    }
  });

  test("typing fills both inputs (controlled)", async () => {
    const app = mount(<App />);
    try {
      typeText(q(app, "email-input"), "ada@lovelace.dev");
      typeText(q(app, "password-input"), "s3cret");
      await waitFor(
        () => q(app, "email-input").value === "ada@lovelace.dev" && q(app, "password-input").value === "s3cret",
        "controlled inputs hold the typed values",
      );
    } finally {
      app.unmount();
    }
  });

  test("empty fields show the required error", async () => {
    const app = mount(<App />);
    try {
      q(app, "login-submit").click();
      await waitFor(() => Boolean(soft(app, "form-error")), "form-error rendered");
      const text = textOf(app, "form-error");
      expect(/required/i.test(text)).toBe(true);
      expect(soft(app, "welcome")).toBeFalsy();
    } finally {
      app.unmount();
    }
  });

  test("a password alone still demands a valid email", async () => {
    const app = mount(<App />);
    try {
      typeText(q(app, "email-input"), "ada-at-lovelace");
      typeText(q(app, "password-input"), "s3cret");
      q(app, "login-submit").click();
      await waitFor(() => Boolean(soft(app, "form-error")), "form-error for bad email");
      const text = textOf(app, "form-error");
      expect(/@/.test(text)).toBe(true);
      expect(soft(app, "welcome")).toBeFalsy();
    } finally {
      app.unmount();
    }
  });

  test("valid credentials greet the email and hide the error", async () => {
    const app = mount(<App />);
    try {
      typeText(q(app, "email-input"), "ada@lovelace.dev");
      typeText(q(app, "password-input"), "s3cret");
      q(app, "login-submit").click();

      await waitFor(() => Boolean(soft(app, "welcome")), "welcome message");
      expect(textOf(app, "welcome")).toContain("ada@lovelace.dev");
      expect(soft(app, "form-error")).toBeFalsy();
    } finally {
      app.unmount();
    }
  });
});
`;

export const loginFormExercise: ReactExercise = {
	id: "login-form",
	num: 7,
	title: "Controlled login form",
	tagline: "Controlled inputs, validation errors and conditional rendering",
	difficulty: "Easy",
	concepts: ["useState", "controlled inputs", "conditional render"],
	brief: `The bread-and-butter interview task: a form that holds its own state. Wire both inputs as controlled, validate on submit (required fields, then "@" in the email), and swap the error block for a welcome block when everything checks out. The hidden specs actually type into the inputs — so uncontrolled inputs will pass the first two tests and fail everything that matters.`,
	requirements: [
		'email and password are controlled inputs with data-testid="email-input" / "password-input"',
		"clicking login-submit with an empty email or password renders form-error containing \"required\"",
		"an email without \"@\" renders form-error containing \"@\"",
		"valid credentials render welcome containing the typed email, and no error",
	],
	hints: [
		"Controlled means value={email} plus onChange={(event) => setEmail(event.target.value)}.",
		"Clear both messages at the start of onSubmit so a failed attempt never leaves a stale welcome behind.",
		"email.indexOf(\"@\") === -1 is the cheapest validity check you need here.",
	],
	files: {
		"/App.js": {
			code: scaffoldApp,
			editable: true,
		},
		"/App.spec.jsx": { code: spec },
		"/_testbed.js": TESTBED_FILE,
		"/index.js": INDEX_FILE,
		"/styles.css": stylesFile(FORM_CSS),
	},
	solution: {
		"/App.js": solutionApp,
	},
};
