import { INDEX_FILE, TESTBED_FILE, stylesFile } from "../shared";
import type { ReactExercise } from "../types";

const TODO_CSS = `.add {
  display: flex;
  gap: 8px;
}
.add input {
  flex: 1;
  min-width: 0;
  padding: 8px 10px;
  border: 1px solid #e4e4e7;
  border-radius: 10px;
  font: inherit;
}
.add input:focus { outline: 2px solid #6366f1; outline-offset: 0; }
.add button {
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid #4f46e5;
  background: #4f46e5;
  color: #fff;
  font-weight: 600;
}
.filters { display: flex; gap: 6px; margin: 12px 0 8px; }
.chip {
  padding: 4px 10px;
  font-size: 12px;
  border: 1px solid #e4e4e7;
  border-radius: 999px;
  background: #fff;
}
.chip.active {
  background: #4f46e5;
  border-color: #4f46e5;
  color: #fff;
}
.todos { list-style: none; margin: 8px 0 0; padding: 0; display: grid; gap: 6px; }
.todos li {
  display: flex;
  gap: 10px;
  align-items: center;
  border: 1px solid #e4e4e7;
  border-radius: 10px;
  padding: 8px 10px;
  background: #fff;
}
.todos li span[data-testid="todo-text"] { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.todos li.done span[data-testid="todo-text"] {
  text-decoration: line-through;
  color: #a1a1aa;
}
.todos li button {
  border: 0;
  background: transparent;
  color: #d4d4d8;
  font-weight: 700;
  padding: 2px 4px;
  border-radius: 6px;
}
.todos li button:hover { color: #ef4444; background: #fef2f2; }
.remaining { margin-top: 10px; font-size: 12px; color: #71717a; }
`;

const scaffoldApp = `import React, { useState } from "react";

let nextId = 3;

/**
 * Challenge 02 — Todo board
 *
 * Contract the hidden tests check:
 *   input      [data-testid="todo-input"]        controlled input
 *   add        [data-testid="add"]               button: appends the task and clears the input
 *   item       [data-testid="todo-item"]         one <li> per task, data-done="true|false"
 *   text       [data-testid="todo-text"]         the task title (already wired)
 *   check      [data-testid="todo-check"]        checkbox that toggles done
 *   del        [data-testid="todo-del"]          removes the row
 *   filters    [data-testid="filter-all" | "filter-active" | "filter-done"]
 *   remaining  [data-testid="remaining"]         shows "N left" for tasks not done
 *
 * The skeleton renders; your job is the state logic.
 */
export default function App() {
  const [todos, setTodos] = useState([
    { id: 1, text: "Read the useReducer docs", done: true },
    { id: 2, text: "Ship the todo board", done: false },
  ]);
  const [draft, setDraft] = useState("");
  const [filter, setFilter] = useState("all"); // "all" | "active" | "done"

  const addTodo = () => {
    // TODO:
    //   1. trim the draft — an empty task is a no-op
    //   2. append { id: nextId++, text, done: false }
    //   3. clear the input back to ""
  };

  const toggleTodo = (id) => {
    // TODO: flip done for the matching todo
    // (immutable update: map + spread)
  };

  const removeTodo = (id) => {
    // TODO: filter the todo out of the list
  };

  const visible = todos; // TODO: apply the active filter
  const remaining = todos.length; // TODO: count todos where done === false

  return (
    <main className="demo">
      <h2>Todo board</h2>

      <div className="add">
        <input
          data-testid="todo-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="What needs doing?"
        />
        <button data-testid="add" onClick={addTodo}>Add</button>
      </div>

      <div className="filters">
        {[["all", "All"], ["active", "Active"], ["done", "Done"]].map(
          ([key, label]) => (
            <button
              key={key}
              data-testid={"filter-" + key}
              className={filter === key ? "chip active" : "chip"}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ),
        )}
      </div>

      <ul className="todos">
        {visible.map((todo) => (
          <li
            key={todo.id}
            data-testid="todo-item"
            data-done={String(todo.done)}
            className={todo.done ? "done" : ""}
          >
            <input
              type="checkbox"
              data-testid="todo-check"
              checked={todo.done}
              onChange={() => toggleTodo(todo.id)}
            />
            <span data-testid="todo-text">{todo.text}</span>
            <button
              data-testid="todo-del"
              aria-label="Remove task"
              onClick={() => removeTodo(todo.id)}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      <footer data-testid="remaining" className="remaining">
        {remaining} left
      </footer>
    </main>
  );
}
`;

const solutionApp = `import React, { useState } from "react";

let nextId = 3;

export default function App() {
  const [todos, setTodos] = useState([
    { id: 1, text: "Read the useReducer docs", done: true },
    { id: 2, text: "Ship the todo board", done: false },
  ]);
  const [draft, setDraft] = useState("");
  const [filter, setFilter] = useState("all");

  const addTodo = () => {
    const text = draft.trim();
    if (!text) return;
    setTodos((prev) => prev.concat({ id: nextId++, text, done: false }));
    setDraft("");
  };

  const toggleTodo = (id) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    );
  };

  const removeTodo = (id) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  const visible = todos.filter((t) =>
    filter === "all" ? true : filter === "done" ? t.done : !t.done,
  );
  const remaining = todos.filter((t) => !t.done).length;

  return (
    <main className="demo">
      <h2>Todo board</h2>

      <div className="add">
        <input
          data-testid="todo-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="What needs doing?"
        />
        <button data-testid="add" onClick={addTodo}>Add</button>
      </div>

      <div className="filters">
        {[["all", "All"], ["active", "Active"], ["done", "Done"]].map(
          ([key, label]) => (
            <button
              key={key}
              data-testid={"filter-" + key}
              className={filter === key ? "chip active" : "chip"}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ),
        )}
      </div>

      <ul className="todos">
        {visible.map((todo) => (
          <li
            key={todo.id}
            data-testid="todo-item"
            data-done={String(todo.done)}
            className={todo.done ? "done" : ""}
          >
            <input
              type="checkbox"
              data-testid="todo-check"
              checked={todo.done}
              onChange={() => toggleTodo(todo.id)}
            />
            <span data-testid="todo-text">{todo.text}</span>
            <button
              data-testid="todo-del"
              aria-label="Remove task"
              onClick={() => removeTodo(todo.id)}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      <footer data-testid="remaining" className="remaining">
        {remaining} left
      </footer>
    </main>
  );
}
`;

const spec = `import React from "react";
import App from "./App";
import { clickable, mount, rows, typeText, waitFor } from "./_testbed";

describe("Todo board", () => {
  test("renders the seeded board", async () => {
    const app = mount(<App />);
    try {
      await waitFor(() => rows("todo-item", app.container).length === 2, "two seeded todos");
      await waitFor(() =>
        qRemaining(app).textContent.indexOf("1") === 0 ||
        qRemaining(app).textContent.trim() === "1 left",
        "one task left",
      );
    } finally {
      app.unmount();
    }
  });

  test("adding a todo appends it and clears the input", async () => {
    const app = mount(<App />);
    try {
      const input = clickable("todo-input", app.container);
      typeText(input, "Call mom");
      clickable("add", app.container).click();

      await waitFor(() => rows("todo-item", app.container).length === 3, "three todos");
      await waitFor(() =>
        rows("todo-item", app.container)[2].querySelector('[data-testid="todo-text"]')
          .textContent === "Call mom",
        "appended at the end",
      );
      await waitFor(() => input.value === "", "input cleared");
    } finally {
      app.unmount();
    }
  });

  test("toggling completion updates the counter", async () => {
    const app = mount(<App />);
    try {
      const first = rows("todo-item", app.container)[0];
      first.querySelector('[data-testid="todo-check"]').click();
      await waitFor(() => first.dataset.done === "false", "first row toggled off");

      await waitFor(() =>
        qRemaining(app).textContent.replace(/\\D+/g, "") === "2",
        "twice as much left to do",
      );
    } finally {
      app.unmount();
    }
  });

  test("filters narrow the visible list", async () => {
    const app = mount(<App />);
    try {
      const input = clickable("todo-input", app.container);
      typeText(input, "Ship it");
      clickable("add", app.container).click();
      await waitFor(() => rows("todo-item", app.container).length === 3, "todo added");

      clickable("filter-done", app.container).click();
      await waitFor(() => rows("todo-item", app.container).length === 1, "only done shown");

      clickable("filter-active", app.container).click();
      await waitFor(() => rows("todo-item", app.container).length === 2, "only active shown");
    } finally {
      app.unmount();
    }
  });

  test("delete removes the row", async () => {
    const app = mount(<App />);
    try {
      const first = rows("todo-item", app.container)[0];
      first.querySelector('[data-testid="todo-del"]').click();
      await waitFor(() => rows("todo-item", app.container).length === 1, "one row left");
    } finally {
      app.unmount();
    }
  });
});

/* Accepts either the mount app ({ container }) or a plain container node —
 * some call sites pass the app object, so unwrap defensively. */
function qRemaining(from) {
  return clickable("remaining", from.container || from);
}
`;

export const todoExercise: ReactExercise = {
	id: "todo-list",
	num: 2,
	title: "Todo board",
	tagline: "Adding, toggling, filtering and deleting from state",
	difficulty: "Easy",
	concepts: ["list state", "immutable updates", "conditional render"],
	brief: `A board that interviewers still love: create, toggle, filter, delete. The markup and the test hooks are already scaffolded — the hidden specs exercise the four operations, so the interesting part is doing immutable state updates and keeping the "N left" counter honest.`,
	requirements: [
		"add appends a trimmed task and clears the input (ignore empty drafts)",
		"todo-check toggles the task's done state without mutating other rows",
		"filter-all / filter-active / filter-done narrow the visible list",
		"todo-del removes the task",
		'remaining always shows how many tasks still have done === false',
	],
	hints: [
		"setTodos((prev) => prev.concat(newTodo)) is the safest append — it never depends on a stale array.",
		"Toggling: prev.map((t) => t.id === id ? { ...t, done: !t.done } : t).",
		"Filters are derived value, not new state: compute `visible` from todos + filter on each render.",
	],
	files: {
		"/App.js": {
			code: scaffoldApp,
			editable: true,
		},
		"/App.spec.jsx": { code: spec },
		"/_testbed.js": TESTBED_FILE,
		"/index.js": INDEX_FILE,
		"/styles.css": stylesFile(TODO_CSS),
	},
	solution: {
		"/App.js": solutionApp,
	},
};
