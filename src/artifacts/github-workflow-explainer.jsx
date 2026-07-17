import React, { useState, useEffect, useMemo } from "react";
import {
  CircleDot,
  GitBranch,
  GitCommit,
  GitPullRequest,
  GitMerge,
  Upload,
  RefreshCw,
  CheckCircle2,
  Eye,
  Play,
  Pause,
  AlertTriangle,
  ShieldCheck,
  Terminal,
  Trash2,
  ArrowRight,
  Layers,
  Info,
  Scissors,
  GitGraph,
} from "lucide-react";

/* ---------------------------------------------------------------
   GITHUB FLOW — the loop I actually run
   The end-to-end lifecycle (issue -> branch -> PR -> CI ->
   squash-merge -> sync), the merge states, the three merge
   strategies, dependent vs. independent PRs, and a gh cheat
   sheet. Grounded in real PRs from the artifact-viewer repo.
--------------------------------------------------------------- */

export const meta = {
  title: "GitHub Flow",
  description:
    "The GitHub lifecycle I actually run: issue -> branch -> commit -> PR -> CI -> squash-merge -> sync, plus merge states, merge strategies, and dependent vs. independent PRs.",
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
   THE LIFECYCLE — one atomic unit of work, start to finish.
--------------------------------------------------------------- */
const STAGES = [
  {
    id: "issue",
    label: "Issue",
    icon: CircleDot,
    color: C.green,
    dim: C.greenDim,
    what: "Define one atomic unit of work.",
    detail:
      "Every task is its own issue with a Requirement, Acceptance criteria, and a Test case — small enough that one PR closes it. The backlog is the plan.",
    cmd: "gh issue create --title \"…\"",
    real: "#57 — this very artifact was an issue first.",
  },
  {
    id: "branch",
    label: "Branch",
    icon: GitBranch,
    color: C.purple,
    dim: C.purpleDim,
    what: "Copy main into a private workspace.",
    detail:
      "main is protected — you never edit it directly. You branch off a fresh, synced main so your diff starts from the latest code. Prefix by intent: feat/ fix/ docs/ chore/.",
    cmd: "git checkout main && git pull --rebase\ngit checkout -b feat/github-workflow-explainer",
    real: "This branch: feat/github-workflow-explainer.",
  },
  {
    id: "commit",
    label: "Commit",
    icon: GitCommit,
    color: C.blue,
    dim: C.blueDim,
    what: "Savepoint your changes with a message.",
    detail:
      "A commit is a labeled snapshot. Put “Closes #<n>” in the message so merging the PR auto-closes the issue. Keep the diff scoped to the one issue.",
    cmd: "git commit -m \"Add … \" -m \"Closes #57\"",
    real: "One focused commit for #57.",
  },
  {
    id: "push",
    label: "Push",
    icon: Upload,
    color: C.blue,
    dim: C.blueDim,
    what: "Publish the branch to GitHub (origin).",
    detail:
      "Your commits live locally until you push. Pushing uploads the branch to origin so a pull request — and CI — can see it. -u links local to remote.",
    cmd: "git push -u origin feat/github-workflow-explainer",
    real: "origin now has the branch.",
  },
  {
    id: "pr",
    label: "Pull request",
    icon: GitPullRequest,
    color: C.green,
    dim: C.greenDim,
    what: "Propose merging your branch into main.",
    detail:
      "A PR is the request + the review surface + the CI trigger, all in one. The body restates what and why and says “Closes #<n>”. Opening it kicks off the checks.",
    cmd: "gh pr create --title \"…\" --body \"Closes #57\"",
    real: "e.g. PR #59 for the metadata work.",
  },
  {
    id: "ci",
    label: "CI checks",
    icon: CheckCircle2,
    color: C.green,
    dim: C.greenDim,
    what: "Automated build + tests must pass.",
    detail:
      "GitHub Actions runs the pipeline (.github/workflows/ci.yml) on every push: install, build, test — here on Node 20 and Node 22. Both must be green to merge.",
    cmd: "gh pr checks 57",
    real: "build (Node 20) ✓  build (Node 22) ✓",
  },
  {
    id: "review",
    label: "Review",
    icon: Eye,
    color: C.amber,
    dim: C.amberDim,
    what: "A human reads the diff.",
    detail:
      "Because main is a protected branch, review is a required gate — not optional. Green CI proves it runs; review judges whether it should ship.",
    cmd: "gh pr view 57",
    real: "Approve, or request changes.",
  },
  {
    id: "merge",
    label: "Squash-merge",
    icon: GitMerge,
    color: C.purple,
    dim: C.purpleDim,
    what: "Collapse the branch into one clean commit, delete it.",
    detail:
      "Squash turns the branch's commits into a single tidy commit on main; deleting the branch keeps the repo clean. This is the repo's chosen strategy.",
    cmd: "gh pr merge 57 --squash --delete-branch",
    real: "One commit lands on main; branch gone.",
  },
  {
    id: "sync",
    label: "Sync main",
    icon: RefreshCw,
    color: C.blue,
    dim: C.blueDim,
    what: "Pull main so local matches, then branch the next work.",
    detail:
      "After a merge, your local main is behind by one commit. Pull it so the next branch starts from the freshly merged code. The loop begins again.",
    cmd: "git checkout main && git pull --rebase",
    real: "Ready for the next issue.",
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

function Node({ stage, active, done, onHover }) {
  const Icon = stage.icon;
  return (
    <div
      onMouseEnter={() => onHover(stage.id)}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 7,
        flex: "1 1 0",
        minWidth: 74,
        cursor: "default",
      }}
    >
      <div
        style={{
          width: 46,
          height: 46,
          borderRadius: 12,
          display: "grid",
          placeItems: "center",
          background: active ? stage.color : stage.dim,
          border: `1.5px solid ${active ? stage.color : stage.color + "55"}`,
          boxShadow: active ? `0 0 0 4px ${stage.color}22` : "none",
          transform: active ? "translateY(-3px)" : "none",
          transition: "all 240ms cubic-bezier(.2,.7,.3,1)",
        }}
      >
        <Icon size={21} color={active ? C.bgAlt : stage.color} strokeWidth={2.1} />
      </div>
      <div
        style={{
          fontSize: 11.5,
          fontWeight: 700,
          color: active ? stage.color : C.inkSoft,
          textAlign: "center",
          letterSpacing: 0.2,
        }}
      >
        {stage.label}
      </div>
      {done && !active && (
        <div style={{ marginTop: -2, fontSize: 10, color: C.green }}>✓</div>
      )}
    </div>
  );
}

function Arrow({ lit }) {
  return (
    <div
      style={{
        flex: "0 0 18px",
        display: "grid",
        placeItems: "center",
        marginTop: 22,
      }}
    >
      <ArrowRight size={15} color={lit ? C.blue : C.line} />
    </div>
  );
}

export default function GitHubWorkflowExplainer() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hovered, setHovered] = useState("issue");

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      setStep((s) => (s + 1) % STAGES.length);
    }, 1500);
    return () => clearInterval(t);
  }, [playing]);

  useEffect(() => {
    if (playing) setHovered(STAGES[step].id);
  }, [step, playing]);

  const active = useMemo(
    () => STAGES.find((s) => s.id === hovered) || STAGES[0],
    [hovered],
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
              The loop I actually run: one atomic issue from branch to merge —
              and the terms that show up along the way.
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

      {/* ===== THE LIFECYCLE ===== */}
      <section
        style={{
          background: C.panel,
          border: `1px solid ${C.line}`,
          borderRadius: 18,
          padding: "22px 24px 26px",
          marginBottom: 22,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <SectionTitle
            icon={Layers}
            color={C.blue}
            title="The lifecycle"
            sub="one unit of work, start to finish"
          />
          <button
            onClick={() => setPlaying((p) => !p)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              background: playing ? C.panelAlt : C.blue,
              color: playing ? C.ink : C.bgAlt,
              border: `1px solid ${playing ? C.line : C.blue}`,
              borderRadius: 9,
              padding: "7px 14px",
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: FONT,
            }}
          >
            {playing ? <Pause size={14} /> : <Play size={14} />}
            {playing ? "Pause" : "Play"} the loop
          </button>
        </div>

        {/* pipeline */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "wrap",
            rowGap: 14,
          }}
        >
          {STAGES.map((s, i) => (
            <React.Fragment key={s.id}>
              <Node
                stage={s}
                active={step === i}
                done={step > i}
                onHover={setHovered}
              />
              {i < STAGES.length - 1 && <Arrow lit={step === i || step === i + 1} />}
            </React.Fragment>
          ))}
        </div>

        {/* detail panel */}
        <div
          style={{
            marginTop: 22,
            background: C.bgAlt,
            border: `1px solid ${active.color}44`,
            borderLeft: `3px solid ${active.color}`,
            borderRadius: 12,
            padding: "16px 18px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <active.icon size={17} color={active.color} />
            <span style={{ fontWeight: 700, fontSize: 14 }}>{active.label}</span>
            <span style={{ color: active.color, fontSize: 12.5 }}>{active.what}</span>
          </div>
          <p style={{ margin: "0 0 12px", fontSize: 12.8, lineHeight: 1.55, color: C.inkSoft }}>
            {active.detail}
          </p>
          <pre
            style={{
              margin: "0 0 10px",
              padding: "10px 12px",
              background: C.panel,
              border: `1px solid ${C.line}`,
              borderRadius: 8,
              fontFamily: MONO,
              fontSize: 11.5,
              color: C.green,
              overflowX: "auto",
              whiteSpace: "pre-wrap",
            }}
          >
            {active.cmd}
          </pre>
          <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11.5, color: C.muted }}>
            <Info size={12} /> {active.real}
          </div>
        </div>
        <div style={{ marginTop: 10, fontSize: 11.5, color: C.muted, textAlign: "center" }}>
          Hover any step to inspect it · the loop repeats for every issue
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
