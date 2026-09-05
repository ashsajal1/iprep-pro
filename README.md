# iPrep Pro

A fast, private interview-prep platform built with Astro. Browse real interview
questions, follow guided learning roadmaps, practice in three modes, and track
progress — all without an account. Everything is stored locally in the browser.

![iPrep Pro](public/screenshots/home.png)

## Getting started

```sh
pnpm install
pnpm dev        # start dev server (background mode: astro dev --background)
pnpm build      # static production build to ./dist
pnpm preview    # preview the production build
pnpm test       # run unit tests (vitest)
```

## Coding challenges

`/coding` hosts write-and-run JavaScript challenges. Each entry lives in
`src/data/coding/*.json`:

```json
{
	"id": "code-001",
	"slug": "reverse-string",
	"title": "Reverse a String",
	"topic": "Strings",
	"difficulty": "beginner",
	"description": "Implement reverseString(str)…",
	"hints": ["…"],
	"starterCode": "function reverseString(str) {}",
	"solution": "function reverseString(str) { … }",
	"tests": [{ "fn": "reverseString", "args": ["hello"], "expected": "olleh" }]
}
```

- `args` / `expected` must be JSON values; results are deep-compared inside a
  sandboxed Web Worker (`public/coding-worker.js`) with console capture and a
  4s infinite-loop timeout.
- The editor is Monaco from CDN with an automatic textarea fallback.

## Commit message rules

This repo enforces [Conventional Commits](https://www.conventionalcommits.org) via a
git hook (`.githooks/commit-msg`). It installs automatically on `pnpm install`
(sets `core.hooksPath`); to do it manually:

```sh
git config core.hooksPath .githooks
```

Format:

```
<type>(<optional scope>)<!?: <lowercase imperative summary>
```

| Rule | Detail |
| --- | --- |
| **Type** | one of `feat fix docs style refactor perf test build ci chore revert` |
| **Scope** | optional, e.g. `fix(api): …` |
| **Breaking** | append `!` before the colon |
| **Summary** | starts lowercase, no trailing period, ≤ 100 chars total header |
| **No junk** | `wip`, placeholder or TODO-only messages are rejected |

Good: `feat(coding): add timer to challenge runner` · Bad: `fixed some stuff.`

> Hooks only run locally — CI and code review remain the real gatekeepers.
> `--no-verify` bypasses the check; please don't, except in emergencies.

## Testing

`pnpm test` runs the full stack: 50+ Vitest unit tests (content integrity,
progress store, language normalization) followed by Playwright integration
tests that build the site, serve it and drive a real browser through search,
practice modes, progress, theming and the coding workspace.

## Architecture

```
src/
  data/                     # ALL question content lives here (JSON)
    categories.json         #   category + topic metadata (order = roadmap order)
    javascript/*.json       #   one file per topic, array of questions
    react/… behavioral/…
  lib/
    content.ts              # loads/filters/searches questions at build time
    progress.ts             # localStorage store used by client scripts
    highlight.ts            # shiki dual-theme code highlighting
    types.ts                # shared TypeScript types
  components/               # reusable Astro components (cards, badges, …)
  layouts/BaseLayout.astro
  pages/
    index.astro             # homepage
    questions/[id].astro    # per-question page (static, SEO-indexable)
    [category]/index.astro  # category overview + grouped questions
    practice/[category].astro  # practice runner (learn/practice/quick modes)
    roadmap.astro  progress.astro  favorites.astro  404.astro
    api/questions/[category].json.ts   # full content for the runner
    search-index.json.ts               # lightweight index for client search
  scripts/                  # client-side TS (bundled by Astro)
```

## Adding questions (or thousands of them)

1. Open `src/data/<category>/<topic>.json` (create a file if needed).
2. Append a question object:

```json
{
  "id": "js-021",
  "category": "javascript",
  "topic": "fundamentals",
  "question": "Your question?",
  "difficulty": "beginner",
  "shortAnswer": "One-sentence interview-ready answer.",
  "explanation": "Deeper explanation.",
  "example": "const x = 1;",
  "interviewTip": "How to deliver this answer well.",
  "commonMistakes": ["Mistake one"],
  "relatedQuestions": ["js-001", "js-002"]
}
```

3. Done. Routes, search index, API payloads and counts all regenerate on build.
   New topic? Add it to that category's `topics` array in `categories.json`.
   New category? Add a full entry to `categories.json`.

## Conventions

- Question ids: `<prefix>-<number>` — `js`, `rct`, `ts`, `nxt`, `nde`, `hcs`,
  `git`, `beh`, `sd`, `db`, `web`. The prefix maps questions to categories for progress math.
- Progress keys in localStorage: `iprep.progress.v1`, theme: `iprep.theme`.
