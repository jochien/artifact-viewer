import React, { useState, useMemo } from "react";
import {
  GitBranch,
  GitMerge,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Undo2,
  AlertTriangle,
  ShieldCheck,
  Terminal,
  ArrowRight,
  Layers,
  Info,
  Scissors,
  GitGraph,
} from "lucide-react";

/* ---------------------------------------------------------------
   GITHUB FLOW — six common situations, each as a flow
   Pick a scenario (happy path, behind, merge conflict, stacked
   PRs, failing CI, revert a bad merge) and walk its steps with
   the exact git/gh commands. Plus merge states, merge strategies,
   a cheat sheet, and a glossary. Grounded in real artifact-viewer
   PRs.
--------------------------------------------------------------- */

export const meta = {
  title: "GitHub Flow",
  description:
    "Six common GitHub situations as step-by-step flows — happy path, behind, merge conflict, stacked PRs, failing CI, reverting a bad merge — with the exact git/gh commands, plus merge states and strategies.",
  tags: ["explainer", "github", "workflow"],
};

const C = {
  bg: "#0D1117",
  bgAlt: "#010409",
  panel: "#161B22",
  panelAlt: "#1C2230",
  line: "#30363D",
  lineSoft: "#21262D",
  ink: "#E6EDF3",
  inkSoft: "#C9D1D9",
  muted: "#8B949E",
  green: "#3FB950",
  greenDim: "#12261E",
  blue: "#58A6FF",
  blueDim: "#0D2137",
  purple: "#A371F7",
  purpleDim: "#21173A",
  amber: "#D29922",
  amberDim: "#2B2411",
  red: "#F85149",
  redDim: "#2C1414",
  gray: "#6E7681",
  grayDim: "#1B1F27",
};

const FONT =
  "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const MONO = "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

/* ---------------------------------------------------------------
   THE SCENARIOS — six common situations, each a step-by-step flow.
   Exported so the data shape can be unit-tested without rendering.
--------------------------------------------------------------- */
export const SCENARIOS = [
  {
    id: "happy",
    label: "Happy path",
    icon: CheckCircle2,
    color: C.green,
    dim: C.greenDim,
    tagline: "Everything clean, done right — the flow you aim for every time.",
    steps: [
      {
        title: "Open an issue",
        body: "Write down the one thing you're about to do, small enough to finish in a single change. This is your unit of work.",
        cmd: 'gh issue create --title "Add dark mode toggle"',
      },
      {
        title: "Branch off a fresh main",
        body: "Make your own copy of the project to work in, so you never edit the shared main directly. Always start from an up-to-date main.",
        cmd: "git checkout main && git pull\ngit checkout -b feat/dark-mode",
      },
      {
        title: "Do the work, then commit",
        body: 'Make your change and save a labeled snapshot. Writing "Closes #62" tells GitHub to close that issue automatically when this lands.',
        cmd: 'git commit -m "Add dark mode toggle" -m "Closes #62"',
      },
      {
        title: "Push the branch",
        body: "Upload your branch to GitHub so a pull request — and the automated checks — can see it.",
        cmd: "git push -u origin feat/dark-mode",
      },
      {
        title: "Open a pull request",
        body: "Ask to merge your branch into main. This one action opens the review page and kicks off the automated build + tests.",
        cmd: 'gh pr create --title "Dark mode toggle" --body "Closes #62"',
      },
      {
        title: "Checks go green",
        body: "GitHub builds and tests your change on its own. Green means nothing is broken.",
        state: "CLEAN",
        stateColor: C.green,
      },
      {
        title: "Review, then squash-merge",
        body: "A human approves, then you merge — collapsing your commits into one clean line on main and deleting the branch.",
        cmd: "gh pr merge 62 --squash --delete-branch",
      },
      {
        title: "Sync main",
        body: "Update your local main so your next piece of work starts from the very latest. The loop begins again.",
        cmd: "git checkout main && git pull",
      },
    ],
  },
  {
    id: "behind",
    label: "Behind",
    icon: RefreshCw,
    color: C.amber,
    dim: C.amberDim,
    tagline: "Someone else's change landed on main while your PR waited.",
    steps: [
      {
        title: "Your PR is BEHIND",
        body: "Another PR merged into main after you branched. Because main is protected, GitHub won't let you merge until your branch includes those newer changes.",
        state: "BEHIND",
        stateColor: C.amber,
      },
      {
        title: "Pull main into your branch",
        body: "Bring main's new commits into your branch. One click on GitHub, or one command, does it — there's no conflict here, just catching up.",
        cmd: "gh pr update-branch 62\n# or locally:\ngit checkout feat/dark-mode && git merge origin/main",
      },
      {
        title: "Checks re-run",
        body: "Your branch just changed, so the build + tests run again automatically. Wait for green.",
        state: "UNKNOWN → CLEAN",
        stateColor: C.gray,
      },
      {
        title: "Merge",
        body: "Now it's up to date and green. Merge as usual.",
        cmd: "gh pr merge 62 --squash --delete-branch",
      },
      {
        title: "Seen it live",
        body: "This is exactly what happened to PRs #52 and #60 in this repo — each went BEHIND the moment another PR merged first.",
      },
    ],
  },
  {
    id: "conflict",
    label: "Merge conflict",
    icon: GitMerge,
    color: C.red,
    dim: C.redDim,
    tagline: "You and someone else changed the same lines.",
    steps: [
      {
        title: "Your PR is DIRTY",
        body: "Git can't automatically combine two edits to the same lines, so it flags a conflict. Nothing is broken — it just needs you to choose.",
        state: "DIRTY",
        stateColor: C.red,
      },
      {
        title: "Bring main into your branch",
        body: "Pull the latest main so the conflict appears on your machine, where you can fix it.",
        cmd: "git checkout feat/dark-mode && git pull origin main",
      },
      {
        title: "Resolve by hand",
        body: "Git marks the clashing spots with <<<<<<<, =======, >>>>>>>. Edit the file to the version you want — keeping the best of both sides — and delete those markers.",
      },
      {
        title: "Mark resolved and commit",
        body: "Tell git the conflict is settled, then commit the merge.",
        cmd: "git add . && git commit",
      },
      {
        title: "Push, then merge",
        body: "Push the fix; the PR turns green; merge it.",
        cmd: "git push",
      },
      {
        title: "Best defense",
        body: "Small, frequent PRs that merge quickly are the surest way to avoid big, painful conflicts.",
      },
    ],
  },
  {
    id: "stacked",
    label: "Stacked PRs",
    icon: Layers,
    color: C.purple,
    dim: C.purpleDim,
    tagline: "One feature builds on another that hasn't merged yet.",
    steps: [
      {
        title: "The trap",
        body: "Feature B needs feature A's code, but A isn't merged. If you branch B off A, you inherit A's unfinished work and a tangle to unwind later.",
        state: "avoid stacking",
        stateColor: C.amber,
      },
      {
        title: "Merge A first",
        body: "Land the one underneath, then update your local main so it has A's code.",
        cmd: "gh pr merge A --squash --delete-branch\ngit checkout main && git pull",
      },
      {
        title: "Branch B off fresh main",
        body: "Now start B from the just-merged main. It cleanly includes A, with no borrowed branch.",
        cmd: "git checkout -b feat/b",
      },
      {
        title: "Repeat, one at a time",
        body: 'Merge B, branch C off fresh main, and so on. This is "single-tracking" a dependent chain.',
      },
      {
        title: "Independent work is easier",
        body: "If two PRs touch different files, they don't depend on each other — open them in parallel and merge in any order. This chain was the gallery: #56 → #54 → #55.",
      },
    ],
  },
  {
    id: "ci-fail",
    label: "CI fails",
    icon: XCircle,
    color: C.red,
    dim: C.redDim,
    tagline: "You pushed, but a check went red.",
    steps: [
      {
        title: "A check is red",
        body: "A test failed or the build broke, so GitHub blocks the merge until it's fixed. The PR stays open — you don't start over.",
        state: "checks failing",
        stateColor: C.red,
      },
      {
        title: "Read the failing job",
        body: "Open the red check to see exactly what broke — the log points straight at the failing test or build error.",
        cmd: "gh pr checks 62   # or click the red X on the PR",
      },
      {
        title: "Fix it locally",
        body: "Reproduce and fix on your machine. Run the same checks CI runs until they pass.",
        cmd: "npm run build && npm test",
      },
      {
        title: "Push to the SAME branch",
        body: "You don't open a new PR. Pushing more commits to the same branch updates the existing PR and re-runs the checks automatically.",
        cmd: 'git commit -am "Fix failing test" && git push',
      },
      {
        title: "Green, then merge",
        body: "Once the checks pass, merge as usual.",
        state: "CLEAN",
        stateColor: C.green,
      },
      {
        title: "Catch it earlier",
        body: "Run build + test locally before you push, and CI rarely surprises you.",
      },
    ],
  },
  {
    id: "revert",
    label: "Revert a bad merge",
    icon: Undo2,
    color: C.blue,
    dim: C.blueDim,
    tagline: "Something broken already landed on main.",
    steps: [
      {
        title: "It's already on main",
        body: "A merged PR turned out to be broken. You don't rewrite history on a protected branch — instead you add a new commit that undoes the bad one.",
      },
      {
        title: "Open a revert PR",
        body: 'GitHub can generate a revert from the merged PR with its "Revert" button, or you can do it locally. Either way it becomes a normal PR.',
        cmd: "git revert -m 1 <merge-commit-sha>\n# then push and open a PR",
      },
      {
        title: "Let CI gate it",
        body: "The revert runs the same checks and gets reviewed, just like any other change.",
        state: "CLEAN",
        stateColor: C.green,
      },
      {
        title: "Merge, then fix forward",
        body: "Merging puts main back to the good state. Fix the real problem properly in a fresh PR afterward.",
        cmd: "gh pr merge <n> --squash --delete-branch",
      },
      {
        title: "Why revert, not delete",
        body: 'A revert is safe and traceable: it adds history that says "we undid this" rather than pretending it never happened.',
      },
    ],
  },
];

/* ---------------------------------------------------------------
   MERGE STATES — what GitHub says about a PR, and what to do.
--------------------------------------------------------------- */
const STATES = [
  {
    id: "clean",
    label: "CLEAN",
    icon: CheckCircle2,
    color: C.green,
    dim: C.greenDim,
    means: "CI green, up to date with main, no conflicts.",
    todo: "Merge it.",
  },
  {
    id: "behind",
    label: "BEHIND",
    icon: AlertTriangle,
    color: C.amber,
    dim: C.amberDim,
    means:
      "main moved ahead after you branched. Protection wants the branch up to date first.",
    todo: "Update the branch from main, let CI re-run.",
  },
  {
    id: "dirty",
    label: "DIRTY",
    icon: AlertTriangle,
    color: C.red,
    dim: C.redDim,
    means: "Your changes conflict with main — the same lines changed both places.",
    todo: "Pull main, resolve conflicts locally, push.",
  },
  {
    id: "unknown",
    label: "UNKNOWN",
    icon: RefreshCw,
    color: C.gray,
    dim: C.grayDim,
    means: "GitHub is still recomputing mergeability (usually right after main moves).",
    todo: "Wait a moment and re-check.",
  },
];

/* ---------------------------------------------------------------
   MERGE STRATEGIES — three ways to land a branch.
--------------------------------------------------------------- */
const STRATEGIES = [
  {
    id: "merge",
    label: "Merge commit",
    keeps: "Every branch commit + a merge node.",
    history: "Branching, honest, but noisy.",
    pick: false,
  },
  {
    id: "squash",
    label: "Squash",
    keeps: "One clean commit per PR.",
    history: "Linear, readable — one line per feature.",
    pick: true,
  },
  {
    id: "rebase",
    label: "Rebase",
    keeps: "Each commit, replayed onto main.",
    history: "Linear, no merge node; rewrites commit hashes.",
    pick: false,
  },
];

/* ---------------------------------------------------------------
   GH CHEAT SHEET — the commands this loop actually uses.
--------------------------------------------------------------- */
const CHEATS = [
  { cmd: "gh issue create", note: "open a new atomic issue" },
  { cmd: "git checkout -b feat/x", note: "branch off the current (synced) main" },
  { cmd: "git commit -m \"… Closes #n\"", note: "savepoint + auto-close on merge" },
  { cmd: "git push -u origin feat/x", note: "publish the branch to GitHub" },
  { cmd: "gh pr create", note: "open the PR (triggers CI)" },
  { cmd: "gh pr checks <n>", note: "see the CI status" },
  { cmd: "gh pr view <n>", note: "state, mergeability, checks" },
  { cmd: "gh pr merge <n> --squash --delete-branch", note: "land it, clean up" },
  { cmd: "gh pr update-branch <n>", note: "catch a BEHIND branch up to main" },
];

const GLOSSARY = [
  ["origin", "the GitHub copy of the repo (your default remote)"],
  ["HEAD", "the commit you're currently sitting on"],
  ["protected branch", "main — no direct pushes; PR + green CI required"],
  ["fast-forward", "main just moves up to your commits (no divergence)"],
  ["atomic issue", "one unit of work: Requirement + Acceptance + Test"],
  ["squash", "collapse a branch's commits into one before merging"],
];

/* =============================================================== */

function Chip({ children, color, bg }) {
  return (
    <span
      style={{
        fontFamily: MONO,
        fontSize: 10.5,
        color,
        background: bg,
        border: `1px solid ${color}44`,
        borderRadius: 5,
        padding: "2px 7px",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function SectionTitle({ icon: Icon, color, title, sub }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: 16,
        flexWrap: "wrap",
      }}
    >
      <Icon size={18} color={color} />
      <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{title}</h2>
      {sub && <span style={{ color: C.muted, fontSize: 12.5 }}>{sub}</span>}
    </div>
  );
}

export default function GitHubWorkflowExplainer() {
  const [scenarioId, setScenarioId] = useState(SCENARIOS[0].id);
  const scenario = useMemo(
    () => SCENARIOS.find((s) => s.id === scenarioId) || SCENARIOS[0],
    [scenarioId],
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `radial-gradient(1100px 560px at 12% -10%, ${C.panel}, ${C.bg} 60%)`,
        color: C.ink,
        fontFamily: FONT,
        padding: "34px clamp(18px, 4vw, 56px) 56px",
        boxSizing: "border-box",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 20,
          flexWrap: "wrap",
          marginBottom: 26,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 15,
              display: "grid",
              placeItems: "center",
              background: `linear-gradient(145deg, ${C.panelAlt}, ${C.panel})`,
              border: `1.5px solid ${C.line}`,
            }}
          >
            <GitGraph size={30} color={C.blue} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 29, fontWeight: 800, letterSpacing: -0.5 }}>
              GitHub Flow
            </h1>
            <p
              style={{
                margin: "5px 0 0",
                color: C.inkSoft,
                fontSize: 13.5,
                maxWidth: 560,
                lineHeight: 1.5,
              }}
            >
              The loop I actually run — now as six situations you'll actually
              hit, each a step-by-step flow with the exact git and gh commands.
            </p>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <Chip color={C.green} bg={C.greenDim}>main is protected</Chip>
            <Chip color={C.purple} bg={C.purpleDim}>squash + delete</Chip>
          </div>
          <div style={{ fontFamily: MONO, fontSize: 11, color: C.muted }}>
            jochien/artifact-viewer
          </div>
        </div>
      </div>

      {/* ===== SCENARIO PICKER + STEPS ===== */}
      <section
        style={{
          background: C.panel,
          border: `1px solid ${C.line}`,
          borderRadius: 18,
          padding: "22px 24px 26px",
          marginBottom: 22,
        }}
      >
        <SectionTitle
          icon={Layers}
          color={C.blue}
          title="Pick a scenario"
          sub="the flow for each common situation"
        />

        {/* pills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
          {SCENARIOS.map((s) => {
            const on = s.id === scenarioId;
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => setScenarioId(s.id)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  background: on ? s.color : C.bgAlt,
                  color: on ? C.bgAlt : C.inkSoft,
                  border: `1px solid ${on ? s.color : C.line}`,
                  borderRadius: 9,
                  padding: "8px 13px",
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: FONT,
                  transition: "all 160ms",
                }}
              >
                <Icon size={14} />
                {s.label}
              </button>
            );
          })}
        </div>

        {/* tagline */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 18,
            padding: "12px 14px",
            background: C.bgAlt,
            border: `1px solid ${scenario.color}44`,
            borderLeft: `3px solid ${scenario.color}`,
            borderRadius: 10,
          }}
        >
          <scenario.icon size={18} color={scenario.color} />
          <span style={{ fontSize: 13.5, color: C.inkSoft, lineHeight: 1.5 }}>
            {scenario.tagline}
          </span>
        </div>

        {/* step timeline */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {scenario.steps.map((st, i) => {
            const last = i === scenario.steps.length - 1;
            return (
              <div key={i} style={{ display: "flex", gap: 14 }}>
                {/* rail */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    flex: "0 0 auto",
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      display: "grid",
                      placeItems: "center",
                      background: scenario.dim,
                      border: `1.5px solid ${scenario.color}`,
                      color: scenario.color,
                      fontFamily: MONO,
                      fontSize: 12,
                      fontWeight: 700,
                      flex: "0 0 auto",
                    }}
                  >
                    {i + 1}
                  </div>
                  {!last && (
                    <div
                      style={{
                        width: 2,
                        flex: 1,
                        minHeight: 18,
                        background: C.line,
                        margin: "4px 0",
                      }}
                    />
                  )}
                </div>
                {/* content */}
                <div style={{ paddingBottom: last ? 0 : 18, flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 9,
                      flexWrap: "wrap",
                    }}
                  >
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{st.title}</span>
                    {st.state && (
                      <span
                        style={{
                          fontFamily: MONO,
                          fontSize: 10.5,
                          color: st.stateColor || C.muted,
                          background: C.bg,
                          border: `1px solid ${(st.stateColor || C.muted) + "55"}`,
                          borderRadius: 5,
                          padding: "2px 7px",
                        }}
                      >
                        {st.state}
                      </span>
                    )}
                  </div>
                  <p
                    style={{
                      margin: "5px 0 0",
                      fontSize: 12.8,
                      lineHeight: 1.55,
                      color: C.inkSoft,
                    }}
                  >
                    {st.body}
                  </p>
                  {st.cmd && (
                    <pre
                      style={{
                        margin: "9px 0 0",
                        padding: "9px 12px",
                        background: C.bgAlt,
                        border: `1px solid ${C.line}`,
                        borderRadius: 8,
                        fontFamily: MONO,
                        fontSize: 11.3,
                        color: C.green,
                        overflowX: "auto",
                        whiteSpace: "pre-wrap",
                        lineHeight: 1.5,
                      }}
                    >
                      {st.cmd}
                    </pre>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ===== MERGE STATES + STRATEGIES ===== */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 22,
          marginBottom: 22,
        }}
      >
        {/* MERGE STATES */}
        <section
          style={{
            background: C.panel,
            border: `1px solid ${C.line}`,
            borderRadius: 18,
            padding: "22px 24px",
          }}
        >
          <SectionTitle icon={ShieldCheck} color={C.amber} title="Merge states" sub="what a PR is telling you" />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {STATES.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.id}
                  style={{
                    display: "flex",
                    gap: 12,
                    background: C.bgAlt,
                    border: `1px solid ${s.color}33`,
                    borderRadius: 11,
                    padding: "11px 13px",
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: s.dim,
                      display: "grid",
                      placeItems: "center",
                      flex: "0 0 auto",
                    }}
                  >
                    <Icon size={16} color={s.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                      <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: s.color }}>
                        {s.label}
                      </span>
                    </div>
                    <div style={{ fontSize: 11.8, color: C.inkSoft, lineHeight: 1.45, marginTop: 2 }}>
                      {s.means}
                    </div>
                    <div style={{ fontSize: 11.5, color: C.muted, marginTop: 3 }}>
                      <b style={{ color: s.color }}>Do:</b> {s.todo}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* MERGE STRATEGIES */}
        <section
          style={{
            background: C.panel,
            border: `1px solid ${C.line}`,
            borderRadius: 18,
            padding: "22px 24px",
          }}
        >
          <SectionTitle icon={Scissors} color={C.purple} title="Merge strategies" sub="three ways to land a branch" />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {STRATEGIES.map((s) => (
              <div
                key={s.id}
                style={{
                  background: s.pick ? C.purpleDim : C.bgAlt,
                  border: `1px solid ${s.pick ? C.purple + "88" : C.lineSoft}`,
                  borderRadius: 11,
                  padding: "12px 14px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>{s.label}</span>
                  {s.pick && <Chip color={C.purple} bg={C.bg}>this repo</Chip>}
                </div>
                <div style={{ fontSize: 11.8, color: C.inkSoft, lineHeight: 1.45 }}>
                  {s.keeps}
                </div>
                <div style={{ fontSize: 11.5, color: C.muted, marginTop: 3 }}>
                  History: {s.history}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, fontSize: 11.5, color: C.muted, lineHeight: 1.5, fontStyle: "italic" }}>
            Squash keeps main readable: one line per feature, easy to scan and revert.
          </div>
        </section>
      </div>

      {/* ===== DEPENDENT VS INDEPENDENT PRs ===== */}
      <section
        style={{
          background: C.panel,
          border: `1px solid ${C.line}`,
          borderRadius: 18,
          padding: "22px 24px 24px",
          marginBottom: 22,
        }}
      >
        <SectionTitle icon={GitBranch} color={C.green} title="Independent vs. dependent PRs" sub="when order matters" />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 16,
          }}
        >
          {/* independent */}
          <div
            style={{
              background: C.bgAlt,
              border: `1px solid ${C.green}33`,
              borderRadius: 13,
              padding: "16px 18px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <CheckCircle2 size={15} color={C.green} />
              <span style={{ fontWeight: 700, fontSize: 13 }}>Independent</span>
              <Chip color={C.green} bg={C.greenDim}>merge any order</Chip>
            </div>
            <p style={{ margin: "0 0 10px", fontSize: 12.2, color: C.inkSoft, lineHeight: 1.5 }}>
              Different files, no shared code. Open them in parallel; merge whenever.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <Chip color={C.blue} bg={C.blueDim}>#52 artifact</Chip>
              <Chip color={C.blue} bg={C.blueDim}>#56 gallery</Chip>
              <span style={{ fontSize: 11.5, color: C.muted }}>→ touch different files → no conflict</span>
            </div>
          </div>

          {/* dependent */}
          <div
            style={{
              background: C.bgAlt,
              border: `1px solid ${C.amber}33`,
              borderRadius: 13,
              padding: "16px 18px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <AlertTriangle size={15} color={C.amber} />
              <span style={{ fontWeight: 700, fontSize: 13 }}>Dependent</span>
              <Chip color={C.amber} bg={C.amberDim}>single-track</Chip>
            </div>
            <p style={{ margin: "0 0 10px", fontSize: 12.2, color: C.inkSoft, lineHeight: 1.5 }}>
              Each builds on the last. Merge one, branch the next off freshly merged main —
              or you fight the “must be up to date” rule.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
              <Chip color={C.purple} bg={C.purpleDim}>#56</Chip>
              <ArrowRight size={13} color={C.muted} />
              <Chip color={C.purple} bg={C.purpleDim}>#54</Chip>
              <ArrowRight size={13} color={C.muted} />
              <Chip color={C.purple} bg={C.purpleDim}>#55</Chip>
              <span style={{ fontSize: 11.5, color: C.muted }}>the gallery chain</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== GH CHEAT SHEET + GLOSSARY ===== */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 22,
        }}
      >
        {/* cheat sheet */}
        <section
          style={{
            background: C.panel,
            border: `1px solid ${C.line}`,
            borderRadius: 18,
            padding: "22px 24px",
          }}
        >
          <SectionTitle icon={Terminal} color={C.blue} title="gh / git cheat sheet" sub="the commands this loop uses" />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {CHEATS.map((c) => (
              <div
                key={c.cmd}
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  gap: 12,
                  background: C.bgAlt,
                  border: `1px solid ${C.lineSoft}`,
                  borderRadius: 9,
                  padding: "8px 12px",
                }}
              >
                <code style={{ fontFamily: MONO, fontSize: 11.5, color: C.green }}>
                  {c.cmd}
                </code>
                <span style={{ fontSize: 11, color: C.muted, textAlign: "right", flex: "0 1 auto" }}>
                  {c.note}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* glossary */}
        <section
          style={{
            background: C.panel,
            border: `1px solid ${C.line}`,
            borderRadius: 18,
            padding: "22px 24px",
          }}
        >
          <SectionTitle icon={Info} color={C.gray} title="Glossary" sub="terms worth knowing" />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {GLOSSARY.map(([term, def]) => (
              <div key={term} style={{ display: "flex", gap: 11, alignItems: "baseline" }}>
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: C.blue,
                    flex: "0 0 120px",
                  }}
                >
                  {term}
                </span>
                <span style={{ fontSize: 12, color: C.inkSoft, lineHeight: 1.45 }}>
                  {def}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* FOOTER */}
      <div
        style={{
          marginTop: 24,
          textAlign: "center",
          color: C.muted,
          fontSize: 12.5,
          lineHeight: 1.6,
        }}
      >
        The value isn't memorizing commands — it's the loop:{" "}
        <span style={{ color: C.inkSoft }}>
          protect main, do one atomic thing on a branch, let CI + review gate it, land it clean, sync, repeat.
        </span>
      </div>
    </div>
  );
}
