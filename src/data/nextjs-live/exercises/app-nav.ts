import { INDEX_FILE, TESTBED_FILE, stylesFile } from "../../live/shared";
import type { ReactExercise } from "../../live/types";

const NAV_CSS = `.nav {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.nav-link {
  padding: 7px 14px;
  border: 1px solid #e4e4e7;
  border-radius: 999px;
  background: #fff;
  font: inherit;
  font-size: 13px;
  font-weight: 500;
  color: #52525b;
}
.nav-link[aria-current="page"] {
  border-color: #6366f1;
  background: #eef2ff;
  color: #4338ca;
}
.nav-path {
  margin: 0 0 10px;
  font-size: 12.5px;
  color: #71717a;
}
.nav-path code {
  font-family: ui-monospace, SFMono-Regular, monospace;
  background: #fafafa;
  border: 1px solid #e4e4e7;
  border-radius: 6px;
  padding: 1px 6px;
}
.screen {
  padding: 12px;
  border: 1px solid #e4e4e7;
  border-radius: 12px;
}
.screen h3 { margin: 0 0 4px; font-size: 14px; }
.screen p { margin: 0; font-size: 13px; color: #52525b; }
`;

const routerStub = `/**
 * Read-only emulation of the App Router history store
 * (docs: Linking and Navigating). Link clicks push the target path;
 * usePathname() subscribes the UI to those changes. The preview boots
 * directly on the demo page's route, /ships.
 */
var listeners = [];
var snapshot = "/ships";

export function navigateTo(path) {
  snapshot = path;
  for (var i = 0; i < listeners.length; i++) {
    listeners[i]();
  }
}

export function subscribe(listener) {
  listeners.push(listener);
  return function () {
    listeners = listeners.filter(function (item) {
      return item !== listener;
    });
  };
}

export function getSnapshot() {
  return snapshot;
}

/** Test-only seam: start every spec run from the boot route. */
export function resetRouter() {
  snapshot = "/ships";
  listeners = [];
}
`;

const linkStub = `import React from "react";
import { navigateTo } from "./router";

/**
 * Read-only emulation of next/link (docs: Linking and Navigating).
 * Renders a real anchor; on click it performs a client-side transition —
 * no full document navigation.
 */
export default function Link(props) {
  function handleClick(event) {
    event.preventDefault();
    navigateTo(props.href);
  }
  return (
    <a {...props} onClick={handleClick}>
      {props.children}
    </a>
  );
}
`;

const navigationStub = `import { useSyncExternalStore } from "react";
import { subscribe, getSnapshot } from "./router";

/**
 * Read-only emulation of next/navigation (docs: usePathname).
 * usePathname() returns the current pathname, e.g. "/rules", and rerenders
 * the calling component on every route change.
 */
export function usePathname() {
  return useSyncExternalStore(subscribe, getSnapshot);
}
`;

const scaffoldApp = `import React from "react";

const ROUTES = [
  {
    href: "/ships",
    id: "nav-ships",
    screenId: "screen-ships",
    label: "Ships",
    copy: "Every hull in the fleet, from dinghies to dreadnoughts.",
  },
  {
    href: "/rules",
    id: "nav-rules",
    screenId: "screen-rules",
    label: "Rules",
    copy: "The three laws of the harbor, plus one legendary exception.",
  },
  {
    href: "/crew",
    id: "nav-crew",
    screenId: "screen-crew",
    label: "Crew",
    copy: "Names, ranks and the mandatory cat assignments.",
  },
];

/**
 * Challenge 01 — App Router navigation (docs: Linking and Navigating)
 *
 * Contract:
 *   nav       [data-testid="nav"]            header with one Link per route
 *   links     [data-testid="nav-ships"] ...  real <a> elements with hrefs
 *   location  [data-testid="pathname"]       e.g. "/ships", "/rules"
 *   screens   [data-testid="screen-<name>"]  ONLY the active route renders
 *
 * The sandbox emulates the App Router with read-only stub modules:
 *   import Link from "./next/link";
 *   import { usePathname } from "./next/navigation";
 * (In a real project those imports come from "next/link" and
 *  "next/navigation" — nothing else changes.)
 */
export default function App() {
  // TODO:
  //   1. import Link from "./next/link" and usePathname from "./next/navigation"
  //   2. read the pathname, find the active route in ROUTES
  //   3. render each route as Link: <Link href=... data-testid=... aria-current=...>
  //   4. mirror the pathname into the chip
  //   5. render only the active screen
  return (
    <main className="demo">
      <h2>Admiralty handbook</h2>

      <header data-testid="nav" className="nav">
        {ROUTES.map((route) => (
          <button
            key={route.href}
            data-testid={route.id}
            className="nav-link"
          >
            {route.label}
          </button>
        ))}
      </header>

      <p className="nav-path">
        Path: <code data-testid="pathname"></code>
      </p>

      <section data-testid="screen-ships" className="screen">
        <h3>Ships</h3>
        <p>{ROUTES[0].copy}</p>
      </section>
      <section data-testid="screen-rules" className="screen" hidden>
        <h3>Rules</h3>
        <p>{ROUTES[1].copy}</p>
      </section>
      <section data-testid="screen-crew" className="screen" hidden>
        <h3>Crew</h3>
        <p>{ROUTES[2].copy}</p>
      </section>
    </main>
  );
}
`;

const solutionApp = `import React from "react";
import Link from "./next/link";
import { usePathname } from "./next/navigation";

const ROUTES = [
  {
    href: "/ships",
    id: "nav-ships",
    screenId: "screen-ships",
    label: "Ships",
    copy: "Every hull in the fleet, from dinghies to dreadnoughts.",
  },
  {
    href: "/rules",
    id: "nav-rules",
    screenId: "screen-rules",
    label: "Rules",
    copy: "The three laws of the harbor, plus one legendary exception.",
  },
  {
    href: "/crew",
    id: "nav-crew",
    screenId: "screen-crew",
    label: "Crew",
    copy: "Names, ranks and the mandatory cat assignments.",
  },
];

export default function App() {
  const pathname = usePathname();
  const active =
    ROUTES.find((route) => route.href === pathname) ?? ROUTES[0];

  return (
    <main className="demo">
      <h2>Admiralty handbook</h2>

      <header data-testid="nav" className="nav">
        {ROUTES.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            data-testid={route.id}
            className="nav-link"
            aria-current={route.href === pathname ? "page" : undefined}
          >
            {route.label}
          </Link>
        ))}
      </header>

      <p className="nav-path">
        Path: <code data-testid="pathname">{pathname}</code>
      </p>

      <section data-testid={active.screenId} className="screen">
        <h3>{active.label}</h3>
        <p>{active.copy}</p>
      </section>
    </main>
  );
}
`;

const spec = `import React from "react";
import App from "./App";
import { resetRouter } from "./next/router";
import { clickable, mount, waitFor } from "./_testbed";

describe("App Router navigation", () => {
  function soft(app, testId) {
    return app.container.querySelector('[data-testid="' + testId + '"]');
  }

  function attrOf(app, testId, name) {
    const el = soft(app, testId);
    return el ? el.getAttribute(name) : null;
  }

  function textOf(app, testId) {
    const el = soft(app, testId);
    return el ? el.textContent.trim() : "";
  }

  beforeEach(function () {
    resetRouter();
  });

  test("renders one real Link per route with the right hrefs", async () => {
    const app = mount(<App />);
    try {
      const names = ["ships", "rules", "crew"];
      for (const name of names) {
        const el = clickable("nav-" + name, app.container);
        expect(el.tagName).toBe("A");
        expect(el.getAttribute("href")).toBe("/" + name);
      }
    } finally {
      app.unmount();
    }
  });

  test("boots on /ships with the pathname chip in sync", async () => {
    const app = mount(<App />);
    try {
      await waitFor(
        () => textOf(app, "pathname") === "/ships",
        "pathname chip mirrors the boot route",
      );
      expect(soft(app, "screen-ships")).toBeTruthy();
      expect(attrOf(app, "nav-ships", "aria-current")).toBe("page");
    } finally {
      app.unmount();
    }
  });

  test("clicking a Link performs a client-side transition", async () => {
    const app = mount(<App />);
    try {
      clickable("nav-rules", app.container).click();

      await waitFor(
        () => textOf(app, "pathname") === "/rules",
        "pathname chip updated to /rules",
      );
      expect(attrOf(app, "nav-rules", "aria-current")).toBe("page");
      expect(attrOf(app, "nav-ships", "aria-current")).toBeNull();
    } finally {
      app.unmount();
    }
  });

  test("only the active screen renders — and it follows the link", async () => {
    const app = mount(<App />);
    try {
      clickable("nav-crew", app.container).click();
      await waitFor(() => Boolean(soft(app, "screen-crew")), "crew shown");
      expect(soft(app, "screen-ships")).toBeFalsy();

      clickable("nav-ships", app.container).click();
      await waitFor(() => Boolean(soft(app, "screen-ships")), "ships back");
      expect(soft(app, "screen-crew")).toBeFalsy();
      expect(attrOf(app, "nav-ships", "aria-current")).toBe("page");
    } finally {
      app.unmount();
    }
  });
});
`;

export const appNavExercise: ReactExercise = {
	id: "app-nav",
	num: 1,
	title: "Link + usePathname navigation",
	tagline: "App Router client navigation with active-link state",
	difficulty: "Easy",
	concepts: ["next/link", "usePathname", "client navigation"],
	brief: `The App Router docs open with the two pieces every route needs: Link for client-side navigation and usePathname() to know where you are. Wire the three handbook routes as real anchors, mirror the pathname into a chip, and swap to the active screen — aria-current="page" and everything — when a link is clicked. The sandbox can't run the real Next.js server, so the router is a visible read-only emulation: the imports match the docs, the modules live under ./next/.`,
	requirements: [
		'nav renders ships/rules/crew as Link anchors — data-testid "nav-ships", "nav-rules", "nav-crew" — with hrefs /ships, /rules, /crew',
		'data-testid "pathname" mirrors the router: "/ships" on boot, "/rules" after clicking the rules link',
		"only the active route's screen renders (data-testid \"screen-<name>\") and it follows every click",
		'the active link carries aria-current="page"; inactive links carry none',
	],
	hints: [
		'import Link from "./next/link" (the emulation of next/link) and usePathname from "./next/navigation".',
		"Derive the active route by comparing pathname with each route's href; conditional attribute: aria-current={active ? \"page\" : undefined} keeps inactive links clean.",
		"Render one <section> keyed off the active route — conditional rendering, not hidden elements, is what the specs watch.",
	],
	files: {
		"/App.js": {
			code: scaffoldApp,
			editable: true,
		},
		"/App.spec.jsx": { code: spec },
		"/next/router.js": { code: routerStub, visible: true },
		"/next/link.js": { code: linkStub, visible: true },
		"/next/navigation.js": { code: navigationStub, visible: true },
		"/_testbed.js": TESTBED_FILE,
		"/index.js": INDEX_FILE,
		"/styles.css": stylesFile(NAV_CSS),
	},
	solution: {
		"/App.js": solutionApp,
	},
};
