# Copilot instructions

The full playbook lives in [AGENTS.md](../AGENTS.md). Read it first. The non-negotiables:

- This is a **viewer with authoring help, not a generator**. Never bundle an LLM or codegen.
- **Artifacts** (`src/artifacts/*.jsx`): one self-contained file, `export default` a React
  component, import only `react`/`react-dom`/`lucide-react`, inline styles only, no network
  or external assets.
- **Workflow:** `main` is protected. Branch off fresh `main`, keep the diff scoped to one
  issue, ensure `npm run build` and `npm test` pass, open a PR that says `Closes #<n>`, and
  let CI (`build (Node 18)` / `build (Node 20)`) gate the merge (squash + delete branch).
- **Tests:** Vitest, node environment (no jsdom). Test pure helpers, not React rendering.
  Add a test for every behavior change.
- **Issues** are atomic with Requirement + Acceptance criteria + Test case. File new ideas as
  new issues; do not widen the scope of the one you are on.
- The in-app prompt (`src/authoringPrompt.js`) must stay in sync with `docs/authoring.md`
  (a test enforces it).
