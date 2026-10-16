# AGENTS.md — iprep_pro

Astro 7 static site (no adapter) + React 19 islands. Node >= 22.12, pnpm.

## Commands

```sh
pnpm exec astro dev --background   # dev server (plain `astro` is not on PATH)
pnpm exec astro dev stop|status|logs
npx tsc --noEmit -p tsconfig.json  # typecheck (no package script exists)
pnpm vitest run src/lib/content.test.ts   # single unit test file
pnpm test:e2e                      # Playwright only
pnpm release                       # build + full test suite (pre-ship check)
```

- `pnpm build` = `astro build && node scripts/generate-sw.js` — the service
  worker (`dist/sw.js`) is generated AFTER the Astro build. Plain
  `astro build` is not a complete build.
- Unit tests: Vitest, `happy-dom`, pattern `src/**/*.test.ts`.
- E2E tests: Playwright in `tests/e2e/`, config builds the full site and serves
  it via `astro preview` on 127.0.0.1:4173 (240s webServer timeout — it's
  slow). It reuses an already-running server on that port locally.

## Commits

Conventional Commits are enforced by `.githooks/commit-msg` (installed via
`pnpm install` → `core.hooksPath`). Format:
`<type>(<scope>)<!?: lowercase imperative summary, no trailing period>`.
Types: `feat fix docs style refactor perf test build ci chore revert`.

## Architecture

- ALL question content is JSON under `src/data/<category>/<topic>.json`, loaded
  at build time by `src/lib/content.ts` (`categories.json` defines category
  order = roadmap order). Content integrity is covered by unit tests — a new
  JSON file must match the schema (see README "Adding questions").
- Client interactivity is plain TS in `src/scripts/` (bundled by Astro) and
  islands in `src/components/`. User progress persists in localStorage via
  `src/lib/progress.ts`; site theme is a `dark` class on `<html>`.
- `/coding` challenges run user code in a sandboxed Web Worker
  (`public/coding-worker.js`) with console capture and a 4s infinite-loop
  timeout; spec JSON lives in `src/data/coding/*.json`.

## React live practice (`/coding/react-live`)

- Island `src/components/react-live/ReactLiveArena.tsx` mounts
  `client:only="react"`; exercises are plain-JS-string sandbox files in
  `src/data/react-live/` — no backticks or `${}` inside those template
  literals.
- Sandpack gotchas (hard-earned):
  - Stabilize `SandpackProvider` prop identities: `customSetup`, `options`,
    callbacks, and `files` must not be inline literals/churn per render, or the
    bundler re-derives state and recompiles/tests in an endless loop.
  - Hidden specs run Jest in-browser via `SandpackTests`; the shared `/_testbed`
    in `src/data/react-live/shared.ts` `flushSync`-mounts because React 19's
    deferred `root.render()` does not commit before immediate DOM queries.

## Documentation

Full Astro docs: https://docs.astro.build (routing, content, styling/Tailwind, i18n guides).
