import { INDEX_FILE, TESTBED_FILE, stylesFile } from "../shared";
import type { ReactExercise } from "../types";

const TABS_CSS = `.tabs {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid #e4e4e7;
  margin-bottom: 12px;
}
.tabs [role="tab"] {
  padding: 8px 12px;
  border: 0;
  border-bottom: 2px solid transparent;
  background: transparent;
  font: inherit;
  font-weight: 600;
  color: #71717a;
}
.tabs [role="tab"][aria-selected="true"] {
  color: #4f46e5;
  border-bottom-color: #4f46e5;
}
.tabs [role="tab"]:focus-visible {
  outline: 2px solid #6366f1;
  outline-offset: 2px;
}
.panel p { margin: 4px 0; color: #52525b; }
.panel { font-size: 13.5px; }
`;

const scaffoldApp = `import React, { useState } from "react";

const TABS = [
  {
    id: 0,
    label: "Profile",
    copy: "Name, avatar and pronouns live here.",
  },
  {
    id: 1,
    label: "Billing",
    copy: "Invoices, payment method and plan details.",
  },
  {
    id: 2,
    label: "Teams",
    copy: "Manage squads, invite teammates, review seats.",
  },
];

/**
 * Challenge 05 — Accessible tabs
 *
 * Contract:
 *   tablist  [data-testid="tablist"]  role="tablist"
 *   tabs     [data-testid="tab-0" … "tab-2"]   role="tab", aria-selected
 *   panels   [data-testid="panel-0" … "panel-2"] role="tabpanel"
 *
 * Behavior:
 *   • the active tab is aria-selected="true", the others "false"
 *   • only the active panel is visible (use the hidden attribute)
 *   • clicking a tab activates it
 *   • ArrowRight / ArrowLeft move the selection (and wrap around both ends)
 */
export default function App() {
  const [active, setActive] = useState(0);

  const onKeyDown = (event) => {
    // TODO:
    //   ArrowRight → (active + 1) % TABS.length
    //   ArrowLeft  → (active + TABS.length - 1) % TABS.length
    // (wrap-around is handled by the % math above)
  };

  return (
    <main className="demo">
      <h2>Account tabs</h2>

      <div data-testid="tablist" role="tablist" className="tabs" onKeyDown={onKeyDown}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            data-testid={"tab-" + tab.id}
            role="tab"
            aria-selected={/* TODO: true/false based on the active state */}
            onClick={() => {
              // TODO: activate this tab
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {TABS.map((tab) => (
        <section
          key={tab.id}
          data-testid={"panel-" + tab.id}
          role="tabpanel"
          id={"panel-" + tab.id}
          hidden={/* TODO: only the active panel shows */}
        >
          <p>{tab.copy}</p>
        </section>
      ))}
    </main>
  );
}
`;

const solutionApp = `import React, { useState } from "react";

const TABS = [
  { id: 0, label: "Profile", copy: "Name, avatar and pronouns live here." },
  { id: 1, label: "Billing", copy: "Invoices, payment method and plan details." },
  { id: 2, label: "Teams", copy: "Manage squads, invite teammates, review seats." },
];

export default function App() {
  const [active, setActive] = useState(0);

  const onKeyDown = (event) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      setActive((current) => (current + 1) % TABS.length);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      setActive((current) => (current + TABS.length - 1) % TABS.length);
    }
  };

  return (
    <main className="demo">
      <h2>Account tabs</h2>

      <div data-testid="tablist" role="tablist" className="tabs" onKeyDown={onKeyDown}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            data-testid={"tab-" + tab.id}
            role="tab"
            aria-selected={tab.id === active}
            tabIndex={tab.id === active ? 0 : -1}
            onClick={() => setActive(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {TABS.map((tab) => (
        <section
          key={tab.id}
          data-testid={"panel-" + tab.id}
          role="tabpanel"
          id={"panel-" + tab.id}
          hidden={tab.id !== active}
        >
          <p>{tab.copy}</p>
        </section>
      ))}
    </main>
  );
}
`;

const spec = `import React from "react";
import App from "./App";
import { clickable, mount, press, waitFor } from "./_testbed";

describe("Accessible tabs", () => {
  test("the first tab is selected and its panel visible", async () => {
    const app = mount(<App />);
    try {
      await waitFor(() => q(app, "tab-0").getAttribute("aria-selected") === "true", "tab-0 selected");
      expect(q(app, "tab-1").getAttribute("aria-selected")).toBe("false");
      expect(q(app, "tab-2").getAttribute("aria-selected")).toBe("false");

      expect(q(app, "panel-0").hidden).toBe(false);
      expect(q(app, "panel-1").hidden).toBe(true);
      expect(q(app, "panel-2").hidden).toBe(true);
    } finally {
      app.unmount();
    }
  });

  test("clicking a tab activates it and swaps panels", async () => {
    const app = mount(<App />);
    try {
      await waitFor(() => Boolean(q(app, "tab-0")), "tabs mounted");
      clickable("tab-1", app.container).click();

      await waitFor(() => q(app, "tab-1").getAttribute("aria-selected") === "true", "tab-1 selected");
      expect(q(app, "panel-0").hidden).toBe(true);
      expect(q(app, "panel-1").hidden).toBe(false);
      expect(q(app, "panel-2").hidden).toBe(true);
    } finally {
      app.unmount();
    }
  });

  test("ArrowRight moves the selection", async () => {
    const app = mount(<App />);
    try {
      await waitFor(() => Boolean(q(app, "tab-0")), "tabs mounted");
      press(q(app, "tab-0"), "ArrowRight");

      await waitFor(() => q(app, "tab-1").getAttribute("aria-selected") === "true", "ArrowRight → tab-1");
      expect(q(app, "panel-1").hidden).toBe(false);
    } finally {
      app.unmount();
    }
  });

  test("ArrowLeft wraps around from the first tab", async () => {
    const app = mount(<App />);
    try {
      await waitFor(() => Boolean(q(app, "tab-0")), "tabs mounted");
      press(q(app, "tab-0"), "ArrowLeft");

      await waitFor(() => q(app, "tab-2").getAttribute("aria-selected") === "true", "wrapped to tab-2");
      expect(q(app, "panel-0").hidden).toBe(true);
      expect(q(app, "panel-2").hidden).toBe(false);
    } finally {
      app.unmount();
    }
  });
});

function q(app, testId) {
  return clickable(testId, app.container);
}
`;

export const tabsExercise: ReactExercise = {
	id: "tabs",
	num: 5,
	title: "Accessible tabs",
	tagline: "ARIA roles, selection state and keyboard movement",
	difficulty: "Medium",
	concepts: ["ARIA", "keyboard events", "modular % math"],
	brief: `React plus real accessibility. The role attributes are scaffolded; you drive the state: clicks, aria-selected, the hidden attribute on panels, and — the part interviewers probe — ArrowRight/ArrowLeft navigation with wrap-around using modular arithmetic.`,
	requirements: [
		'active tab: aria-selected="true"; inactive tabs: "false"',
		"only the active panel is visible (hidden attribute on the rest)",
		"clicking [data-testid=\"tab-N\"] activates tab N",
		"ArrowRight moves forward, ArrowLeft backward, both wrap around the ends",
	],
	hints: [
		"Wrap-around: next = (active + 1) % TABS.length — ArrowLeft's is (active + TABS.length - 1) % TABS.length.",
		"call event.preventDefault() on arrow keys so the page never scrolls along.",
		"The hidden attribute is a boolean prop in JSX: hidden={tab.id !== active}.",
	],
	files: {
		"/App.js": {
			code: scaffoldApp,
			editable: true,
		},
		"/App.spec.jsx": { code: spec },
		"/_testbed.js": TESTBED_FILE,
		"/index.js": INDEX_FILE,
		"/styles.css": stylesFile(TABS_CSS),
	},
	solution: {
		"/App.js": solutionApp,
	},
};
