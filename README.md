# iPrep Pro

A fast, private interview-prep platform built with Astro. Browse real interview
questions, follow guided learning roadmaps, practice in three modes, and track
progress — all without an account. Everything is stored locally in the browser.

## Getting started

```sh
pnpm install
pnpm dev        # start dev server (background mode: astro dev --background)
pnpm build      # static production build to ./dist
pnpm preview    # preview the production build
```

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
  `git`, `beh`. The prefix maps questions to categories for progress math.
- Progress keys in localStorage: `iprep.progress.v1`, theme: `iprep.theme`.
