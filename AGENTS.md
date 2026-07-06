# AGENTS.md — building Artifact Viewer

> Read this before working in this repo. It is the shared playbook for humans, the
> in-editor assistant, and the GitHub Copilot coding agent. If anything here conflicts
> with an issue, the issue wins for that task; otherwise this file is the source of truth.

## What this is

A tiny local Vite + React 18 viewer that renders React `.jsx` artifacts dropped into
`src/artifacts/`. It is the "Claude Artifacts panel, next to VS Code" idea: paste or drop
an AI-generated component and see it render live.

**Product guardrail (do not drift):** this is a **viewer with authoring help, not a
generator**. Never bundle an LLM, add server-side codegen, or turn it into an AI. Authoring
support means docs, a scaffold, and surfacing a prompt. Keep the core about rendering fast
with zero friction.

## Repo map

| Path | What it is |
|---|---|
| `src/App.jsx` | The whole viewer: globs `src/artifacts/*.jsx`, picker, `React.lazy` render, `ErrorBoundary`, deep-link + pop-out |
| `src/artifactNames.js` | Pure helpers: `pathToName`, `nameToPath`, `isPopout` (DOM-free, unit-tested) |
| `src/authoringPrompt.js` | `AUTHORING_PROMPT` string shown in-app. **Source of truth is `docs/authoring.md`**; kept in sync by a test |
| `src/main.jsx`, `index.html` | Entry points |
| `scripts/add-artifact.mjs` | `npm run add` — copy a file into `src/artifacts/` (`--open` to open it) |
| `scripts/new-artifact.mjs` | `npm run new` — scaffold a blank valid artifact |
| `scripts/view-artifact.mjs` | `npm run view` — copy + start/reuse the dev server + open the artifact |
| `scripts/lib/open-url.mjs` | Shared cross-platform open helper (`openCommand`, `openUrl`) |
| `docs/authoring.md` | How to author a viewer-ready artifact + the copy-paste AI prompt |
| `test/*.test.js` | Vitest unit tests (pure logic; no jsdom configured) |
| `.vscode/tasks.json` | "Open in Artifact Viewer" task (runs `view` on the current file) |
| `.github/workflows/ci.yml` | CI: `npm ci` + `npm run build` + `npm test` on Node 18 and 20 |

## Artifact constraints (every artifact in `src/artifacts/` must follow)

1. One self-contained file. No helper modules or split components.
2. `export default` a React function component.
3. Import **only** from `react`, `react-dom`, `lucide-react`. No other libraries (no
   Tailwind, no CSS files/modules, no charting/animation/utility packages).
4. Inline styles only (a `style={{ ... }}` object). No `className` frameworks or external CSS.
5. No network requests and no external assets. Generate visuals with inline SVG or CSS,
   keep sample data inline.

These constraints keep every artifact renderable with zero install. The copy-paste prompt in
`docs/authoring.md` encodes them; if you change them, update that prompt and
`src/authoringPrompt.js` together (a test enforces the prompt/doc match).

## Development workflow

`main` is **protected**. Do not commit to `main` directly.

1. Branch off fresh `main`: `git checkout main && git pull --rebase origin main`, then
   `git checkout -b <type>/<short-name>` (`feat/`, `fix/`, `docs/`, `chore/`).
2. Implement one issue. Keep the diff scoped to that issue.
3. `npm run build` and `npm test` must pass locally.
4. Commit with `Closes #<n>` in the message, push, open a PR whose body also says `Closes #<n>`.
5. **CI must pass** before merge: the required checks are `build (Node 18)` and
   `build (Node 20)`, which run `npm ci`, `npm run build`, and `npm test`. Local-only passing
   is not enough (CI uses `npm ci`, so keep `package-lock.json` committed and in sync).
6. Merge with **squash + delete branch** once CI is green and the PR is reviewed.
7. Single-track when landing several dependent PRs: branch each from the freshly merged
   `main` to avoid the strict up-to-date requirement fighting you.

## Testing

- Vitest, run with `npm test`. The environment is node (no jsdom), so **test pure logic, not
  React rendering**. Factor testable logic into small pure helpers and unit-test those.
- Add or extend a test for every behavior change. New pure helpers should ship with a test.

## Conventions

- Scripts are Node ESM (`.mjs`). Reuse `scripts/add-artifact.mjs`'s name-sanitizing
  (`[a-zA-Z0-9-_]`) and `scripts/lib/open-url.mjs` for opening URLs.
- Do not add runtime dependencies casually. Dev tooling goes in `devDependencies`.
- Never commit `node_modules/`, `dist/`, or throwaway demo artifacts. Clean up temp files
  before committing.
- No em dashes in prose (this is a house style for docs and READMEs).
- Naming an npm script `X` makes npm auto-run a `preX` script if one exists (this is why the
  boilerplate `preview` script was renamed to `serve`: `npm run view` was triggering it).

## Issues

The backlog is the plan. Every issue is **atomic** and carries a **Requirement**,
**Acceptance criteria** (checkboxes), and a **Test case** so it can be picked up autonomously.
Write new issues in that shape. If you notice an improvement while building, file it as a new
issue rather than expanding the current one.

## Who runs what

- **GitHub Copilot coding agent / any agent:** good for atomic, CI-verifiable issues. Open a
  PR, let CI gate it, a human merges.
- **Interactive / local session:** needed for anything that requires a GUI to verify (for
  example a VS Code extension in the Extension Development Host) or cross-cutting refactors.
