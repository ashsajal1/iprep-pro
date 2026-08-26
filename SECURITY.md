# Security Policy

We take the security of **iPrep Pro** seriously. This project is deliberately
small and static, but we still want to hear about anything that could harm
users or the project.

## Supported versions

The project is under active development and only the **latest** commit on the
default branch receives security fixes. There are no LTS releases or backport
windows.

If you are running a deployed fork or an older pinned version, please upgrade
to the latest release before evaluating a fix.

## Reporting a vulnerability

**Please do not open a public issue for security vulnerabilities.**

Instead, report privately so we can fix it before it is disclosed:

1. Open a **private security advisory** on GitHub:
   https://github.com/ashsajal1/iprep_pro/security/advisories/new
2. If you cannot use advisories, email the maintainer directly (prefer the
   advisory — it keeps the report associated with the repo and gives you a
   tracking number).

We aim to acknowledge reports within **7 days** and to ship a fix within **30
days** for issues that affect the deployed site. Critical issues are handled
with priority.

When reporting, please include:

- Affected version / commit hash
- Steps to reproduce (ideally a minimal example)
- Impact assessment (what is an attacker able to do?)
- Any suggested fix or mitigation

## Scope

**In scope** — bugs in this repository that can harm users or the deployment:

- Client-side injection (XSS) via question content, search, localStorage, or
  the coding workspace output
- The coding-challenge runner escaping its intended sandbox (see
  [Coding workspace](#coding-workspace))
- Malicious or hijacked third-party resources (CDN, dependencies)
- Information leakage in the public data/API files
- Supply-chain issues in `package.json` / `pnpm-lock.yaml` dependencies

**Out of scope** — non-issues we will close without a fix:

- Spam / phishing / SEO abuse of a static site with no accounts (report to the
  hosting provider instead)
- "Vulnerabilities" in third-party sites linked from question content
- Self-XSS where a user deliberately pastes code into their own editor
- Local, offline attacks against a user's own browser profile containing only
  their own data
- Feature requests or crash reports without a security impact (use Issues)

## Security model

iPrep Pro is a **static, client-side-only application**. There is no backend,
no database, no accounts, and no server-side processing of user input. That
removes entire classes of bugs (auth bypass, SQLi, SSRF, IDOR, rate limiting,
…) but it also means **all security boundaries live in the browser**.

What this means in practice:

- **No user data ever leaves the browser.** Progress, favorites, and theme are
  stored in `localStorage` under `iprep.progress.v1` and `iprep.theme`. Never
  store credentials or other secrets in the app — anything in localStorage is
  readable and writable by any script on the origin (and is a per-origin, not
  per-user, store).

- **All content is static JSON built into the site.** Questions, answers, and
  examples are authored in `src/data/` and rendered as static HTML — they are
  trusted content, not user input. Any free-text rendering path must assume the
  data could someday contain HTML, so keep using the escaping helpers
  (`escapeHtml`/`esc`) and avoid `set:html` on untrusted strings.

- **Third-party resources are minimal but real.** Monaco is loaded from the
  jsDelivr CDN (version-pinned, no SRI hash today). Anyone who can tamper with
  that CDN response could run script on this origin. This is a known, accepted
  trade-off; a review/PR adding SRI hashes or self-hosting Monaco would be
  welcome.
## Coding workspace

The `/coding` pages execute **untrusted user code** in the browser. Defense in
depth:

1. Code runs inside a dedicated **Web Worker** (`public/coding-worker.js`),
   off the main thread — the UI can never be frozen by user code.
2. User code is compiled with `new Function` and given **no DOM access**; the
   only channel back to the page is `postMessage`.
3. A hard timeout terminates and respawns the worker, killing infinite loops.
4. `console.*` output is captured and streamed back to the output panel.

**Known limitations (please do not report these — accepted by design):**

- Workers are **not a hard security boundary**. They share the origin's
  storage model, and `new Function` gives full access to the worker's global
  scope. The runner is intended to contain *accidental* infinite loops and
  messy code, **not** to defend against a determined attacker on the same
  origin. We do not claim it is a jail.
- There is no cross-origin isolation (COOP/COEP) today, so timing side
  channels are not fully mitigated.
- The worker shares same-origin network rules; cross-origin requests still
  must obey CORS.

## Dependency hygiene

- Dependencies are pinned and the lockfile is committed — installs are
  reproducible via `pnpm`.
- The `prepare` script sets up the commit hook and the repo enforces
  Conventional Commits; CI and review gate dependency changes.
- Treat any PR that adds a runtime dependency or a network call as a review
  **security check**: it expands the trust boundary.

## Threat model summary

| Asset | Protection | Residual risk |
| --- | --- | --- |
| User's progress/favorites (localStorage) | Never transmitted; origin-scoped by the browser | XSS on this origin can read/modify it (local, self-inflicted) |
| Question/answer content | Static build-time data; canonical inputs | Content-authoring mistakes (mitigated by review + tests) |
| Dev environment | Normal GitHub repo controls | Credential leaks in commits / issues |
| Third-party CDN | Version-pinned | CDN compromise → script injection (no SRI yet) |

## Disclosure policy

We follow a **coordinated disclosure** model:

- We confirm the issue and scope.
- We fix it on the default branch.
- We credit reporters (with permission) in the release notes.

If you believe you have found a critical issue affecting the deployed site,
please give us 90 days before any public disclosure to allow time for a fix and
for users to upgrade.

## Thanks

Thank you for helping keep iPrep Pro safe. Reviews, fixes, and reports of this
nature are genuinely appreciated.