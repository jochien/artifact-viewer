import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Activity,
  Zap,
  Brain,
  Users,
  Building2,
  GitBranch,
  Lightbulb,
  Inbox,
  FileText,
  CheckSquare,
  Sparkles,
  Mic,
  ClipboardList,
  Presentation,
  Search,
  Library,
  Workflow,
  ArrowRight,
  Circle,
  Clock,
  Radio,
  ChevronRight,
  Blocks,
  Layers,
  Eye,
} from "lucide-react";

/* ---------------------------------------------------------------
   FRONTIER — Command Center
   A single-screen interface for the AI-augmented knowledge-work OS.
   Three loops — fast (the day), project (the engagement), slow
   (the knowledge) — sharing one temporal knowledge graph, run by
   the Small Council: a roster of specialized agents.
--------------------------------------------------------------- */

export const meta = {
  description:
    "A single-screen command center for the AI-augmented knowledge-work OS: three loops (day, project, knowledge) over one temporal graph, run by a roster of agents.",
  tags: ["dashboard", "agents", "concept"],
};

const C = {
  bg: "#0E141B",
  bgAlt: "#131C26",
  panel: "#18232F",
  panelAlt: "#1E2C3A",
  line: "#27374A",
  lineSoft: "#1F2E3E",
  ink: "#E8EEF4",
  inkSoft: "#A7B7C6",
  muted: "#6C8296",
  accent: "#4CC2C4", // teal — fast loop
  accentDim: "#1B3A3B",
  blue: "#5B9DF0", // blue — slow loop / KB
  blueDim: "#16263C",
  amber: "#E0A83C",
  amberDim: "#33280F",
  green: "#5FD08A",
  greenDim: "#13301F",
  violet: "#A98BE0",
  violetDim: "#241C36",
  rose: "#E5788C",
};

const FONT = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const MONO = "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

/* ---------------------------------------------------------------
   SAMPLE STATE — mirrors the real vault/engine shape.
--------------------------------------------------------------- */

const AGENTS = [
  {
    id: "chronicler",
    name: "The Scribe",
    plain: "Chronicler",
    icon: ClipboardList,
    color: C.accent,
    dim: C.accentDim,
    role: "Processes transcripts + memos → signals + KB knowledge",
    status: "running",
    lastRun: "12m ago",
    memory: 41,
    loop: "fast",
    task: "Distilling 20260714_tx_smart-factory-workshop",
  },
  {
    id: "briefer",
    name: "The Herald",
    plain: "Briefer",
    icon: FileText,
    color: C.blue,
    dim: C.blueDim,
    role: "Prep docs from the KB, enriched with WorkIQ",
    status: "idle",
    lastRun: "2h ago",
    memory: 28,
    loop: "fast",
    task: "Next: 1:1 prep — D.K. (Thu)",
  },
  {
    id: "builder",
    name: "The Master Smith",
    plain: "Builder",
    icon: Presentation,
    color: C.amber,
    dim: C.amberDim,
    role: "Builds + reverse-engineers PPTX decks",
    status: "idle",
    lastRun: "1d ago",
    memory: 19,
    loop: "shared",
    task: "Last: Smart factory follow-up",
  },
  {
    id: "scout",
    name: "The Master of Whisperers",
    plain: "Scout",
    icon: Search,
    color: C.green,
    dim: C.greenDim,
    role: "Finds logos, market data, competitive intel",
    status: "idle",
    lastRun: "3d ago",
    memory: 14,
    loop: "shared",
    task: "Last: Components capex proof points",
  },
  {
    id: "curator",
    name: "The Grand Maester",
    plain: "Curator",
    icon: Library,
    color: C.violet,
    dim: C.violetDim,
    role: "KB graph lint · backlinks · decision map",
    status: "attention",
    lastRun: "5d ago",
    memory: 22,
    loop: "slow",
    task: "6 orphan edges · 3 stubs flagged",
  },
  {
    id: "analyst",
    name: "The Three-Eyed Raven",
    plain: "Analyst",
    icon: Eye,
    color: C.rose,
    dim: C.violetDim,
    role: "Mines the graph into POVs, decision histories, synthesis",
    status: "idle",
    lastRun: "—",
    memory: 3,
    loop: "slow",
    task: "Stub · synthesis skills not yet built",
  },
  {
    id: "chief-of-staff",
    name: "The Hand of the King",
    plain: "Chief of Staff",
    icon: Workflow,
    color: C.inkSoft,
    dim: C.panelAlt,
    role: "Routes work + chains agents across the loops",
    status: "idle",
    lastRun: "12m ago",
    memory: 9,
    loop: "meta",
    task: "Stub · ran: transcript pipeline",
  },
  {
    id: "project-manager",
    name: "The Steward",
    plain: "Project Manager",
    icon: CheckSquare,
    color: C.green,
    dim: C.greenDim,
    role: "Runs engagements stage to stage — the Project loop",
    status: "running",
    lastRun: "20m ago",
    memory: 8,
    loop: "project",
    task: "Helix Research · PO open pending · M1 due Jul 30",
  },
  {
    id: "ops-manager",
    name: "The Master of Coin",
    plain: "Ops Manager",
    icon: Building2,
    color: C.amber,
    dim: C.amberDim,
    role: "Spend Request · PO · budget governance — the funding gate",
    status: "idle",
    lastRun: "2h ago",
    memory: 11,
    loop: "project",
    task: "Cleared Spend gate · Line 4417",
  },
];

const PIPELINE = {
  raw: [
    { name: "workshop-sync voice memo", kind: "audio", age: "10m" },
    { name: "components-analyst call.docx", kind: "docx", age: "1h" },
    { name: "field-enablement notes.txt", kind: "txt", age: "3h" },
  ],
  transcribed: [
    { name: "20260714_tx_smart-factory-workshop_rm-dk", kind: "md", age: "12m" },
    { name: "20260713_tx_electronics-narrative_rm-mt", kind: "md", age: "1d" },
  ],
  processed: [
    { name: "20260712_tx_components-gtm_rm-sp", kind: "md", age: "2d" },
    { name: "20260711_tx_digital-eng-review_rm-nb", kind: "md", age: "3d" },
    { name: "20260710_tx_iot-review_rm-ch", kind: "md", age: "4d" },
  ],
};

const KB = {
  people: 34,
  companies: 21,
  decisions: 17,
  topics: 12,
  goals: 5,
  signals: 486,
};

const PROJECTS = [
  {
    id: "smart-factory-papers",
    name: "Smart Factory Use-Case Papers",
    supplier: "Helix Research Ltd.",
    value: "$149K",
    term: "Jul 9 → Oct 31",
    steward: "The Steward",
    stages: [
      { label: "Brief", state: "done" },
      { label: "Supplier", state: "done" },
      { label: "SOW", state: "done" },
      { label: "Spend", state: "done", note: "4417" },
      { label: "PO", state: "current" },
      { label: "Kickoff", state: "pending" },
      { label: "Milestones", state: "pending" },
      { label: "Reviews", state: "pending" },
      { label: "Close", state: "pending" },
    ],
    milestones: [
      { id: "M1", label: "Storyline & approach finalized", due: "Jul 30", amt: "$30K", state: "current" },
      { id: "M2", label: "Whitepaper · use case #1", due: "Oct 16", amt: "$29.75K", state: "pending" },
      { id: "M3", label: "Whitepaper · use case #2", due: "Oct 31", amt: "$29.75K", state: "pending" },
      { id: "M4", label: "Whitepaper · use case #3", due: "Oct 31", amt: "$29.75K", state: "pending" },
      { id: "M5", label: "Whitepaper · use case #4", due: "Oct 31", amt: "$29.75K", state: "pending" },
    ],
    gate: "Spend gate cleared by The Master of Coin · Line 4417",
  },
];

const KB_GROWTH = [12, 18, 24, 29, 38, 44, 51, 63, 70, 78, 84, 89];

const ACTIONS = [
  {
    title: "Draft the 'loop designer' post",
    owner: "me",
    due: "This week",
    priority: "high",
    source: "journal · from-prompts-to-loop-design",
  },
  {
    title: "Smart factory follow-up deck → review",
    owner: "The Master Smith",
    due: "Tomorrow",
    priority: "high",
    source: "20260714 workshop sync",
  },
  {
    title: "Send components GTM one-pager to D.K.",
    owner: "me",
    due: "Thu",
    priority: "med",
    source: "20260712 components GTM call",
  },
  {
    title: "Resolve 3 stub people profiles (last names)",
    owner: "The Grand Maester",
    due: "Backlog",
    priority: "low",
    source: "KB health check",
  },
];

const FEED = [
  { icon: Sparkles, color: C.accent, text: "The Scribe distilled 9 signals from workshop sync", time: "12m" },
  { icon: Brain, color: C.blue, text: "KB: M.T. profile enriched (+3 signals)", time: "12m" },
  { icon: Presentation, color: C.amber, text: "The Master Smith shipped follow-up deck v2", time: "1h" },
  { icon: CheckSquare, color: C.green, text: "The Steward cleared the Spend gate · Line 4417", time: "2h" },
  { icon: Library, color: C.violet, text: "The Grand Maester flagged 6 orphan edges for review", time: "5d" },
];

const WHATS_NEXT = [
  "Draft the 'loop designer' post (journal · draft-post skill)",
  "Smart factory follow-up — get deck to review",
  "Consolidate the segment marketing plan draft",
];

/* Single source of truth for build status on the target-architecture map.
   Flip a node here (built | partial | missing) and its color updates everywhere. */
const STATUS = { built: C.green, partial: C.amber, missing: C.rose };
const TARGET = {
  intake: "partial",
  normalize: "missing",
  triage: "partial",
  distill: "built",
  action: "partial",
  prework: "missing",
  approve: "missing",
  execute: "partial",
  done: "missing",
  outcome: "missing",
  kb: "partial",
  synthesis: "partial",
  memory: "built",
  orchestrator: "partial",
};
const SC = (id) => STATUS[TARGET[id]];

/* ---------------------------------------------------------------
   KNOWLEDGE GRAPH DATA — seeded from the real vault KB
   (decisions/_map.md typed edges + people/topic relationships).
   The artifact can't read the vault at runtime, so the graph is
   baked here from those files.
--------------------------------------------------------------- */
const G_NODES = [
  // you
  { id: "you", type: "you", label: "R.M.", summary: "Director, Product & Industry Marketing. Owns Smart Factory (halo), Electronics & Components, Digital Engineering.", signals: [
    { date: "2026-05-28", tag: "reinforced", text: 'D.K.: "This is your business" — own smart factory as a business, not a project.' },
    { date: "2026-06-30", tag: "new", text: "Electronics/components deferral is over; paper due ~end of July." },
  ] },
  // people
  { id: "pA", type: "person", label: "D.K.", summary: "Lead, WW Manufacturing Marketing. Direct, pragmatic. \"We are the story guys.\" RM's manager.", signals: [
    { date: "2026-06-25", tag: "tension", text: '"We own the narrative" — pushing back on M.T. after a peer read M.T.\'s email as owning the smart-factory narrative.' },
    { date: "2026-06-29", tag: "new", text: '"Because we have attribution on that channel" — attribution decides where integrated-marketing spend goes.' },
    { date: "2026-06-30", tag: "reinforced", text: "Priority sequence: finish Smart Factory North Star for the workshop → OKR dashboard → electronics/components paper." },
  ] },
  { id: "pB", type: "person", label: "S.P.", summary: 'WW Industry Marketing lead. "Precision matters." Reputation reset underway.' },
  { id: "pC", type: "person", label: "N.B.", summary: "WW Industrial Marketing lead. D.K. reports to her." },
  { id: "pD", type: "person", label: "M.T.", summary: "CVP, Manufacturing & Mobility. Cross-industry Smart Factory DRI.", signals: [
    { date: "2026-05-20", tag: "new", text: 'Smart-factory timeline accelerated: "right now, this has been accelerated."' },
    { date: "2026-06-25", tag: "tension", text: "Narrative-ownership friction with marketing over smart factory." },
    { date: "2026-07-10", tag: "new", text: "Expo Latam Day closing keynote officially accepted (in Spanish)." },
  ] },
  { id: "pE", type: "person", label: "P.L.", summary: "Runs the smart-factory working meeting under M.T.'s monthly steering cadence." },
  { id: "pF", type: "person", label: "C.H.", summary: "Smart-factory lab / FDE. Sits in the advanced group." },
  { id: "pG", type: "person", label: "V.S.", summary: "Technical strategy architect for smart factory (retiring)." },
  { id: "pH", type: "person", label: "G.W.", summary: "Drives the IoT platform initiative." },
  { id: "pI", type: "person", label: "E.B.", summary: "D.K.'s team; new-industrialist content." },
  // companies
  { id: "coA", type: "company", label: "Apex Controls", summary: "Smart-factory category leader — sets the framing to answer." },
  { id: "coB", type: "company", label: "Northwind Components", summary: "Components bellwether; anchor for the electronics narrative." },
  { id: "coC", type: "company", label: "Meridian Assembly", summary: "Factory-AI deployer — 80% faster root cause, 15% labor productivity." },
  { id: "coD", type: "company", label: "Global Smart Manufacturing Council", summary: "Trade association — owns the AutoFab Expo." },
  { id: "coE", type: "company", label: "Vertex PLM", summary: "Digital-engineering / PLM partner." },
  // topics
  { id: "topA", type: "topic", label: "Smart Factory & IoT", summary: "FY27 halo narrative. Master summary + deep KB subfolder.", signals: [
    { date: "2026-05", tag: "new", text: 'Industry analyst: "The smart-factory inflection is just around the corner."' },
    { date: "2026-05", tag: "new", text: "300+ connected plants across 25 countries (Apex Controls)." },
  ] },
  { id: "topB", type: "topic", label: "Electronics & Components", summary: "Industry marketing lead area — inbound + outbound storytelling." },
  { id: "topC", type: "topic", label: "Digital Engineering", summary: "Functional marketing lead area." },
  { id: "topD", type: "topic", label: "AutoFab Expo 2026", summary: "Smart-manufacturing trade show — thought-leadership execution." },
  // decisions
  { id: "decA", type: "decision", label: "Smart Factory North Star", summary: "Unified smart-factory North Star paper; workshop week of July 13.", signals: [
    { date: "2026-07-13", tag: "new", text: "Workshop scheduled; route to P.L. + engineering + N.B." },
  ] },
  { id: "decB", type: "decision", label: "Annual Marketing Plan", summary: "FY27 manufacturing marketing plan." },
  { id: "decC", type: "decision", label: "Segment Marketing Strategy", summary: "FY27 top-level segment marketing strategy." },
  { id: "decD", type: "decision", label: "Use-Case Governance", summary: '"Everything we do has to align to one of these use cases."' },
  { id: "decE", type: "decision", label: "AutoFab Expo Plan", summary: "From booth pivot to thought-leadership execution." },
  { id: "decF", type: "decision", label: "Build vs Partner IoT Stack", summary: "IoT-platform build-vs-partner decision." },
  { id: "decG", type: "decision", label: "Sales Coverage Split", summary: "Sales reorg — advanced + core coverage." },
  { id: "decH", type: "decision", label: "Electronics Segment Paper", summary: "Standalone electronics & components paper." },
  // goals
  { id: "g1", type: "goal", label: "OKR1 · Smart-factory platform", summary: "~$1B marketing-influenced pipeline via standardized industry use cases." },
  { id: "g2", type: "goal", label: "OKR2 · IoT ecosystem", summary: "Credible, visible ecosystem for smart factory in manufacturing." },
  { id: "g3", type: "goal", label: "OKR3 · Connected Ops", summary: "Establish the Connected Ops narrative + activation plan (scoping)." },
];

const G_EDGES = [
  // reporting / people
  { source: "you", target: "pA", rel: "reports to" },
  { source: "pA", target: "pC", rel: "reports to" },
  { source: "pC", target: "pB", rel: "reports to" },
  { source: "pI", target: "pA", rel: "on team" },
  { source: "pD", target: "pG", rel: "works with" },
  { source: "pD", target: "pA", rel: "works with" },
  { source: "pG", target: "pH", rel: "works with" },
  { source: "pE", target: "pD", rel: "works with" },
  // people → decisions / topics
  { source: "pA", target: "decB", rel: "drives" },
  { source: "pA", target: "decA", rel: "drives" },
  { source: "pA", target: "decD", rel: "drives" },
  { source: "pA", target: "decE", rel: "drives" },
  { source: "pA", target: "g1", rel: "owns" },
  { source: "pA", target: "g2", rel: "owns" },
  { source: "pA", target: "g3", rel: "owns" },
  { source: "you", target: "topA", rel: "owns" },
  { source: "you", target: "topB", rel: "owns" },
  { source: "you", target: "topC", rel: "owns" },
  { source: "you", target: "decA", rel: "drives" },
  { source: "you", target: "decH", rel: "drives" },
  { source: "pB", target: "decD", rel: "governs" },
  { source: "pB", target: "decC", rel: "governs" },
  { source: "pD", target: "topA", rel: "leads (DRI)" },
  { source: "pD", target: "decG", rel: "drives" },
  { source: "pE", target: "decA", rel: "advances" },
  { source: "pH", target: "decF", rel: "drives" },
  { source: "pH", target: "topA", rel: "advances" },
  { source: "pF", target: "topA", rel: "supports" },
  { source: "pG", target: "topA", rel: "supports" },
  // decision → decision (from _map.md)
  { source: "decF", target: "decA", rel: "advances" },
  { source: "decB", target: "decA", rel: "advances" },
  { source: "decB", target: "decD", rel: "governed by" },
  { source: "decB", target: "decC", rel: "rolls up to" },
  { source: "decH", target: "decD", rel: "governed by" },
  { source: "decH", target: "decB", rel: "rolls up to" },
  { source: "decE", target: "decB", rel: "rolls up to" },
  { source: "decG", target: "decA", rel: "advances" },
  // decision → topic
  { source: "decA", target: "topA", rel: "about" },
  { source: "decH", target: "topB", rel: "about" },
  { source: "decE", target: "topD", rel: "about" },
  // decision → goal
  { source: "decA", target: "g2", rel: "ladders to" },
  { source: "decB", target: "g1", rel: "ladders to" },
  { source: "decD", target: "g1", rel: "ladders to" },
  // topic → company
  { source: "topA", target: "coA", rel: "relates to" },
  { source: "topA", target: "coC", rel: "relates to" },
  { source: "topA", target: "coB", rel: "relates to" },
  { source: "topB", target: "coB", rel: "relates to" },
  { source: "topB", target: "coA", rel: "relates to" },
  { source: "topD", target: "coD", rel: "relates to" },
  { source: "topC", target: "coE", rel: "relates to" },
];

const NODE_TYPES = [
  { id: "you", label: "You", color: C.accent },
  { id: "person", label: "People", color: C.blue },
  { id: "company", label: "Companies", color: C.green },
  { id: "topic", label: "Topics", color: C.violet },
  { id: "decision", label: "Decisions", color: C.amber },
  { id: "goal", label: "Goals", color: C.rose },
];
const TYPE_COLOR = Object.fromEntries(NODE_TYPES.map((t) => [t.id, t.color]));
const TYPE_RADIUS = { you: 16, topic: 13, decision: 11, goal: 11, company: 10, person: 9 };
const TAG_COLOR = { new: C.accent, reinforced: C.blue, tension: C.rose };

/* Deterministic force-directed layout (spring + repulsion + gravity),
   run to convergence once per node/edge set. Center node is pinned. */
function computeLayout(nodes, edges, W, H) {
  const n = nodes.length;
  if (!n) return {};
  let seed = 7;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  const idx = Object.fromEntries(nodes.map((nd, i) => [nd.id, i]));
  const P = nodes.map((nd, i) => {
    const a = (i / n) * Math.PI * 2;
    return { x: W / 2 + Math.cos(a) * W * 0.3 + (rnd() - 0.5) * 24, y: H / 2 + Math.sin(a) * H * 0.3 + (rnd() - 0.5) * 24 };
  });
  const adj = edges.map((e) => [idx[e.source], idx[e.target]]).filter(([a, b]) => a != null && b != null);
  const vel = P.map(() => ({ x: 0, y: 0 }));
  const CENTER = idx["you"];
  const kRep = 5200, kSpring = 0.05, springLen = 92, damp = 0.86, grav = 0.02;
  for (let it = 0; it < 340; it++) {
    const F = P.map(() => ({ x: 0, y: 0 }));
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        let dx = P[i].x - P[j].x, dy = P[i].y - P[j].y;
        const d2 = dx * dx + dy * dy + 0.01;
        const d = Math.sqrt(d2);
        const f = kRep / d2;
        const ux = dx / d, uy = dy / d;
        F[i].x += ux * f; F[i].y += uy * f;
        F[j].x -= ux * f; F[j].y -= uy * f;
      }
    }
    adj.forEach(([a, b]) => {
      let dx = P[b].x - P[a].x, dy = P[b].y - P[a].y;
      const d = Math.sqrt(dx * dx + dy * dy) + 0.01;
      const f = kSpring * (d - springLen);
      const ux = dx / d, uy = dy / d;
      F[a].x += ux * f; F[a].y += uy * f;
      F[b].x -= ux * f; F[b].y -= uy * f;
    });
    for (let i = 0; i < n; i++) {
      F[i].x += (W / 2 - P[i].x) * grav;
      F[i].y += (H / 2 - P[i].y) * grav;
      vel[i].x = (vel[i].x + F[i].x) * damp;
      vel[i].y = (vel[i].y + F[i].y) * damp;
      if (i === CENTER) continue;
      P[i].x = Math.max(30, Math.min(W - 30, P[i].x + vel[i].x));
      P[i].y = Math.max(28, Math.min(H - 28, P[i].y + vel[i].y));
    }
    if (CENTER != null) { P[CENTER].x = W / 2; P[CENTER].y = H / 2; }
  }
  const out = {};
  nodes.forEach((nd, i) => (out[nd.id] = { x: P[i].x, y: P[i].y }));
  return out;
}

/* ---------------------------------------------------------------
   Small presentational helpers.
--------------------------------------------------------------- */

const statusDot = (status) => {
  if (status === "running") return C.accent;
  if (status === "attention") return C.amber;
  return C.muted;
};

const LOOP_COLOR = { fast: C.accent, project: C.green, slow: C.blue, shared: C.violet, meta: C.inkSoft };

function Panel({ title, icon: Icon, accent, children, right }) {
  return (
    <div
      style={{
        background: C.panel,
        border: `1px solid ${C.line}`,
        borderRadius: 12,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          {Icon && (
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: 7,
                background: (accent || C.blue) + "22",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon size={15} color={accent || C.blue} />
            </div>
          )}
          <span
            style={{
              fontSize: 12.5,
              fontWeight: 600,
              letterSpacing: 0.3,
              color: C.ink,
              textTransform: "uppercase",
            }}
          >
            {title}
          </span>
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

function Sparkline({ data, color }) {
  const w = 120;
  const h = 34;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / span) * (h - 4) - 2;
    return [x, y];
  });
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${path} L${w},${h} L0,${h} Z`;
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <defs>
        <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spark)" />
      <path d={path} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.6" fill={color} />
    </svg>
  );
}

/* Mini temporal knowledge graph — inline SVG, no libs. */
function GraphViz() {
  const nodes = [
    { id: "you", label: "You", x: 130, y: 92, r: 15, color: C.ink, ring: C.accent },
    { id: "people", label: "People", x: 46, y: 40, r: 12, color: C.blue },
    { id: "co", label: "Companies", x: 214, y: 44, r: 12, color: C.green },
    { id: "dec", label: "Decisions", x: 40, y: 150, r: 12, color: C.amber },
    { id: "top", label: "Topics", x: 220, y: 148, r: 12, color: C.violet },
    { id: "goal", label: "Goals", x: 130, y: 170, r: 10, color: C.rose },
  ];
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const edges = [
    ["people", "co"],
    ["people", "dec"],
    ["people", "top"],
    ["co", "top"],
    ["dec", "top"],
    ["dec", "co"],
    ["goal", "dec"],
    ["goal", "top"],
    ["you", "people"],
    ["you", "dec"],
  ];
  return (
    <svg width="100%" viewBox="0 0 260 200" style={{ display: "block" }}>
      {edges.map(([a, b], i) => (
        <line
          key={i}
          x1={byId[a].x}
          y1={byId[a].y}
          x2={byId[b].x}
          y2={byId[b].y}
          stroke={C.line}
          strokeWidth="1"
        />
      ))}
      {nodes.map((n) => (
        <g key={n.id}>
          <circle
            cx={n.x}
            cy={n.y}
            r={n.r}
            fill={(n.color || C.blue) + "26"}
            stroke={n.ring || n.color}
            strokeWidth={n.ring ? 2 : 1.4}
          />
          <text
            x={n.x}
            y={n.y + n.r + 11}
            textAnchor="middle"
            fontSize="8.5"
            fontFamily={MONO}
            fill={C.inkSoft}
          >
            {n.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

/* ---------------------------------------------------------------
   MAIN
--------------------------------------------------------------- */

export default function FrontierCommandCenter() {
  const [tab, setTab] = useState("overview");
  const [selectedAgent, setSelectedAgent] = useState("chronicler");
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const pending = PIPELINE.raw.length + PIPELINE.transcribed.length;
  const liveCount = AGENTS.filter((a) => a.status === "running").length;
  const openActions = ACTIONS.filter((a) => a.priority !== "done").length;
  const agent = useMemo(() => AGENTS.find((a) => a.id === selectedAgent), [selectedAgent]);

  const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });

  const TABS = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "blueprint", label: "Blueprint", icon: Blocks },
    { id: "pipeline", label: "Pipeline", icon: Inbox },
    { id: "projects", label: "Projects", icon: CheckSquare },
    { id: "agents", label: "Agents", icon: Users },
    { id: "graph", label: "Knowledge Graph", icon: GitBranch },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `radial-gradient(1200px 600px at 80% -10%, ${C.bgAlt}, ${C.bg})`,
        fontFamily: FONT,
        color: C.ink,
        padding: "22px 22px 40px",
      }}
    >
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        {/* ---------- Header ---------- */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 14,
            marginBottom: 18,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 11,
                background: `linear-gradient(135deg, ${C.accent}, ${C.blue})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 6px 20px ${C.accent}44`,
              }}
            >
              <Radio size={22} color="#0B1218" />
            </div>
            <div>
              <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: -0.2 }}>
                Frontier <span style={{ color: C.muted, fontWeight: 500 }}>· Command Center</span>
              </div>
              <div style={{ fontSize: 12, color: C.muted, fontFamily: MONO }}>
                frontier-core-work · R.M. · Manufacturing × AI
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 18, fontWeight: 600, fontFamily: MONO }}>{timeStr}</div>
              <div style={{ fontSize: 11, color: C.muted }}>{dateStr}</div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "7px 12px",
                background: C.accentDim,
                border: `1px solid ${C.accent}55`,
                borderRadius: 20,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: C.accent,
                  boxShadow: `0 0 8px ${C.accent}`,
                }}
              />
              <span style={{ fontSize: 11.5, fontWeight: 600, color: C.accent }}>{liveCount} agent{liveCount === 1 ? "" : "s"} live</span>
            </div>
          </div>
        </header>

        {/* ---------- Stat strip ---------- */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 12,
            marginBottom: 18,
          }}
        >
          <StatCard icon={Zap} color={C.accent} label="Fast loop" value={openActions} sub="open action items" />
          <StatCard icon={CheckSquare} color={C.green} label="Project loop" value={PROJECTS.length} sub="engagements in flight" />
          <StatCard icon={Brain} color={C.blue} label="Slow loop" value={KB.signals} sub="signals in the graph" />
          <StatCard icon={Inbox} color={C.amber} label="Pipeline" value={pending} sub="awaiting debrief" />
          <StatCard icon={Users} color={C.violet} label="Agents" value={`${AGENTS.filter((a) => a.status !== "idle").length}/${AGENTS.length}`} sub="active now" />
        </div>

        {/* ---------- Tabs ---------- */}
        <div
          style={{
            display: "flex",
            gap: 4,
            padding: 4,
            background: C.panel,
            border: `1px solid ${C.line}`,
            borderRadius: 11,
            marginBottom: 18,
            width: "fit-content",
            flexWrap: "wrap",
          }}
        >
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "8px 15px",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontFamily: FONT,
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: active ? C.ink : C.muted,
                  background: active ? C.panelAlt : "transparent",
                  boxShadow: active ? `inset 0 0 0 1px ${C.line}` : "none",
                  transition: "all .15s",
                }}
              >
                <t.icon size={14} color={active ? C.accent : C.muted} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* ---------- Views ---------- */}
        {tab === "overview" && (
          <OverviewView openActions={openActions} />
        )}
        {tab === "blueprint" && <BlueprintView />}
        {tab === "pipeline" && <PipelineView />}
        {tab === "projects" && <ProjectsView />}
        {tab === "agents" && (
          <AgentsView selected={selectedAgent} setSelected={setSelectedAgent} agent={agent} />
        )}
        {tab === "graph" && <GraphView />}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   Projects (the medium / project loop)
--------------------------------------------------------------- */
function ProjectsView() {
  return (
    <div style={{ display: "grid", gap: 14 }}>
      {PROJECTS.map((p) => (
        <Panel
          key={p.id}
          title={p.name}
          icon={CheckSquare}
          accent={C.green}
          right={<span style={{ fontSize: 11.5, color: C.muted, fontFamily: MONO }}>{p.value} · {p.term}</span>}
        >
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 15, fontSize: 12, color: C.inkSoft }}>
            <span>
              <Building2 size={13} color={C.muted} style={{ verticalAlign: "-2px", marginRight: 5 }} />
              {p.supplier}
            </span>
            <span style={{ color: C.muted }}>·</span>
            <span>Steward: <b style={{ color: C.green }}>{p.steward}</b></span>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", marginBottom: 16 }}>
            {p.stages.map((s, i) => (
              <React.Fragment key={s.label}>
                <StageChip s={s} />
                {i < p.stages.length - 1 && <ChevronRight size={13} color={C.lineSoft} />}
              </React.Fragment>
            ))}
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            {p.milestones.map((m) => (
              <MilestoneRow key={m.id} m={m} />
            ))}
          </div>

          <div style={{ marginTop: 14, padding: "9px 12px", background: C.amberDim, border: `1px solid ${C.amber}44`, borderRadius: 8, fontSize: 11.5, color: C.amber, display: "flex", alignItems: "center", gap: 7 }}>
            <CheckSquare size={14} color={C.amber} />
            {p.gate}
          </div>
        </Panel>
      ))}
    </div>
  );
}

function StageChip({ s }) {
  const map = {
    done: { bg: C.greenDim, br: `${C.green}55`, fg: C.green },
    current: { bg: C.accentDim, br: `${C.accent}88`, fg: C.accent },
    pending: { bg: C.panelAlt, br: C.line, fg: C.muted },
  };
  const st = map[s.state];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 7, background: st.bg, border: `1px solid ${st.br}`, fontSize: 11.5, fontWeight: 600, color: st.fg }}>
      {s.state === "done" && <CheckSquare size={12} color={st.fg} />}
      {s.state === "current" && <Circle size={9} color={st.fg} />}
      {s.label}{s.note ? ` · ${s.note}` : ""}
    </span>
  );
}

function MilestoneRow({ m }) {
  const isCurrent = m.state === "current";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 11px", background: isCurrent ? C.accentDim : C.panelAlt, border: `1px solid ${isCurrent ? `${C.accent}55` : C.lineSoft}`, borderRadius: 8 }}>
      <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: isCurrent ? C.accent : C.muted, width: 26 }}>{m.id}</span>
      <span style={{ flex: 1, fontSize: 12.5, color: C.ink }}>{m.label}</span>
      <span style={{ fontSize: 11.5, color: C.muted, fontFamily: MONO }}>{m.due}</span>
      <span style={{ fontSize: 11.5, color: C.inkSoft, fontFamily: MONO, width: 62, textAlign: "right" }}>{m.amt}</span>
    </div>
  );
}

/* ---------------------------------------------------------------
   Stat card
--------------------------------------------------------------- */
function StatCard({ icon: Icon, color, label, value, sub }) {
  return (
    <div
      style={{
        background: C.panel,
        border: `1px solid ${C.line}`,
        borderRadius: 12,
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        gap: 13,
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: color + "1E",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={19} color={color} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1, fontFamily: MONO }}>{value}</div>
        <div style={{ fontSize: 10.5, color: C.muted, marginTop: 3 }}>
          <span style={{ color: color, fontWeight: 600 }}>{label}</span> · {sub}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   OVERVIEW
--------------------------------------------------------------- */
function OverviewView() {
  const [loops, setLoops] = useState({ fast: true, project: true, slow: true });
  const anyOn = loops.fast || loops.project || loops.slow;
  const show = anyOn ? loops : { fast: true, project: true, slow: true };
  const allOn = loops.fast && loops.project && loops.slow;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14 }}>
      {/* Left column */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
        <Panel
          title="The three loops"
          icon={Activity}
          accent={C.accent}
          right={
            <LoopFilter
              loops={loops}
              allOn={allOn}
              onAll={() => setLoops({ fast: true, project: true, slow: true })}
              onToggle={(k) => setLoops((p) => ({ ...p, [k]: !p[k] }))}
            />
          }
        >
          <ThreeLoopDiagram show={show} />
        </Panel>

        <Panel title="What's next" icon={ClipboardList} accent={C.amber}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {WHATS_NEXT.map((w, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  background: C.bgAlt,
                  border: `1px solid ${C.lineSoft}`,
                  borderRadius: 9,
                }}
              >
                <Circle size={8} color={C.amber} fill={C.amber} />
                <span style={{ fontSize: 13, color: C.inkSoft, flex: 1 }}>{w}</span>
                <ChevronRight size={15} color={C.muted} />
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Open action items" icon={CheckSquare} accent={C.green}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {ACTIONS.map((a, i) => (
              <ActionRow key={i} a={a} />
            ))}
          </div>
        </Panel>
      </div>

      {/* Right column */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
        <Panel
          title="KB growth"
          icon={Brain}
          accent={C.blue}
          right={<Sparkline data={KB_GROWTH} color={C.blue} />}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 8,
            }}
          >
            <KbTile icon={Users} color={C.blue} label="People" value={KB.people} />
            <KbTile icon={Building2} color={C.green} label="Companies" value={KB.companies} />
            <KbTile icon={GitBranch} color={C.amber} label="Decisions" value={KB.decisions} />
            <KbTile icon={Lightbulb} color={C.violet} label="Topics" value={KB.topics} />
            <KbTile icon={Activity} color={C.rose} label="Goals" value={KB.goals} />
            <KbTile icon={Sparkles} color={C.accent} label="Signals" value={KB.signals} />
          </div>
        </Panel>

        <Panel title="Activity feed" icon={Radio} accent={C.accent}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {FEED.map((f, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "9px 0",
                  borderBottom: i < FEED.length - 1 ? `1px solid ${C.lineSoft}` : "none",
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 7,
                    background: f.color + "1E",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                >
                  <f.icon size={13} color={f.color} />
                </div>
                <span style={{ fontSize: 12.5, color: C.inkSoft, flex: 1, lineHeight: 1.4 }}>{f.text}</span>
                <span style={{ fontSize: 11, color: C.muted, fontFamily: MONO, whiteSpace: "nowrap" }}>{f.time}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function KbTile({ icon: Icon, color, label, value }) {
  return (
    <div
      style={{
        background: C.bgAlt,
        border: `1px solid ${C.lineSoft}`,
        borderRadius: 9,
        padding: "11px 10px",
      }}
    >
      <Icon size={15} color={color} />
      <div style={{ fontSize: 19, fontWeight: 700, fontFamily: MONO, marginTop: 6 }}>{value}</div>
      <div style={{ fontSize: 10.5, color: C.muted }}>{label}</div>
    </div>
  );
}

function ActionRow({ a }) {
  const pc = a.priority === "high" ? C.rose : a.priority === "med" ? C.amber : C.muted;
  const isMe = a.owner === "me";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 11,
        padding: "10px 12px",
        background: C.bgAlt,
        border: `1px solid ${C.lineSoft}`,
        borderRadius: 9,
      }}
    >
      <span style={{ width: 6, height: 26, borderRadius: 3, background: pc, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: C.ink, fontWeight: 500 }}>{a.title}</div>
        <div style={{ fontSize: 10.5, color: C.muted, marginTop: 2, fontFamily: MONO }}>{a.source}</div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 600,
            color: isMe ? C.accent : C.inkSoft,
            padding: "2px 8px",
            borderRadius: 5,
            background: isMe ? C.accentDim : C.panelAlt,
          }}
        >
          {isMe ? "You" : a.owner}
        </span>
        <div style={{ fontSize: 10.5, color: C.muted, marginTop: 4 }}>{a.due}</div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   Shared SVG diagram primitives (no libs).
--------------------------------------------------------------- */
const arwId = (c) => `arw-${c.replace("#", "")}`;
const mk = (c) => `url(#${arwId(c)})`;

function ArrowDefs({ colors }) {
  return (
    <defs>
      {colors.map((c) => (
        <marker key={c} id={arwId(c)} markerWidth="8" markerHeight="8" refX="5.5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill={c} />
        </marker>
      ))}
    </defs>
  );
}

function Box({ cx, cy, w, h = 30, label, sub, color = C.inkSoft, dashed, fontSize = 10.5 }) {
  return (
    <g>
      <rect
        x={cx - w / 2}
        y={cy - h / 2}
        width={w}
        height={h}
        rx={7}
        fill={color + "1E"}
        stroke={color}
        strokeWidth="1.3"
        strokeDasharray={dashed ? "4 3" : undefined}
      />
      <text
        x={cx}
        y={sub ? cy - 1 : cy + 3.5}
        textAnchor="middle"
        fontSize={fontSize}
        fontWeight="600"
        fill={C.ink}
        fontFamily={FONT}
      >
        {label}
      </text>
      {sub && (
        <text x={cx} y={cy + 9.5} textAnchor="middle" fontSize="7.5" fill={C.muted} fontFamily={MONO}>
          {sub}
        </text>
      )}
    </g>
  );
}

function Link({ x1, y1, x2, y2, color = C.muted, dashed, arrow = true, d }) {
  const common = {
    stroke: color,
    strokeWidth: 1.3,
    fill: "none",
    strokeDasharray: dashed ? "4 3" : undefined,
    markerEnd: arrow ? mk(color) : undefined,
  };
  return d ? <path d={d} {...common} /> : <line x1={x1} y1={y1} x2={x2} y2={y2} {...common} />;
}

function ELabel({ x, y, text, color = C.muted }) {
  return (
    <text x={x} y={y} textAnchor="middle" fontSize="8" fontFamily={MONO} fill={color}>
      {text}
    </text>
  );
}

/* LoopFilter — emphasize one / some / all of the three loops. */
function FilterChip({ label, active, color, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "3px 9px",
        borderRadius: 20,
        cursor: "pointer",
        fontFamily: FONT,
        fontSize: 10.5,
        fontWeight: 600,
        color: active ? color : C.muted,
        background: active ? color + "1E" : "transparent",
        border: `1px solid ${active ? color + "66" : C.line}`,
      }}
    >
      {label}
    </button>
  );
}

function LoopFilter({ loops, allOn, onAll, onToggle }) {
  const items = [
    { k: "fast", label: "Fast", color: C.accent },
    { k: "project", label: "Project", color: C.green },
    { k: "slow", label: "Slow", color: C.blue },
  ];
  return (
    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
      <FilterChip label="All" active={allOn} color={C.inkSoft} onClick={onAll} />
      {items.map((it) => (
        <FilterChip key={it.k} label={it.label} active={loops[it.k]} color={it.color} onClick={() => onToggle(it.k)} />
      ))}
    </div>
  );
}

/* The three loops — fast (day), project (engagement), slow (knowledge) —
   sharing one knowledge base. The filter dims loops toggled off. */
function ThreeLoopDiagram({ show }) {
  const T = C.accent, B = C.blue, V = C.violet, A = C.amber, G = C.green, M = C.muted, I = C.inkSoft;
  const on = (k) => (show[k] ? 1 : 0.12);
  const proj = [
    { cx: 44, w: 50, label: "Brief" },
    { cx: 112, w: 46, label: "SOW" },
    { cx: 184, w: 50, label: "Spend" },
    { cx: 252, w: 42, label: "PO" },
    { cx: 340, w: 62, label: "Kickoff" },
    { cx: 442, w: 66, label: "Reviews" },
    { cx: 534, w: 56, label: "Close" },
  ];
  return (
    <div>
      <svg width="100%" viewBox="0 0 600 340" style={{ display: "block" }}>
        <ArrowDefs colors={[M, T, B, V, A, G]} />

        {/* ---------- FAST band ---------- */}
        <g opacity={on("fast")}>
          <text x={6} y={16} fontSize="9" fontWeight="700" fill={T} fontFamily={MONO}>FAST · THE DAY</text>
          <Link x1={72} y1={60} x2={112} y2={60} color={M} />
          <Link x1={172} y1={60} x2={206} y2={60} color={M} />
          <Link x1={266} y1={60} x2={300} y2={60} color={T} />
          <Link x1={384} y1={60} x2={408} y2={60} color={T} />
          <Link x1={466} y1={60} x2={502} y2={60} color={T} />
          <Box cx={46} cy={60} w={52} label="Signals" color={I} fontSize={9.5} />
          <Box cx={142} cy={60} w={56} label="Triage" color={I} fontSize={9.5} />
          <Box cx={236} cy={60} w={56} label="Distill" color={T} fontSize={9.5} />
          <Box cx={342} cy={60} w={80} label="Synthesize" color={T} fontSize={9.5} />
          <Box cx={438} cy={60} w={54} label="Decide" color={T} fontSize={9.5} />
          <Box cx={534} cy={60} w={60} label="Execute" color={T} fontSize={9.5} />
          <Box cx={390} cy={24} w={92} h={20} label="You · steer" color={A} fontSize={9} />
          <Link x1={366} y1={34} x2={350} y2={45} color={A} dashed />
          <Link x1={414} y1={34} x2={432} y2={45} color={A} dashed />
          <Link d="M534,46 C534,86 46,86 46,74" color={M} dashed />
          <ELabel x={290} y={94} text="outcome → new signal" />
        </g>

        {/* ---------- PROJECT band ---------- */}
        <g opacity={on("project")}>
          <text x={6} y={140} fontSize="9" fontWeight="700" fill={G} fontFamily={MONO}>PROJECT · THE ENGAGEMENT</text>
          {proj.map((s) => (
            <Box key={s.label} cx={s.cx} cy={170} w={s.w} label={s.label} color={G} fontSize={9} />
          ))}
          {proj.slice(0, -1).map((s, i) => {
            const nxt = proj[i + 1];
            return <Link key={i} x1={s.cx + s.w / 2 + 2} y1={170} x2={nxt.cx - nxt.w / 2 - 2} y2={170} color={G} />;
          })}
          <ELabel x={184} y={192} text="↓ gate → Master of Coin" color={A} />
          <ELabel x={534} y={192} text="→ reflect" color={B} />
        </g>

        {/* ---------- SLOW band ---------- */}
        <g opacity={on("slow")}>
          <text x={6} y={250} fontSize="9" fontWeight="700" fill={B} fontFamily={MONO}>SLOW · THE KNOWLEDGE</text>
          <Box cx={192} cy={296} w={200} h={38} label="Temporal Knowledge Graph" sub="people · decisions · topics + history" color={B} fontSize={9.5} />
          <Box cx={470} cy={296} w={130} h={38} label="Agent Memory" sub="learned preferences" color={V} fontSize={9.5} />
          <Link d="M236,76 C236,180 150,250 150,277" color={B} dashed />
          <ELabel x={150} y={232} text="accrues" color={B} />
          <Link d="M270,277 C330,240 342,150 342,76" color={B} dashed />
          <ELabel x={332} y={200} text="enriches" color={B} />
          <Link d="M534,76 C534,190 500,255 470,277" color={V} dashed />
          <ELabel x={530} y={210} text="reflect" color={V} />
        </g>

        {/* ---------- cross-loop: KB feeds the project ---------- */}
        <g opacity={show.project && show.slow ? 1 : 0.12}>
          <Link d="M150,277 C150,215 220,196 252,185" color={G} dashed />
          <ELabel x={206} y={244} text="context" color={G} />
        </g>
      </svg>
      <div style={{ display: "flex", gap: 12, marginTop: 6, justifyContent: "center", flexWrap: "wrap" }}>
        <Legend color={C.accent} label="Fast · the day" />
        <Legend color={C.green} label="Project · the engagement" />
        <Legend color={C.blue} label="Slow · the knowledge" />
        <Legend color={C.violet} label="Agent memory" />
        <Legend color={C.amber} label="Human steer" />
      </div>
      <div style={{ fontSize: 10.5, color: C.muted, marginTop: 8, lineHeight: 1.5, textAlign: "center" }}>
        Three loops, one knowledge base — fast compounds by{" "}
        <b style={{ color: C.accent }}>throughput</b>, project by <b style={{ color: C.green }}>stewardship</b>, slow by{" "}
        <b style={{ color: C.blue }}>accrual</b>.
      </div>
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ width: 18, height: 3, borderRadius: 2, background: color }} />
      <span style={{ fontSize: 11, color: C.muted }}>{label}</span>
    </div>
  );
}

/* ---------------------------------------------------------------
   PIPELINE
--------------------------------------------------------------- */
function PipelineView() {
  const cols = [
    { key: "raw", title: "Raw inbox", icon: Mic, color: C.amber, sub: "audio · docx · txt" },
    { key: "transcribed", title: "Transcribed", icon: FileText, color: C.accent, sub: "awaiting debrief" },
    { key: "processed", title: "Processed", icon: CheckSquare, color: C.green, sub: "distilled → KB" },
  ];
  const kindColor = { audio: C.rose, docx: C.blue, txt: C.violet, md: C.accent };
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
      {cols.map((col) => (
        <div
          key={col.key}
          style={{
            background: C.panel,
            border: `1px solid ${C.line}`,
            borderRadius: 12,
            padding: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 4 }}>
            <col.icon size={16} color={col.color} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>{col.title}</span>
            <span
              style={{
                marginLeft: "auto",
                fontSize: 11,
                fontFamily: MONO,
                color: col.color,
                background: col.color + "1E",
                padding: "1px 7px",
                borderRadius: 20,
              }}
            >
              {PIPELINE[col.key].length}
            </span>
          </div>
          <div style={{ fontSize: 10.5, color: C.muted, marginBottom: 12, fontFamily: MONO }}>{col.sub}</div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {PIPELINE[col.key].map((item, i) => (
              <div
                key={i}
                style={{
                  padding: "10px 11px",
                  background: C.bgAlt,
                  border: `1px solid ${C.lineSoft}`,
                  borderRadius: 9,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      color: kindColor[item.kind],
                      background: kindColor[item.kind] + "1E",
                      padding: "1px 6px",
                      borderRadius: 4,
                      fontFamily: MONO,
                    }}
                  >
                    {item.kind}
                  </span>
                  <span style={{ marginLeft: "auto", fontSize: 10, color: C.muted, display: "flex", alignItems: "center", gap: 3 }}>
                    <Clock size={10} /> {item.age}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: C.inkSoft, wordBreak: "break-word", fontFamily: MONO }}>
                  {item.name}
                </div>
              </div>
            ))}
          </div>

          {col.key !== "processed" && (
            <div style={{ display: "flex", justifyContent: "center", marginTop: 12, color: C.muted }}>
              <ArrowRight size={16} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------
   AGENTS
--------------------------------------------------------------- */
function AgentsView({ selected, setSelected, agent }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {AGENTS.map((a) => {
          const active = a.id === selected;
          return (
            <button
              key={a.id}
              onClick={() => setSelected(a.id)}
              style={{
                textAlign: "left",
                background: active ? C.panelAlt : C.panel,
                border: `1px solid ${active ? a.color + "88" : C.line}`,
                borderRadius: 12,
                padding: 14,
                cursor: "pointer",
                fontFamily: FONT,
                boxShadow: active ? `0 0 0 1px ${a.color}44` : "none",
                transition: "all .15s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 9 }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 9,
                    background: a.color + "1E",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <a.icon size={18} color={a.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: C.ink }}>{a.name} <span style={{ fontWeight: 500, color: C.muted, fontSize: 11 }}>· {a.plain}</span></div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: statusDot(a.status),
                      }}
                    />
                    <span style={{ fontSize: 10.5, color: C.muted, textTransform: "capitalize" }}>{a.status}</span>
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 11.5, color: C.inkSoft, lineHeight: 1.4, minHeight: 32 }}>{a.role}</div>
            </button>
          );
        })}
      </div>

      {/* Detail */}
      <div
        style={{
          background: C.panel,
          border: `1px solid ${C.line}`,
          borderRadius: 12,
          padding: 18,
          alignSelf: "start",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 12,
              background: agent.color + "1E",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <agent.icon size={24} color={agent.color} />
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700 }}>{agent.name} <span style={{ fontSize: 12.5, fontWeight: 500, color: C.muted }}>· {agent.plain}</span></div>
            <div
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                color: LOOP_COLOR[agent.loop] || C.blue,
                textTransform: "uppercase",
                letterSpacing: 0.4,
              }}
            >
              {agent.loop} loop
            </div>
          </div>
        </div>

        <div style={{ fontSize: 13, color: C.inkSoft, lineHeight: 1.5, marginBottom: 18 }}>{agent.role}</div>

        <DetailRow label="Status" value={agent.status} color={statusDot(agent.status)} />
        <DetailRow label="Last run" value={agent.lastRun} />
        <DetailRow label="Memory" value={`${agent.memory} entries`} />

        <div
          style={{
            marginTop: 16,
            padding: "12px 13px",
            background: C.bgAlt,
            border: `1px solid ${C.lineSoft}`,
            borderRadius: 9,
          }}
        >
          <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 5 }}>
            Current task
          </div>
          <div style={{ fontSize: 12.5, color: C.ink, fontFamily: MONO }}>{agent.task}</div>
        </div>

        <button
          style={{
            marginTop: 14,
            width: "100%",
            padding: "11px",
            borderRadius: 9,
            border: "none",
            cursor: "pointer",
            fontFamily: FONT,
            fontSize: 13,
            fontWeight: 600,
            color: "#0B1218",
            background: agent.color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 7,
          }}
        >
          <Sparkles size={15} /> Invoke {agent.name}
        </button>
      </div>
    </div>
  );
}

function DetailRow({ label, value, color }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "9px 0",
        borderBottom: `1px solid ${C.lineSoft}`,
      }}
    >
      <span style={{ fontSize: 12, color: C.muted }}>{label}</span>
      <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: C.ink, fontWeight: 500, textTransform: "capitalize" }}>
        {color && <span style={{ width: 7, height: 7, borderRadius: "50%", background: color }} />}
        {value}
      </span>
    </div>
  );
}

/* ---------------------------------------------------------------
   KNOWLEDGE GRAPH
--------------------------------------------------------------- */
function GraphView() {
  const W = 640, H = 480;
  const [selected, setSelected] = useState("topA");
  const [hovered, setHovered] = useState(null);
  const [active, setActive] = useState(() => new Set(NODE_TYPES.map((t) => t.id)));
  const svgRef = useRef(null);
  const dragId = useRef(null);

  const { nodes, edges, layout } = useMemo(() => {
    const ns = G_NODES.filter((nd) => active.has(nd.type));
    const idset = new Set(ns.map((nd) => nd.id));
    const es = G_EDGES.filter((e) => idset.has(e.source) && idset.has(e.target));
    return { nodes: ns, edges: es, layout: computeLayout(ns, es, W, H) };
  }, [active]);

  const [pos, setPos] = useState(layout);
  useEffect(() => setPos(layout), [layout]);

  const sel = nodes.find((nd) => nd.id === selected) || null;
  const conns = sel
    ? edges
        .filter((e) => e.source === sel.id || e.target === sel.id)
        .map((e) => ({ id: e.source === sel.id ? e.target : e.source, rel: e.rel, out: e.source === sel.id }))
    : [];
  const neighborIds = new Set(conns.map((c) => c.id));

  const toSvg = (e) => {
    const r = svgRef.current.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  };
  const onMove = (e) => {
    if (!dragId.current) return;
    const p = toSvg(e);
    setPos((prev) => ({ ...prev, [dragId.current]: { x: Math.max(28, Math.min(W - 28, p.x)), y: Math.max(26, Math.min(H - 26, p.y)) } }));
  };
  const endDrag = () => (dragId.current = null);

  const toggle = (id) => {
    if (id === "you") return;
    setActive((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const nodeById = Object.fromEntries(nodes.map((nd) => [nd.id, nd]));

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.35fr 1fr", gap: 14 }}>
      {/* Graph */}
      <Panel
        title="Temporal knowledge graph"
        icon={GitBranch}
        accent={C.blue}
        right={
          <span style={{ fontSize: 11, color: C.muted, fontFamily: MONO }}>
            {nodes.length} nodes · {edges.length} edges
          </span>
        }
      >
        {/* Type filter chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
          {NODE_TYPES.map((t) => {
            const on = active.has(t.id);
            return (
              <button
                key={t.id}
                onClick={() => toggle(t.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 10px",
                  borderRadius: 20,
                  cursor: t.id === "you" ? "default" : "pointer",
                  fontFamily: FONT,
                  fontSize: 11,
                  fontWeight: 600,
                  color: on ? t.color : C.muted,
                  background: on ? t.color + "1E" : "transparent",
                  border: `1px solid ${on ? t.color + "66" : C.line}`,
                  opacity: on ? 1 : 0.6,
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: t.color }} />
                {t.label}
              </button>
            );
          })}
        </div>

        <svg
          ref={svgRef}
          width="100%"
          viewBox={`0 0 ${W} ${H}`}
          style={{ display: "block", background: C.bgAlt, borderRadius: 10, border: `1px solid ${C.lineSoft}`, touchAction: "none" }}
          onMouseMove={onMove}
          onMouseUp={endDrag}
          onMouseLeave={endDrag}
        >
          <rect x={0} y={0} width={W} height={H} fill="transparent" onMouseDown={() => setSelected(null)} />

          {/* edges */}
          {edges.map((e, i) => {
            const a = pos[e.source], b = pos[e.target];
            if (!a || !b) return null;
            const on = sel && (e.source === sel.id || e.target === sel.id);
            const faded = sel && !on;
            return (
              <g key={i} opacity={faded ? 0.18 : 1}>
                <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={on ? C.accent : C.line} strokeWidth={on ? 1.7 : 1} />
                {on && (
                  <text
                    x={(a.x + b.x) / 2}
                    y={(a.y + b.y) / 2 - 2}
                    textAnchor="middle"
                    fontSize="8"
                    fontFamily={MONO}
                    fill={C.inkSoft}
                  >
                    {e.rel}
                  </text>
                )}
              </g>
            );
          })}

          {/* nodes */}
          {nodes.map((nd) => {
            const p = pos[nd.id];
            if (!p) return null;
            const color = TYPE_COLOR[nd.type];
            const r = TYPE_RADIUS[nd.type] || 9;
            const isSel = sel && nd.id === sel.id;
            const hi = !sel || isSel || neighborIds.has(nd.id);
            const showLabel = hi || hovered === nd.id || ["you", "topic", "goal"].includes(nd.type);
            return (
              <g
                key={nd.id}
                opacity={hi ? 1 : 0.28}
                style={{ cursor: "pointer" }}
                onMouseDown={(ev) => {
                  ev.stopPropagation();
                  dragId.current = nd.id;
                  setSelected(nd.id);
                }}
                onMouseEnter={() => setHovered(nd.id)}
                onMouseLeave={() => setHovered(null)}
              >
                <circle cx={p.x} cy={p.y} r={r + (isSel ? 5 : 0)} fill={color + "26"} stroke={color} strokeWidth={isSel ? 2.4 : 1.5} />
                {isSel && <circle cx={p.x} cy={p.y} r={r + 9} fill="none" stroke={color} strokeWidth="1" opacity="0.4" />}
                {showLabel && (
                  <text
                    x={p.x}
                    y={p.y + r + 11}
                    textAnchor="middle"
                    fontSize="8.5"
                    fontFamily={MONO}
                    fill={isSel ? C.ink : C.inkSoft}
                    fontWeight={isSel ? 700 : 400}
                  >
                    {nd.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        <div style={{ fontSize: 10.5, color: C.muted, marginTop: 8, lineHeight: 1.5 }}>
          Click a node to trace its edges · drag to rearrange · toggle types above. Seeded from the real KB —
          decision edges from <span style={{ fontFamily: MONO, color: C.inkSoft }}>decisions/_map.md</span>.
        </div>
      </Panel>

      {/* Detail */}
      <div style={{ minWidth: 0 }}>
        {sel ? (
          <Panel
            title={NODE_TYPES.find((t) => t.id === sel.type)?.label.replace(/s$/, "") || "Node"}
            icon={
              sel.type === "person" || sel.type === "you"
                ? Users
                : sel.type === "company"
                ? Building2
                : sel.type === "topic"
                ? Lightbulb
                : sel.type === "goal"
                ? Activity
                : GitBranch
            }
            accent={TYPE_COLOR[sel.type]}
          >
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{sel.label}</div>
            <div style={{ fontSize: 12.5, color: C.inkSoft, lineHeight: 1.5, marginBottom: 14 }}>{sel.summary}</div>

            {/* connections */}
            <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 7 }}>
              Connections ({conns.length})
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 14 }}>
              {conns.map((c, i) => {
                const other = nodeById[c.id];
                if (!other) return null;
                return (
                  <button
                    key={i}
                    onClick={() => setSelected(c.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "7px 10px",
                      background: C.bgAlt,
                      border: `1px solid ${C.lineSoft}`,
                      borderRadius: 8,
                      cursor: "pointer",
                      fontFamily: FONT,
                      textAlign: "left",
                    }}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: TYPE_COLOR[other.type], flexShrink: 0 }} />
                    <span style={{ fontSize: 9.5, color: C.muted, fontFamily: MONO, minWidth: 74 }}>
                      {c.out ? "" : "← "}
                      {c.rel}
                      {c.out ? " →" : ""}
                    </span>
                    <span style={{ fontSize: 12, color: C.ink, flex: 1 }}>{other.label}</span>
                  </button>
                );
              })}
            </div>

            {/* signal history */}
            {sel.signals && sel.signals.length > 0 && (
              <>
                <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 7 }}>
                  Signal history
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {sel.signals.map((s, i) => (
                    <div key={i} style={{ display: "flex", gap: 9 }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                        <span style={{ fontSize: 9.5, color: C.muted, fontFamily: MONO }}>{s.date}</span>
                        <span
                          style={{
                            marginTop: 3,
                            fontSize: 8.5,
                            fontWeight: 700,
                            color: TAG_COLOR[s.tag] || C.muted,
                            background: (TAG_COLOR[s.tag] || C.muted) + "1E",
                            padding: "1px 6px",
                            borderRadius: 4,
                            fontFamily: MONO,
                          }}
                        >
                          {s.tag}
                        </span>
                      </div>
                      <div style={{ fontSize: 11.5, color: C.inkSoft, lineHeight: 1.45, paddingTop: 1 }}>{s.text}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Panel>
        ) : (
          <Panel title="Inspect" icon={GitBranch} accent={C.blue}>
            <div style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.5, padding: "20px 4px", textAlign: "center" }}>
              Select any node to see its summary, typed connections, and signal history — the same traversal that produces
              a brief, a decision history, or a stakeholder POV.
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   BLUEPRINT — the inner workings, in diagrams.
--------------------------------------------------------------- */
function StatusLegend() {
  const items = [
    { c: C.green, l: "built" },
    { c: C.amber, l: "partial" },
    { c: C.rose, l: "missing" },
  ];
  return (
    <div style={{ display: "flex", gap: 14 }}>
      {items.map((it) => (
        <div key={it.l} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: it.c + "1E", border: `1.3px solid ${it.c}` }} />
          <span style={{ fontSize: 11, color: C.muted }}>{it.l}</span>
        </div>
      ))}
    </div>
  );
}

function BlueprintView() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Panel title="Target architecture · status overlay" icon={Blocks} accent={C.accent} right={<StatusLegend />}>
        <div style={{ fontSize: 11.5, color: C.muted, marginBottom: 10, lineHeight: 1.5 }}>
          The whole system as designed — every node colored by where it stands today. The distill core is solid, the
          knowledge graph and intake are half-built, and the execution back-half is mostly ahead of us.
        </div>
        <TargetMap />
      </Panel>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Panel title="Transcript pipeline" icon={Mic} accent={C.blue}>
          <div style={{ fontSize: 11.5, color: C.muted, marginBottom: 10, lineHeight: 1.5 }}>
            How a raw drop becomes knowledge: any source normalizes, gets debriefed, and fans out to intelligence + KB.
          </div>
          <PipelineDiagram />
        </Panel>

        <Panel title="Engine ⋈ Vault" icon={Layers} accent={C.violet}>
          <div style={{ fontSize: 11.5, color: C.muted, marginBottom: 10, lineHeight: 1.5 }}>
            One workspace tree, two layers: code stays local + git-tracked, content stays cloud-synced + tool-agnostic,
            bridged by a directory junction.
          </div>
          <ArchDiagram />
        </Panel>
      </div>

      <Panel title="Project loop · engagement lifecycle" icon={CheckSquare} accent={C.green}>
        <div style={{ fontSize: 11.5, color: C.muted, marginBottom: 10, lineHeight: 1.5 }}>
          The medium loop as a stage machine: an engagement advances brief → close, pausing at gates the Steward hands to
          the Master of Coin (funding) and to <span style={{ fontFamily: MONO, color: C.inkSoft }}>verify-deliverable</span> (review).
        </div>
        <ProjectLifecycleDiagram />
      </Panel>

      <Panel title="The Small Council · agents by loop" icon={Users} accent={C.amber}>
        <div style={{ fontSize: 11.5, color: C.muted, marginBottom: 10, lineHeight: 1.5 }}>
          Who runs each loop. Loop-owners carry a loop end to end; shared services are called across loops; the Hand
          coordinates. You rule by exception.
        </div>
        <RosterDiagram />
      </Panel>
    </div>
  );
}

/* Diagram 1 — the target-state gap map. Colors come from the STATUS/TARGET registry. */
function TargetMap() {
  const M = C.muted, B = C.blue, V = C.violet, A = C.amber;
  return (
    <svg width="100%" viewBox="0 0 720 360" style={{ display: "block" }}>
      <ArrowDefs colors={[M, B, V, A]} />

      {/* Orchestration layer — drives the loop */}
      <Box cx={500} cy={16} w={186} h={22} label="The Hand · triggers" color={SC("orchestrator")} fontSize={9.5} />
      <Link x1={452} y1={27} x2={452} y2={43} color={A} dashed />
      <Link x1={584} y1={27} x2={584} y2={43} color={A} dashed />
      <ELabel x={523} y={38} text="drives" color={A} />

      {/* Row 1 — intake → distill → action */}
      <Link x1={134} y1={60} x2={169} y2={60} color={M} />
      <Link x1={270} y1={60} x2={297} y2={60} color={M} />
      <Link x1={382} y1={60} x2={408} y2={60} color={M} />
      <Link x1={495} y1={60} x2={527} y2={60} color={M} />

      <Box cx={76} cy={60} w={116} h={32} label="Multi-source intake" sub="audio · email · cal" color={SC("intake")} fontSize={9.5} />
      <Box cx={220} cy={60} w={100} h={32} label="Normalize" sub="signal schema" color={SC("normalize")} fontSize={9.5} />
      <Box cx={340} cy={60} w={84} h={32} label="Triage" sub="KB-rank" color={SC("triage")} fontSize={9.5} />
      <Box cx={452} cy={60} w={86} h={32} label="Distill" sub="signals + edges" color={SC("distill")} fontSize={9.5} />
      <Box cx={584} cy={60} w={112} h={32} label="Action queue" sub="prioritized" color={SC("action")} fontSize={9.5} />

      {/* Action → down → execution row */}
      <Link x1={584} y1={76} x2={584} y2={164} color={M} />

      {/* Row 2 — execution, right → left */}
      <Link x1={532} y1={180} x2={499} y2={180} color={M} />
      <Link x1={406} y1={180} x2={381} y2={180} color={M} />
      <Link x1={296} y1={180} x2={269} y2={180} color={M} />
      <Link x1={188} y1={180} x2={134} y2={180} color={M} />

      <Box cx={584} cy={180} w={104} h={32} label="Agent pre-work" sub="autonomous" color={SC("prework")} fontSize={9.5} />
      <Box cx={452} cy={180} w={92} h={32} label="Approve" sub="human gate" color={SC("approve")} fontSize={9.5} />
      <Box cx={338} cy={180} w={84} h={32} label="Execute" sub="run it" color={SC("execute")} fontSize={9.5} />
      <Box cx={228} cy={180} w={80} h={32} label="Done → next" color={SC("done")} fontSize={9} />
      <Box cx={90} cy={180} w={86} h={32} label="Outcome" sub="response" color={SC("outcome")} fontSize={9.5} />

      {/* Feedback: outcome → new signal */}
      <Link d="M90,164 C90,116 140,84 170,68" color={M} dashed />
      <ELabel x={126} y={116} text="new signal" />

      {/* Graph band */}
      <Box
        cx={250}
        cy={302}
        w={182}
        h={38}
        label="Temporal Knowledge Graph"
        sub="+ relationship index"
        color={SC("kb")}
        fontSize={9.5}
      />
      <Box cx={480} cy={302} w={128} h={38} label="Relational synthesis" sub="on demand" color={SC("synthesis")} fontSize={9.5} />
      <Box cx={648} cy={302} w={96} h={38} label="Agent Memory" color={SC("memory")} fontSize={9.5} />

      {/* accrues: Distill → KB */}
      <Link d="M452,76 C430,120 402,150 402,196 C402,250 330,283 302,290" color={B} dashed />
      <ELabel x={414} y={150} text="accrues" color={B} />

      {/* traverse: KB → Synthesis */}
      <Link x1={341} y1={302} x2={414} y2={302} color={M} />
      <ELabel x={378} y={295} text="traverse" />

      {/* feeds: Synthesis → Action queue */}
      <Link d="M480,283 C520,230 523,170 523,140 C523,104 560,86 584,78" color={A} dashed />
      <ELabel x={534} y={150} text="feeds" color={A} />

      {/* reflect: Execute → Agent Memory */}
      <Link d="M356,178 C470,146 600,168 648,283" color={V} dashed />
      <ELabel x={566} y={214} text="reflect" color={V} />

      {/* pull query */}
      <ELabel x={480} y={332} text="↑ you ask, on demand" color={C.inkSoft} />
    </svg>
  );
}

/* Diagram 2 — the transcript pipeline. */
function PipelineDiagram() {
  const M = C.muted;
  return (
    <svg width="100%" viewBox="0 0 700 210" style={{ display: "block" }}>
      <ArrowDefs colors={[M]} />

      {/* sources → prep */}
      <Link x1={114} y1={48} x2={150} y2={88} color={M} />
      <Link x1={114} y1={98} x2={151} y2={98} color={M} />
      <Link x1={114} y1={148} x2={150} y2={108} color={M} />

      <Box cx={66} cy={48} w={96} label="Audio .m4a" color={C.rose} fontSize={10} />
      <Box cx={66} cy={98} w={96} label="Docx export" color={C.blue} fontSize={10} />
      <Box cx={66} cy={148} w={96} label="Txt drop" color={C.violet} fontSize={10} />

      <Box cx={214} cy={98} w={120} h={34} label="Transcribe / Convert" sub="Azure Speech · pandoc" color={C.accent} fontSize={9.5} />

      <Link x1={274} y1={98} x2={300} y2={98} color={M} />
      <Box cx={356} cy={98} w={108} h={34} label="_transcribed" sub="canonical .md" color={C.blue} fontSize={9.5} />

      <Link x1={410} y1={98} x2={428} y2={98} color={M} />
      <Box cx={474} cy={98} w={88} h={34} label="Debrief" sub="The Scribe" color={C.amber} fontSize={9.5} />

      {/* debrief fan-out */}
      <Link x1={512} y1={88} x2={558} y2={56} color={M} />
      <Box cx={612} cy={48} w={104} h={32} label="_processed" sub="archived" color={C.green} fontSize={9.5} />

      <Link x1={474} y1={115} x2={474} y2={148} color={M} />
      <Box cx={474} cy={166} w={124} h={32} label="_intelligence" sub="actions · insights" color={C.accent} fontSize={9.5} />

      <Link x1={512} y1={110} x2={560} y2={152} color={M} />
      <Box cx={612} cy={166} w={104} h={32} label="_kb" sub="entities" color={C.blue} fontSize={9.5} />
    </svg>
  );
}

/* Small labeled chip for the architecture panels. */
function Chip({ x, y, w, label, color }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={24} rx={6} fill={color + "18"} stroke={color + "66"} strokeWidth="1" />
      <text x={x + w / 2} y={y + 15.5} textAnchor="middle" fontSize="9.5" fontFamily={MONO} fill={C.inkSoft}>
        {label}
      </text>
    </g>
  );
}

/* Diagram 3 — Engine ⋈ Vault. */
function ArchDiagram() {
  const engineChips = ["agents", "skills", "specs", "styles", "workflows", "tools", "lib"];
  const vaultChips = ["_inbox", "_intelligence", "_kb", "_deliverables", "_assets", "_logs"];
  const place = (list) => {
    const cols = [16, 140];
    const rowH = 34;
    return list.map((label, i) => ({
      label,
      x: cols[i % 2],
      y: 60 + Math.floor(i / 2) * rowH,
      w: 112,
    }));
  };
  return (
    <svg width="100%" viewBox="0 0 700 300" style={{ display: "block" }}>
      {/* Engine panel */}
      <rect x={36} y={40} width={268} height={228} rx={12} fill={C.accent + "0E"} stroke={C.accent + "55"} strokeWidth="1.3" />
      <text x={56} y={68} fontSize="13" fontWeight="700" fill={C.accent} fontFamily={FONT}>ENGINE</text>
      <text x={56} y={83} fontSize="9" fill={C.muted} fontFamily={MONO}>local · git-tracked · never synced</text>
      <g transform="translate(52, 32)">
        {place(engineChips).map((c) => (
          <Chip key={c.label} x={c.x} y={c.y} w={c.w} label={c.label} color={C.accent} />
        ))}
      </g>

      {/* Vault panel */}
      <rect x={396} y={40} width={268} height={228} rx={12} fill={C.blue + "0E"} stroke={C.blue + "55"} strokeWidth="1.3" />
      <text x={416} y={68} fontSize="13" fontWeight="700" fill={C.blue} fontFamily={FONT}>VAULT</text>
      <text x={416} y={83} fontSize="9" fill={C.muted} fontFamily={MONO}>OneDrive · gitignored · tool-agnostic</text>
      <g transform="translate(412, 32)">
        {place(vaultChips).map((c) => (
          <Chip key={c.label} x={c.x} y={c.y} w={c.w} label={c.label} color={C.blue} />
        ))}
      </g>

      {/* Junction bridge */}
      <line x1={304} y1={154} x2={318} y2={154} stroke={C.amber} strokeWidth="1.4" />
      <line x1={382} y1={154} x2={396} y2={154} stroke={C.amber} strokeWidth="1.4" />
      <Box cx={350} cy={154} w={72} h={36} label="junction" sub="mklink /J" color={C.amber} fontSize={10} />
    </svg>
  );
}

/* Diagram 4 — the project loop as a stage machine (the medium loop). */
function ProjectLifecycleDiagram() {
  const M = C.muted, G = C.green, A = C.amber, B = C.blue;
  const r1 = [
    { cx: 58, label: "Brief" },
    { cx: 156, label: "Supplier" },
    { cx: 254, label: "SOW" },
    { cx: 352, label: "Spend" },
    { cx: 450, label: "PO" },
  ];
  const r2 = [
    { cx: 450, label: "Kickoff" },
    { cx: 320, label: "Milestones" },
    { cx: 180, label: "Reviews" },
    { cx: 62, label: "Close" },
  ];
  return (
    <svg width="100%" viewBox="0 0 540 214" style={{ display: "block" }}>
      <ArrowDefs colors={[M, A, B]} />

      {/* Row 1: brief → PO */}
      {r1.map((s) => (
        <Box key={s.label} cx={s.cx} cy={40} w={84} label={s.label} color={G} fontSize={9.5} />
      ))}
      {r1.slice(0, -1).map((s, i) => (
        <Link key={i} x1={s.cx + 44} y1={40} x2={r1[i + 1].cx - 44} y2={40} color={M} />
      ))}

      {/* PO → down → Kickoff (snake) */}
      <Link d="M450,55 C450,80 450,95 450,113" color={M} />

      {/* Row 2: kickoff → close (right to left) */}
      {r2.map((s) => (
        <Box key={s.label} cx={s.cx} cy={128} w={84} label={s.label} color={G} fontSize={9.5} />
      ))}
      {r2.slice(0, -1).map((s, i) => (
        <Link key={i} x1={s.cx - 44} y1={128} x2={r2[i + 1].cx + 44} y2={128} color={M} />
      ))}

      {/* Gate: Spend → Master of Coin */}
      <Link x1={352} y1={55} x2={352} y2={72} color={A} dashed />
      <Box cx={352} cy={87} w={120} h={22} label="Master of Coin" color={A} fontSize={9} />

      {/* Gate: Reviews → verify-deliverable */}
      <Link x1={180} y1={143} x2={180} y2={162} color={A} dashed />
      <Box cx={180} cy={177} w={126} h={22} label="verify-deliverable" color={A} fontSize={9} />

      {/* Close → reflect */}
      <Link x1={62} y1={143} x2={62} y2={168} color={B} dashed />
      <ELabel x={62} y={180} text="reflect → Knowledge" color={B} />
    </svg>
  );
}

/* Diagram 5 — the Small Council: agents grouped by loop / tier. */
function RosterDiagram() {
  const T = C.accent, G = C.green, B = C.blue, V = C.violet, I = C.inkSoft;
  const Card = ({ x, y, w, h, title, color, chips }) => (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={10} fill={color + "0E"} stroke={color + "55"} strokeWidth="1.2" />
      <text x={x + 12} y={y + 18} fontSize="9.5" fontWeight="700" fill={color} fontFamily={MONO}>
        {title}
      </text>
      {chips.map((c, i) => (
        <Chip key={c} x={x + 12} y={y + 28 + i * 30} w={w - 24} label={c} color={color} />
      ))}
    </g>
  );
  return (
    <svg width="100%" viewBox="0 0 540 236" style={{ display: "block" }}>
      <Card x={8} y={16} w={168} h={104} title="DAY LOOP" color={T} chips={["Scribe", "Herald"]} />
      <Card x={186} y={16} w={168} h={104} title="PROJECT LOOP" color={G} chips={["Steward", "Master of Coin"]} />
      <Card x={364} y={16} w={168} h={104} title="KNOWLEDGE LOOP" color={B} chips={["Grand Maester", "Three-Eyed Raven"]} />
      <Card x={8} y={132} w={346} h={92} title="SHARED SERVICES" color={V} chips={["Master of Whisperers", "Master Smith"]} />
      <Card x={364} y={132} w={168} h={92} title="META" color={I} chips={["Hand of the King"]} />
    </svg>
  );
}
