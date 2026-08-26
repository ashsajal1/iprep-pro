# Contributing to iPrep Pro

Thanks for helping improve iPrep Pro! This guide covers how to set up the
project, what the conventions are, and how to get your changes reviewed and
merged. It's a small codebase and a good place to build something real — if
anything here is unclear or wrong, open an issue or a PR.

## Quick links

- [Getting started](#getting-started)
- [Project layout](#project-layout)
- [Development workflow](#development-workflow)
- [Code & style conventions](#code--style-conventions)
- [Adding questions](#adding-questions)
- [Testing](#testing)
- [Commit message rules](#commit-message-rules)
- [Opening a pull request](#opening-a-pull-request)

## Getting started

**Prerequisites**

- **Node.js >= 22.12** (see `engines` in `package.json`)
- **pnpm** (the repo uses a `pnpm-lock.yaml`; `pnpm install` is required to
  get reproducible installs and to trigger the git-hook setup)

```sh
git clone git@github.com:ashsajal1/iprep_pro.git
cd iprep_pro
pnpm install
pnpm dev        # start the dev server at http://localhost:4321
```

> The Astro dev server supports a managed background mode:
> `astro dev --background` (also `astro dev stop` / `astro dev status` /
> `astro dev logs`). See the workspace `AGENTS.md` for details.

**Common commands**

| Command | What it does |
| --- | --- |
| `pnpm dev` | start the dev server (hot reload) |
| `pnpm build` | static production build into `./dist` |
| `pnpm preview` | preview the production build locally |
| `pnpm test` | run unit tests (vitest) **then** e2e tests (Playwright) |
| `pnpm test:watch` | run vitest in watch mode |
| `pnpm test:e2e` | run only the Playwright e2e suite |
| `pnpm release` | `pnpm build && pnpm test`, the release pipeline |

## Project layout

```
src/
  data/                     # ALL question/content data lives here (JSON)
    categories.json         #   category + topic metadata (order = roadmap order)
    javascript/*.json       #   one file per topic, array of questions
    react/ typescript/ nextjs/ nodejs/ html-css/ git-github/ behavioral/ coding/
  lib/
    content.ts              # loads/filters/searches questions at build time
    progress.ts             # localStorage store used by client scripts
    highlight.ts            # shiki dual-theme code highlighting
    types.ts                # shared TypeScript types
  components/               # reusable Astro components (cards, badges, …)
  layouts/BaseLayout.astro
  pages/
    index.astro             #         homepage (dashboard)
    questions/index.astro   # browse/filter/sort the full question bank
    questions/[id].astro    # per-question page (static, SEO-indexable)
    [category]/index.astro  # category overview + questions grouped by topic
    practice/[category].astro # practice runner (learn / practice / quick)
    roadmap.astro  progress.astro  favorites.astro  404.astro
    api/questions/*.json.ts # full content + search index for the runner
  scripts/                  # client-side TS (bundled by Astro)
  styles/global.css         # Tailwind v4 theme + shared primitives
tests/
  e2e/                      # Playwright integration tests
public/                     # static assets (favicon, coding-worker.js, …)
.githooks/commit-msg        # Conventional Commits enforcement hook
```

## Development workflow

1. **Find something to work on.** Check the open issues first, or propose a
   change before sinking time into it — a quick issue/comment avoids duplicated
   effort.
2. **Create a branch** off `main` with a short, descriptive name:

   ```bash
   git checkout -b feat/some-description
   ```

3. **Make small, focused changes.** Prefer tiny commits over one huge one; it
   makes review faster and `git bisect` easier.
4. **Run the checks below** before opening a PR.
5. **Open a PR** against `main`.

## Code & style conventions

- **TypeScript throughout.** Astro components use `---` frontmatter; client
  scripts live in `src/scripts/` and are bundled by Astro. Keep types shared in
  `src/lib/types.ts`.
- **Formatting / whitespace.** Source files use tabs for indentation. Match the
  surrounding style and don't reformat unrelated regions.
- **Styling is Tailwind v4 + CSS variables.** Global primitives (`.btn`,
  `.card`, `.input`, `.chip`, …) live in `src/styles/global.css`. Prefer the
  semantic tokens (`text-ink`, `bg-surface-raised`, `border-line`, …) so light
  and dark themes stay consistent.
- **Degrade gracefully without JS.** The site is static-first: routes, the
  search index and API payloads are generated at build time, and interactivity
  is progressive enhancement.
- **Keep data in JSON.** Content never lives in markup; edits go through the
  data layer so counts, search, and pages stay in sync.
- **No account/backend dependencies.** The app is private, self-contained, and
  stores everything locally in the browser.

## Adding questions

Question data lives in `src/data/<category>/<topic>.json`. New topics and
categories go into `src/data/categories.json`.

1. Open the relevant file (or create one — add the topic to `categories.json`
   if it's new).
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

3. Done — routes, search index, API payloads, and counts all regenerate on
   build. The unit tests in `src/lib/content.test.ts` verify every question is
   well-formed; run `pnpm test` to catch typos or missing fields.

**Question id prefixes** map questions to categories for progress math:
`js`, `rct`, `ts`, `nxt`, `nde`, `hcs`, `git`, `beh`, and `code-###` for
coding-challenge entries.

## Testing

`pnpm test` runs the full stack:

- **Unit tests** (Vitest + happy-dom) — verify content integrity, the progress
  store, and language normalization: `src/lib/*.test.ts`.
- **Integration tests** (Playwright) — build the site, serve the production
  build via `astro preview`, and drive a real browser through search, practice
  modes, progress, theming, question pages, and the coding workspace:
  `tests/e2e/*.spec.ts`.

Guidelines:

- Install Playwright browsers the first time: `npx playwright install chromium`
  (the e2e config uses Chrome by default).
- When you touch a page or a user-facing behavior, add or update a test so the
  suite stays green.
- Run at least the relevant suite before opening a PR, e.g.
  `pnpm test:e2e -- --grep <keyword>` or a specific file:
  `npx playwright test tests/e2e/listing.spec.ts`.

## Commit message rules

This repo enforces [Conventional Commits](https://www.conventionalcommits.org)
via the `commit-msg` git hook (installed automatically by `pnpm install`, which
sets `core.hooksPath` to `.githooks`). To ensure it manually:

```bash
git config core.hooksPath .githooks
```

Format:

```
<type>(<optional scope>)<!?: <lowercase imperative summary>

<body? — sentence explaining the WHY, not the WHAT>
```

| Rule | Detail |
| --- | --- |
| **Type** | `feat` · `fix` · `docs` · `style` · `refactor` · `perf` · `test` · `build` · `ci` · `chore` · `revert` |
| **Scope** | optional and bounded, e.g. `fix(questions): …` |
| **Breaking** | append `!` before the colon |
| **Summary** | lowercase imperative, **no trailing period**, header ≤ 100 chars |
| **No junk** | `wip`, TODO, placeholder, or `xxx`-style messages are rejected |

Good: `feat(practice): add timed mode` · Bad: `fixed some stuff.`

> `--no-verify` bypasses the check — reserved for genuine emergencies. CI and
> code review remain the real gatekeeper.

## Opening a pull request

Before you open a PR, make sure your branch:

- [ ] is rebased on the latest `main`;
- [ ] changes are scoped (separate PR/commit per feature or fix);
- [ ] `pnpm build` succeeds;
- [ ] `pnpm test` passes (or at least the targeted suites for your change);
- [ ] respects the formatting and styling conventions above.

Then open the PR against `main`. In the description, summarize the **why** and
**what**, link any related issue, and include a quick way to reproduce/verify
the change (including how to view it on mobile, since the site is mobile-first).

**Code of conduct**

Contributors are expected to be respectful and constructive. Review feedback is
meant to improve the codebase — treat it as collaborative, and defend design
decisions with reasoning rather than turf.