import type { ExerciseFile } from "./types";

/**
 * Shared sandbox plumbing for every exercise.
 *
 * These files are authored as plain JS strings (no backticks / ${} inside!)
 * so they stay happy inside TypeScript template literals.
 */

/** Entry point — renders the user's App without StrictMode (we don't want
 *  double-invoked effects in a test-heavy sandbox). */
export const INDEX_JS = `import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

import App from "./App";

document.title = "iprep · live practice";
createRoot(document.getElementById("root")).render(<App />);
`;

export const BASE_CSS = `*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  min-height: 100vh;
  padding: 20px 16px;
  background: #fafafa;
  color: #18181b;
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  font-size: 14px;
  line-height: 1.5;
}
.demo {
  max-width: 470px;
  margin: 0 auto;
  background: #ffffff;
  border: 1px solid #e4e4e7;
  border-radius: 16px;
  padding: 18px;
  box-shadow: 0 10px 30px rgba(24, 24, 27, 0.06);
}
.demo h2 {
  margin: 0 0 14px;
  font-size: 15px;
  letter-spacing: -0.01em;
}
button { font: inherit; cursor: pointer; }
.muted { color: #a1a1aa; }
`;

/** Tiny DOM/React test helpers the hidden specs import. */
export const TESTBED_JS = `/**
 * Miniature test helpers used by the hidden specs.
 * Read-only — you don't need to build anything here.
 */
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";

export function sleep(ms) {
  return new Promise(function (resolve) { setTimeout(resolve, ms); });
}

export async function waitFor(predicate, label, timeout) {
  var deadline = Date.now() + (timeout || 3000);
  while (Date.now() < deadline) {
    try {
      if (predicate()) return;
    } catch (e) {
      /* the DOM may not be ready yet */
    }
    await sleep(25);
  }
  throw new Error("Timed out after " + (timeout || 3000) + "ms waiting for: " + (label || "condition"));
}

export function q(testId, container) {
  return (container || document).querySelector('[data-testid="' + testId + '"]');
}

export function rows(testId, container) {
  return Array.prototype.slice.call(
    (container || document).querySelectorAll('[data-testid="' + testId + '"]')
  );
}

export function clickable(testId, container) {
  var el = q(testId, container);
  if (!el) {
    throw new Error('Expected [data-testid="' + testId + '"] to exist');
  }
  return el;
}

/* Set the value of a controlled input/textarea the way React expects.
 *
 * Two traps, both hit for real inside Sandpack's jest sandbox:
 *  1. Referencing the GLOBAL HTMLInputElement.prototype can throw
 *     "Illegal invocation" — the spec realm and the sandbox DOM realm can
 *     differ, so the setter must come from the ELEMENT's realm.
 *     Object.getPrototypeOf(el) is always realm-consistent.
 *  2. A plain assignment (el.value = x) goes through React's own value-tracker
 *     accessor on the node, which quietly records the new value — the
 *     later input event looks like "nothing changed" and onChange never
 *     fires. The raw prototype setter bypasses the tracker instead. */
export function typeText(el, value) {
  if (!el) throw new Error("typeText: element not found");
  var descriptor = Object.getOwnPropertyDescriptor(
    Object.getPrototypeOf(el),
    "value",
  );
  if (descriptor && descriptor.set) {
    descriptor.set.call(el, value);
  } else {
    el.value = value;
  }
  el.dispatchEvent(new Event("input", { bubbles: true }));
  return el;
}

export function press(el, key) {
  el.dispatchEvent(new KeyboardEvent("keydown", {
    key: key,
    bubbles: true,
    cancelable: true,
  }));
  return el;
}

export function scrollBottom(el) {
  if (!el) throw new Error("scrollBottom: element not found");
  el.scrollTop = el.scrollHeight;
  el.dispatchEvent(new Event("scroll", { bubbles: true }));
  return el;
}

/* Mount a React element in its own container; returns .container and .unmount().
 * flushSync makes the first commit synchronous — React root.render() alone is
 * deferred, and specs query the DOM right after mount(). */
export function mount(element) {
  var container = document.createElement("div");
  container.setAttribute("data-spec-root", "true");
  document.body.appendChild(container);
  var root = createRoot(container);
  flushSync(function () {
    root.render(element);
  });
  return {
    container: container,
    unmount: function () {
      flushSync(function () {
        root.unmount();
      });
      container.remove();
    },
  };
}
`;

export const TESTBED_FILE: ExerciseFile = {
	code: TESTBED_JS,
};

export const INDEX_FILE: ExerciseFile = {
	code: INDEX_JS,
};

/** Per-exercise stylesheet = shared base + exercise extras. */
export function stylesFile(extraCss = ""): ExerciseFile {
	return { code: BASE_CSS + (extraCss ? "\n" + extraCss + "\n" : "") };
}
