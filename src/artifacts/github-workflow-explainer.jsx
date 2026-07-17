import React, { useState, useMemo, useEffect } from "react";
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
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Monitor,
  Cloud,
  CornerUpLeft,
  Rocket,
  Cpu,
  Upload,
  Server,
  Download,
  Hammer,
  FlaskConical,
  Package,
  Globe,
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
   Each step declares `where` it happens ("local" | "github") so the
   animation can place it on the right rail, and `back: true` marks a
   setback (the dot recoils). Exported so the shape is unit-testable.
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
        where: "github",
        body: "Write down the one thing you're about to do, small enough to finish in a single change. This is your unit of work.",
        cmd: 'gh issue create --title "Add dark mode toggle"',
      },
      {
        title: "Branch off a fresh main",
        where: "local",
        body: "Make your own copy of the project to work in, so you never edit the shared main directly. Always start from an up-to-date main.",
        cmd: "git checkout main && git pull\ngit checkout -b feat/dark-mode",
      },
      {
        title: "Do the work, then commit",
        where: "local",
        body: 'Make your change and save a labeled snapshot. Writing "Closes #62" tells GitHub to close that issue automatically when this lands.',
        cmd: 'git commit -m "Add dark mode toggle" -m "Closes #62"',
      },
      {
        title: "Push the branch",
        where: "github",
        body: "Send your commits up to GitHub so a pull request — and the automated checks — can see them. This is the local → GitHub crossing.",
        cmd: "git push -u origin feat/dark-mode",
      },
      {
        title: "Open a pull request",
        where: "github",
        body: "Ask to merge your branch into main. This one action opens the review page and kicks off the automated build + tests.",
        cmd: 'gh pr create --title "Dark mode toggle" --body "Closes #62"',
      },
      {
        title: "Checks go green",
        where: "github",
        ci: true,
        body: "GitHub builds and tests your change on its own servers. Green means nothing is broken.",
        state: "CLEAN",
        stateColor: C.green,
      },
      {
        title: "Review, then squash-merge",
        where: "github",
        body: "A human approves, then you merge — collapsing your commits into one clean line on main and deleting the branch.",
        cmd: "gh pr merge 62 --squash --delete-branch",
      },
      {
        title: "Sync main",
        where: "local",
        body: "Pull the merged commit back down so your local main matches, and your next piece of work starts from the very latest.",
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
        where: "github",
        back: true,
        body: "Another PR merged into main after you branched. Because main is protected, GitHub won't let you merge until your branch includes those newer changes.",
        state: "BEHIND",
        stateColor: C.amber,
      },
      {
        title: "Update your branch",
        where: "github",
        body: "Pull main's new commits into your branch. One click on GitHub, or one command, does it — there's no conflict here, just catching up.",
        cmd: "gh pr update-branch 62\n# or locally:\ngit checkout feat/dark-mode && git merge origin/main",
      },
      {
        title: "Checks re-run",
        where: "github",
        ci: true,
        body: "Your branch just changed, so the build + tests run again automatically. Wait for green.",
        state: "UNKNOWN → CLEAN",
        stateColor: C.gray,
      },
      {
        title: "Merge",
        where: "github",
        body: "Now it's up to date and green. Merge as usual.",
        cmd: "gh pr merge 62 --squash --delete-branch",
      },
      {
        title: "Seen it live",
        where: "github",
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
        where: "github",
        back: true,
        body: "Git can't automatically combine two edits to the same lines, so it flags a conflict. Nothing is broken — it just needs you to choose.",
        state: "DIRTY",
        stateColor: C.red,
      },
      {
        title: "Bring main into your branch",
        where: "local",
        body: "Pull the latest main so the conflict appears on your machine, where you can fix it.",
        cmd: "git checkout feat/dark-mode && git pull origin main",
      },
      {
        title: "Resolve by hand",
        where: "local",
        body: "Git marks the clashing spots with <<<<<<<, =======, >>>>>>>. Edit the file to the version you want — keeping the best of both sides — and delete those markers.",
      },
      {
        title: "Mark resolved and commit",
        where: "local",
        body: "Tell git the conflict is settled, then commit the merge.",
        cmd: "git add . && git commit",
      },
      {
        title: "Push, then merge",
        where: "github",
        body: "Push the fix; the PR turns green; merge it.",
        cmd: "git push",
      },
      {
        title: "Best defense",
        where: "local",
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
        where: "local",
        back: true,
        body: "Feature B needs feature A's code, but A isn't merged. If you branch B off A, you inherit A's unfinished work and a tangle to unwind later.",
        state: "avoid stacking",
        stateColor: C.amber,
      },
      {
        title: "Merge A first",
        where: "github",
        body: "Land the one underneath, then update your local main so it has A's code.",
        cmd: "gh pr merge A --squash --delete-branch\ngit checkout main && git pull",
      },
      {
        title: "Branch B off fresh main",
        where: "local",
        body: "Now start B from the just-merged main. It cleanly includes A, with no borrowed branch.",
        cmd: "git checkout -b feat/b",
      },
      {
        title: "Repeat, one at a time",
        where: "local",
        body: 'Merge B, branch C off fresh main, and so on. This is "single-tracking" a dependent chain.',
      },
      {
        title: "Independent work is easier",
        where: "github",
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
        where: "github",
        back: true,
        ci: true,
        ciFail: true,
        body: "A test failed or the build broke, so GitHub blocks the merge until it's fixed. The PR stays open — you don't start over.",
        state: "checks failing",
        stateColor: C.red,
      },
      {
        title: "Read the failing job",
        where: "github",
        body: "Open the red check to see exactly what broke — the log points straight at the failing test or build error.",
        cmd: "gh pr checks 62   # or click the red X on the PR",
      },
      {
        title: "Fix it locally",
        where: "local",
        body: "Reproduce and fix on your machine. Run the same checks CI runs until they pass.",
        cmd: "npm run build && npm test",
      },
      {
        title: "Push to the SAME branch",
        where: "github",
        body: "You don't open a new PR. Pushing more commits to the same branch updates the existing PR and re-runs the checks automatically.",
        cmd: 'git commit -am "Fix failing test" && git push',
      },
      {
        title: "Green, then merge",
        where: "github",
        ci: true,
        body: "Once the checks pass, merge as usual.",
        state: "CLEAN",
        stateColor: C.green,
      },
      {
        title: "Catch it earlier",
        where: "local",
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
        where: "github",
        back: true,
        body: "A merged PR turned out to be broken. You don't rewrite history on a protected branch — instead you add a new commit that undoes the bad one.",
      },
      {
        title: "Open a revert PR",
        where: "local",
        body: 'GitHub can generate a revert from the merged PR with its "Revert" button, or you can do it locally. Either way it becomes a normal PR.',
        cmd: "git revert -m 1 <merge-commit-sha>\n# then push and open a PR",
      },
      {
        title: "Let CI gate it",
        where: "github",
        ci: true,
        body: "The revert runs the same checks and gets reviewed, just like any other change.",
        state: "CLEAN",
        stateColor: C.green,
      },
      {
        title: "Merge, then fix forward",
        where: "github",
        body: "Merging puts main back to the good state. Fix the real problem properly in a fresh PR afterward.",
        cmd: "gh pr merge <n> --squash --delete-branch",
      },
      {
        title: "Why revert, not delete",
        where: "github",
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
   MERGE STRATEGIES — three ways to land a branch. Pick one to see
   its trade-offs and the shape of history it leaves behind.
--------------------------------------------------------------- */
const STRATEGIES = [
  {
    id: "merge",
    label: "Merge commit",
    color: C.blue,
    blurb:
      "Keeps every commit from your branch and adds a merge commit that joins it back into main.",
    pros: [
      "Full, honest history — nothing is lost",
      "Shows exactly when each branch merged",
    ],
    cons: [
      "Noisy graph, lots of merge bubbles",
      "main is harder to read at a glance",
    ],
    caption: "a merge bubble joins the branch back in",
  },
  {
    id: "squash",
    label: "Squash",
    color: C.purple,
    repoDefault: true,
    blurb:
      "Collapses all of your branch's commits into a single tidy commit on main.",
    pros: [
      "Clean, linear history — one commit per PR",
      "Easy to scan, easy to revert a whole feature",
    ],
    cons: [
      "Loses the intermediate commits",
      "A big PR becomes one big commit",
    ],
    caption: "one commit per pull request",
  },
  {
    id: "rebase",
    label: "Rebase",
    color: C.green,
    blurb:
      "Replays each of your branch's commits directly onto the tip of main, with no merge commit.",
    pros: [
      "Linear history that keeps each commit",
      "No merge bubbles",
    ],
    cons: [
      "Rewrites commit IDs (hashes)",
      "Risky if someone else shares your branch",
    ],
    caption: "commits replayed in a straight line",
  },
];

/* ---------------------------------------------------------------
   CI / CD PIPELINES — the stages each robot runs, as a visual flow.
--------------------------------------------------------------- */
const CI_STAGES = [
  { label: "Push", icon: Upload, note: "you send commits up" },
  { label: "Fresh VM", icon: Server, note: "a clean machine spins up" },
  { label: "Install", icon: Download, note: "npm ci" },
  { label: "Build", icon: Hammer, note: "npm run build" },
  { label: "Test", icon: FlaskConical, note: "npm test · Node 20 & 22" },
  { label: "Green", icon: CheckCircle2, note: "checks pass → mergeable" },
];

const CD_STAGES = [
  { label: "Merge", icon: GitMerge, note: "code lands on main" },
  { label: "Package", icon: Package, note: "build a release artifact" },
  { label: "Deploy", icon: Rocket, note: "ship it automatically" },
  { label: "Production", icon: Globe, note: "live for users" },
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
  ["local vs remote", "your machine vs the GitHub copy; the boundary is push / pull"],
  ["push / pull", "send your commits up to GitHub / bring GitHub's commits down"],
  ["HEAD", "the commit you're currently sitting on"],
  ["protected branch", "main — no direct pushes; PR + green CI required"],
  ["fast-forward", "main just moves up to your commits (no divergence)"],
  ["atomic issue", "one unit of work: Requirement + Acceptance + Test"],
  ["squash", "collapse a branch's commits into one before merging"],
  ["CI", "Continuous Integration — auto build + test every change; red blocks the merge"],
  ["CD", "Continuous Delivery / Deployment — auto package + ship after CI (none in this repo)"],
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

function Pipeline({ stages, activeIndex, color, dimmed }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        flexWrap: "wrap",
        margin: "12px 0 6px",
      }}
    >
      {stages.map((st, i) => {
        const on = i === activeIndex;
        const Icon = st.icon;
        return (
          <React.Fragment key={st.label}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                flex: "1 1 0",
                minWidth: 72,
                opacity: dimmed ? 0.55 : 1,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 11,
                  display: "grid",
                  placeItems: "center",
                  background: on ? color : C.bgAlt,
                  border: `1.5px solid ${on ? color : color + "55"}`,
                  boxShadow: on ? `0 0 0 4px ${color}22, 0 0 16px ${color}66` : "none",
                  transform: on ? "translateY(-2px)" : "none",
                  transition: "all 260ms",
                }}
              >
                <Icon size={18} color={on ? C.bgAlt : color} />
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: on ? color : C.inkSoft,
                  textAlign: "center",
                }}
              >
                {st.label}
              </div>
              <div
                style={{
                  fontFamily: MONO,
                  fontSize: 9,
                  color: C.muted,
                  textAlign: "center",
                  lineHeight: 1.3,
                }}
              >
                {st.note}
              </div>
            </div>
            {i < stages.length - 1 && (
              <div style={{ flex: "0 0 auto", paddingTop: 13 }}>
                <ArrowRight
                  size={14}
                  color={!dimmed && activeIndex > i ? color : C.line}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function StrategyGraph({ id, color }) {
  return (
    <svg
      viewBox="0 0 240 54"
      width="100%"
      height="54"
      style={{ margin: "10px 0 2px", display: "block" }}
    >
      {id === "merge" && (
        <g>
          <line x1="12" y1="40" x2="228" y2="40" stroke={color} strokeWidth="2" />
          <path
            d="M72,40 C92,40 92,16 112,16 L150,16 C170,16 170,40 190,40"
            fill="none"
            stroke={color}
            strokeWidth="2"
            opacity="0.55"
          />
          <circle cx="32" cy="40" r="5" fill={color} />
          <circle cx="72" cy="40" r="5" fill={color} />
          <circle cx="112" cy="16" r="5" fill={color} />
          <circle cx="150" cy="16" r="5" fill={color} />
          <circle cx="190" cy="40" r="7" fill={color} />
          <circle cx="220" cy="40" r="5" fill={color} />
        </g>
      )}
      {id === "squash" && (
        <g>
          <line x1="12" y1="30" x2="228" y2="30" stroke={color} strokeWidth="2" />
          <circle cx="55" cy="30" r="6" fill={color} />
          <circle cx="120" cy="30" r="6" fill={color} />
          <circle cx="185" cy="30" r="6" fill={color} />
        </g>
      )}
      {id === "rebase" && (
        <g>
          <line x1="12" y1="30" x2="228" y2="30" stroke={color} strokeWidth="2" />
          <circle cx="35" cy="30" r="5" fill={color} />
          <circle cx="75" cy="30" r="5" fill={color} />
          <circle cx="115" cy="30" r="5" fill={color} />
          <circle cx="155" cy="30" r="5" fill={color} />
          <circle cx="195" cy="30" r="5" fill={color} />
        </g>
      )}
    </svg>
  );
}

function CiStrip({ activeIndex, fail }) {
  return (
    <div>
      <div
        style={{
          fontFamily: MONO,
          fontSize: 10,
          color: C.muted,
          marginBottom: 6,
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
        }}
      >
        <Cpu size={11} color={fail ? C.red : C.green} /> CI — build + test on a fresh
        GitHub machine
      </div>
      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", rowGap: 6 }}>
        {CI_STAGES.map((st, i) => {
          const isLast = i === CI_STAGES.length - 1;
          const on = i === activeIndex;
          const col = isLast ? (fail ? C.red : C.green) : C.green;
          const Icon = isLast && fail ? XCircle : st.icon;
          return (
            <React.Fragment key={st.label}>
              <div
                title={st.label}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 7,
                  display: "grid",
                  placeItems: "center",
                  background: on ? col : C.bg,
                  border: `1px solid ${on ? col : col + "55"}`,
                  transition: "all 200ms",
                  flex: "0 0 auto",
                }}
              >
                <Icon size={13} color={on ? C.bgAlt : col} />
              </div>
              {!isLast && (
                <div
                  style={{
                    width: 13,
                    height: 2,
                    background: activeIndex > i ? C.green : C.line,
                    flex: "0 0 auto",
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

export default function GitHubWorkflowExplainer() {
  const [scenarioId, setScenarioId] = useState(SCENARIOS[0].id);
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [recoil, setRecoil] = useState(false);

  const scenario = useMemo(
    () => SCENARIOS.find((s) => s.id === scenarioId) || SCENARIOS[0],
    [scenarioId],
  );
  const steps = scenario.steps;
  const N = steps.length;
  const activeStep = steps[active] || steps[0];

  // Reset to the first step whenever the scenario changes.
  useEffect(() => {
    setActive(0);
  }, [scenarioId]);

  // Auto-advance the dot through the steps, then loop.
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setActive((a) => (a + 1) % N), 1700);
    return () => clearInterval(t);
  }, [playing, N]);

  // Kick the dot back-left briefly when it lands on a setback step.
  useEffect(() => {
    if (activeStep && activeStep.back) {
      setRecoil(true);
      const t = setTimeout(() => setRecoil(false), 400);
      return () => clearTimeout(t);
    }
    setRecoil(false);
  }, [active, activeStep]);

  const pick = (i) => {
    setPlaying(false);
    setActive(((i % N) + N) % N);
  };

  // Rail geometry: evenly space steps across 8%..92%; place each on the
  // "local" (top) or "GitHub" (bottom) rail based on step.where.
  const TRACK_H = 132;
  const LOCAL_Y = 38;
  const GITHUB_Y = 96;
  const xPct = (i) => (N <= 1 ? 50 : 8 + (i / (N - 1)) * 84);
  const yFor = (st) => (st && st.where === "github" ? GITHUB_Y : LOCAL_Y);

  // Merge-strategy explorer: user picks which one to highlight.
  const [strategy, setStrategy] = useState("squash");
  const [showCICD, setShowCICD] = useState(false);
  const activeStrategy =
    STRATEGIES.find((s) => s.id === strategy) || STRATEGIES[0];

  // Cycle a highlight through the CI pipeline so it looks like it's running.
  const [ciStep, setCiStep] = useState(0);
  useEffect(() => {
    const t = setInterval(
      () => setCiStep((c) => (c + 1) % CI_STAGES.length),
      850,
    );
    return () => clearInterval(t);
  }, []);

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

        {/* animated two-rail flow */}
        <div style={{ position: "relative", height: TRACK_H, marginBottom: 6 }}>
          {/* lane labels */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: LOCAL_Y - 8,
              fontFamily: MONO,
              fontSize: 10.5,
              color: C.blue,
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <Monitor size={12} /> your machine
          </div>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: GITHUB_Y - 8,
              fontFamily: MONO,
              fontSize: 10.5,
              color: C.purple,
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <Cloud size={12} /> GitHub
          </div>

          {/* rail lines */}
          <div
            style={{
              position: "absolute",
              left: "7%",
              right: "3%",
              top: LOCAL_Y,
              height: 2,
              background: C.lineSoft,
              borderRadius: 2,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: "7%",
              right: "3%",
              top: GITHUB_Y,
              height: 2,
              background: C.lineSoft,
              borderRadius: 2,
            }}
          />

          {/* step nodes */}
          {steps.map((st, i) => {
            const on = i === active;
            const done = i < active;
            const nodeColor = st.back ? C.red : scenario.color;
            return (
              <button
                key={i}
                onClick={() => pick(i)}
                title={`${i + 1}. ${st.title}`}
                style={{
                  position: "absolute",
                  left: `${xPct(i)}%`,
                  top: yFor(st),
                  transform: "translate(-50%, -50%)",
                  width: on ? 30 : 22,
                  height: on ? 30 : 22,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  background: on ? nodeColor : done ? scenario.dim : C.panel,
                  border: `1.5px solid ${nodeColor}${on ? "" : "99"}`,
                  color: on ? C.bgAlt : nodeColor,
                  fontFamily: MONO,
                  fontSize: on ? 12 : 10,
                  fontWeight: 700,
                  cursor: "pointer",
                  padding: 0,
                  boxShadow: on ? `0 0 0 4px ${nodeColor}22` : "none",
                  transition: "all 200ms",
                  zIndex: 2,
                }}
              >
                {st.back ? "!" : i + 1}
              </button>
            );
          })}

          {/* moving dot */}
          <div
            style={{
              position: "absolute",
              left: `${xPct(active)}%`,
              top: yFor(activeStep),
              transform: `translate(-50%, -50%) translateX(${recoil ? -16 : 0}px)`,
              width: 14,
              height: 14,
              borderRadius: "50%",
              background: scenario.color,
              boxShadow: `0 0 14px ${scenario.color}, 0 0 0 5px ${scenario.color}33`,
              transition:
                "left 520ms cubic-bezier(.5,0,.3,1), top 420ms ease, transform 300ms ease",
              zIndex: 3,
              pointerEvents: "none",
            }}
          />
        </div>

        {/* controls */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 16,
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => setPlaying((p) => !p)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: playing ? C.panelAlt : scenario.color,
              color: playing ? C.ink : C.bgAlt,
              border: `1px solid ${playing ? C.line : scenario.color}`,
              borderRadius: 8,
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: FONT,
            }}
          >
            {playing ? <Pause size={13} /> : <Play size={13} />}
            {playing ? "Pause" : "Play"}
          </button>
          <button
            onClick={() => pick(active - 1)}
            title="Previous step"
            style={{
              display: "grid",
              placeItems: "center",
              width: 30,
              height: 30,
              background: C.panelAlt,
              color: C.inkSoft,
              border: `1px solid ${C.line}`,
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            <ChevronLeft size={15} />
          </button>
          <button
            onClick={() => pick(active + 1)}
            title="Next step"
            style={{
              display: "grid",
              placeItems: "center",
              width: 30,
              height: 30,
              background: C.panelAlt,
              color: C.inkSoft,
              border: `1px solid ${C.line}`,
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            <ChevronRight size={15} />
          </button>
          <span style={{ fontFamily: MONO, fontSize: 11, color: C.muted }}>
            step {active + 1} / {N}
          </span>
          <span style={{ marginLeft: "auto", fontSize: 11, color: C.muted }}>
            click a step to inspect it
          </span>
        </div>

        {/* detail panel for the active step */}
        <div
          style={{
            background: C.bgAlt,
            border: `1px solid ${(activeStep.back ? C.red : scenario.color)}44`,
            borderLeft: `3px solid ${activeStep.back ? C.red : scenario.color}`,
            borderRadius: 12,
            padding: "14px 16px",
            minHeight: 158,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              flexWrap: "wrap",
              marginBottom: 7,
            }}
          >
            <span style={{ fontFamily: MONO, fontSize: 11, color: scenario.color }}>
              {active + 1}/{N}
            </span>
            <span style={{ fontWeight: 700, fontSize: 14 }}>{activeStep.title}</span>
            <span
              style={{
                fontFamily: MONO,
                fontSize: 10,
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                color: activeStep.where === "github" ? C.purple : C.blue,
                background: C.bg,
                border: `1px solid ${(activeStep.where === "github" ? C.purple : C.blue) + "55"}`,
                borderRadius: 5,
                padding: "2px 7px",
              }}
            >
              {activeStep.where === "github" ? <Cloud size={10} /> : <Monitor size={10} />}
              {activeStep.where === "github" ? "GitHub" : "your machine"}
            </span>
            {activeStep.back && (
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 10,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  color: C.red,
                  background: C.redDim,
                  border: `1px solid ${C.red}55`,
                  borderRadius: 5,
                  padding: "2px 7px",
                }}
              >
                <CornerUpLeft size={10} /> setback
              </span>
            )}
            {activeStep.state && (
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 10.5,
                  color: activeStep.stateColor || C.muted,
                  background: C.bg,
                  border: `1px solid ${(activeStep.stateColor || C.muted) + "55"}`,
                  borderRadius: 5,
                  padding: "2px 7px",
                }}
              >
                {activeStep.state}
              </span>
            )}
          </div>
          <p
            style={{
              margin: 0,
              fontSize: 12.8,
              lineHeight: 1.55,
              color: C.inkSoft,
            }}
          >
            {activeStep.body}
          </p>
          {/* command / CI slot — small reserved height keeps steps close in size */}
          <div style={{ marginTop: 10, minHeight: 44 }}>
            {activeStep.cmd ? (
              <pre
                style={{
                  margin: 0,
                  padding: "9px 12px",
                  background: C.panel,
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
                {activeStep.cmd}
              </pre>
            ) : activeStep.ci ? (
              <CiStrip activeIndex={ciStep} fail={activeStep.ciFail} />
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "9px 12px",
                  border: `1px dashed ${C.line}`,
                  borderRadius: 8,
                  fontSize: 11.3,
                  color: C.muted,
                  fontStyle: "italic",
                }}
              >
                <Info size={12} /> No command — this step is a decision or a note.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ===== CI / CD, VISUALIZED ===== */}
      <section
        style={{
          background: C.panel,
          border: `1px solid ${C.line}`,
          borderRadius: 18,
          padding: "22px 24px",
          marginBottom: 22,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <Cpu size={18} color={C.green} />
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
              CI / CD, visualized
            </h2>
            <span style={{ color: C.muted, fontSize: 12.5 }}>
              optional reference — CI is already shown in the scenarios above
            </span>
          </div>
          <button
            onClick={() => setShowCICD((v) => !v)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: C.panelAlt,
              color: C.inkSoft,
              border: `1px solid ${C.line}`,
              borderRadius: 8,
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: FONT,
            }}
          >
            {showCICD ? "Hide" : "Show"}
            <ChevronDown
              size={14}
              style={{
                transform: showCICD ? "rotate(180deg)" : "none",
                transition: "transform 200ms",
              }}
            />
          </button>
        </div>

        {showCICD && (
        <div style={{ marginTop: 18 }}>
        {/* CI pipeline (animated) */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <Cpu size={15} color={C.green} />
            <span style={{ fontWeight: 700, fontSize: 13 }}>
              CI — Continuous Integration
            </span>
            <span style={{ fontSize: 11.5, color: C.muted }}>
              runs on GitHub, on every push
            </span>
          </div>
          <Pipeline stages={CI_STAGES} activeIndex={ciStep} color={C.green} />
          <p style={{ margin: "4px 0 0", fontSize: 11.5, color: C.muted, lineHeight: 1.5 }}>
            A fresh machine checks out your branch, builds it, and runs the tests.
            Green unlocks the merge; red blocks it.
          </p>
        </div>

        {/* CD pipeline (dimmed — not in this repo) */}
        <div style={{ paddingTop: 16, borderTop: `1px solid ${C.lineSoft}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <Rocket size={15} color={C.purple} />
            <span style={{ fontWeight: 700, fontSize: 13 }}>
              CD — Continuous Delivery / Deployment
            </span>
            <Chip color={C.amber} bg={C.amberDim}>
              not in this repo
            </Chip>
          </div>
          <Pipeline stages={CD_STAGES} activeIndex={-1} color={C.purple} dimmed />
          <p style={{ margin: "4px 0 0", fontSize: 11.5, color: C.muted, lineHeight: 1.5 }}>
            The stage after CI: package the merged code and ship it to production.
            This viewer has nothing to deploy, so the flow stops at "merged to main."
            The short definitions of CI &amp; CD live in the glossary below.
          </p>
        </div>
        </div>
        )}
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

        {/* MERGE STRATEGIES — pick one to compare */}
        <section
          style={{
            background: C.panel,
            border: `1px solid ${C.line}`,
            borderRadius: 18,
            padding: "22px 24px",
          }}
        >
          <SectionTitle icon={Scissors} color={C.purple} title="Merge strategies" sub="pick one to compare" />

          {/* pills */}
          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
            {STRATEGIES.map((s) => {
              const on = s.id === strategy;
              return (
                <button
                  key={s.id}
                  onClick={() => setStrategy(s.id)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    background: on ? s.color : C.bgAlt,
                    color: on ? C.bgAlt : C.inkSoft,
                    border: `1px solid ${on ? s.color : C.line}`,
                    borderRadius: 8,
                    padding: "6px 12px",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: FONT,
                  }}
                >
                  {s.label}
                  {s.repoDefault && <span style={{ fontSize: 10, opacity: 0.85 }}>★</span>}
                </button>
              );
            })}
          </div>

          {/* selected strategy */}
          <div
            style={{
              background: C.bgAlt,
              border: `1px solid ${activeStrategy.color}44`,
              borderLeft: `3px solid ${activeStrategy.color}`,
              borderRadius: 12,
              padding: "14px 15px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 5,
                flexWrap: "wrap",
              }}
            >
              <span style={{ fontWeight: 700, fontSize: 13.5 }}>
                {activeStrategy.label}
              </span>
              {activeStrategy.repoDefault && (
                <Chip color={activeStrategy.color} bg={C.bg}>
                  repo default
                </Chip>
              )}
            </div>
            <p style={{ margin: 0, fontSize: 12.2, color: C.inkSoft, lineHeight: 1.5 }}>
              {activeStrategy.blurb}
            </p>

            {/* mini history graph */}
            <StrategyGraph id={activeStrategy.id} color={activeStrategy.color} />
            <div
              style={{
                fontSize: 10.5,
                color: C.muted,
                textAlign: "center",
                fontFamily: MONO,
                marginBottom: 12,
              }}
            >
              {activeStrategy.caption}
            </div>

            {/* pros / cons */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                {activeStrategy.pros.map((p) => (
                  <div
                    key={p}
                    style={{
                      display: "flex",
                      gap: 6,
                      alignItems: "flex-start",
                      marginBottom: 5,
                    }}
                  >
                    <CheckCircle2
                      size={13}
                      color={C.green}
                      style={{ marginTop: 1, flex: "0 0 auto" }}
                    />
                    <span style={{ fontSize: 11.5, color: C.inkSoft, lineHeight: 1.4 }}>
                      {p}
                    </span>
                  </div>
                ))}
              </div>
              <div>
                {activeStrategy.cons.map((c) => (
                  <div
                    key={c}
                    style={{
                      display: "flex",
                      gap: 6,
                      alignItems: "flex-start",
                      marginBottom: 5,
                    }}
                  >
                    <XCircle
                      size={13}
                      color={C.red}
                      style={{ marginTop: 1, flex: "0 0 auto" }}
                    />
                    <span style={{ fontSize: 11.5, color: C.inkSoft, lineHeight: 1.4 }}>
                      {c}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: 12,
              fontSize: 11.5,
              color: C.muted,
              lineHeight: 1.5,
              fontStyle: "italic",
            }}
          >
            ★ This repo uses{" "}
            <b style={{ color: C.inkSoft }}>squash + delete branch</b> — one clean line
            per feature.
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
