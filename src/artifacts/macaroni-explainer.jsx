import React, { useState, useEffect, useMemo } from "react";
import {
  MessageSquare,
  Ear,
  ShieldCheck,
  Split,
  Brain,
  Send,
  Terminal,
  Plug,
  RefreshCw,
  Lock,
  User,
  Users,
  UserX,
  UserCog,
  Cpu,
  Waypoints,
  Server,
  HardDrive,
  Sparkles,
  ChevronRight,
  Play,
  Pause,
} from "lucide-react";

/* ---------------------------------------------------------------
   🍝 MACARONI — how it works
   A local bridge that pipes macOS apps to an AI agent over iMessage.
   One core (messages.py), many surfaces (CLI / MCP / loop). The
   agent borrows a CLI's brain; Macaroni gives it hands, ears, and
   context. Nothing leaves the Mac.
--------------------------------------------------------------- */

const C = {
  bg: "#0F1015",
  bgAlt: "#161821",
  panel: "#1B1E2A",
  panelAlt: "#222636",
  line: "#2C3142",
  lineSoft: "#232739",
  ink: "#ECEFF6",
  inkSoft: "#AEB6C8",
  muted: "#727C93",
  pasta: "#F2B441", // macaroni gold — the signature accent
  pastaDim: "#3A2E10",
  blue: "#5B9DF0", // iMessage blue
  blueDim: "#16263C",
  green: "#5FD08A",
  greenDim: "#123021",
  violet: "#A98BE0",
  violetDim: "#241C36",
  rose: "#E5788C",
  roseDim: "#331A22",
  teal: "#4CC2C4",
  tealDim: "#123333",
};

const FONT =
  "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const MONO = "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

/* ---------------------------------------------------------------
   THE CONTROL LOOP — stages a message passes through.
--------------------------------------------------------------- */
const STAGES = [
  {
    id: "imessage",
    label: "iMessage",
    sub: "chat.db",
    icon: MessageSquare,
    color: C.blue,
    dim: C.blueDim,
    detail:
      "A message lands in the macOS Messages database. In @mention mode it must carry the `@roni` token to opt in; in --direct mode any message to the agent's own Apple ID counts.",
  },
  {
    id: "listen",
    label: "Listener",
    sub: "watch.py",
    icon: Ear,
    color: C.teal,
    dim: C.tealDim,
    detail:
      "The watch loop polls chat.db for new messages (--once + re-arm so a turn-based agent can drive it). A single-instance PID lock stops two sessions racing on the shared cursor.",
  },
  {
    id: "acl",
    label: "Permission gate",
    sub: "acl.py",
    icon: ShieldCheck,
    color: C.rose,
    dim: C.roseDim,
    detail:
      "Least-privilege by default. The listener only reads whitelisted senders, and every command carries that sender's capability tier. Born from a real group-chat leak — safety is code, not vibes.",
  },
  {
    id: "dispatch",
    label: "Dispatcher",
    sub: "dispatcher.py",
    icon: Split,
    color: C.violet,
    dim: C.violetDim,
    detail:
      "`roni serve` routes each allowed command to a handler: Echo (test), Subprocess, or CopilotAgent. Picks the sub-agent and per-message /model.",
  },
  {
    id: "brain",
    label: "Agent brain",
    sub: "Copilot CLI",
    icon: Brain,
    color: C.pasta,
    dim: C.pastaDim,
    detail:
      "Bring-your-own-brain: instead of running a model, Macaroni pipes the command to an AI CLI it already has (`copilot -p … --model …`). The bridge is hands and ears; the CLI is the brain.",
  },
  {
    id: "reply",
    label: "Reply",
    sub: "messages.py",
    icon: Send,
    color: C.green,
    dim: C.greenDim,
    detail:
      "The agent's answer goes back out through the same core that read it. Confirm before messaging anyone but the owner. The reply arrives as a normal iMessage.",
  },
];

/* ---------------------------------------------------------------
   ONE CORE, MANY SURFACES — messages.py is the only thing that
   touches chat.db / AppleScript; everything else calls it.
--------------------------------------------------------------- */
const SURFACES = [
  {
    id: "cli",
    label: "CLI",
    sub: "roni <app> <action>",
    icon: Terminal,
    color: C.teal,
    dim: C.tealDim,
  },
  {
    id: "mcp",
    label: "MCP server",
    sub: "roni-mcp (local stdio)",
    icon: Plug,
    color: C.violet,
    dim: C.violetDim,
  },
  {
    id: "loop",
    label: "iMessage loop",
    sub: "roni serve",
    icon: RefreshCw,
    color: C.blue,
    dim: C.blueDim,
  },
];

/* ---------------------------------------------------------------
   PERMISSION TIERS — the ACL that makes it trustworthy.
--------------------------------------------------------------- */
const TIERS = [
  {
    id: "owner",
    label: "Owner",
    icon: UserCog,
    color: C.green,
    dim: C.greenDim,
    can: "Full control. No confirmation needed to send.",
  },
  {
    id: "trusted",
    label: "Trusted",
    icon: Users,
    color: C.blue,
    dim: C.blueDim,
    can: "Broad access; confirm before the agent messages them.",
  },
  {
    id: "limited",
    label: "Limited",
    icon: User,
    color: C.pasta,
    dim: C.pastaDim,
    can: "Narrow, read-leaning capabilities only.",
  },
  {
    id: "blocked",
    label: "Blocked",
    icon: UserX,
    color: C.rose,
    dim: C.roseDim,
    can: "Never read, never acted on. Default for the unknown.",
  },
];

/* ---------------------------------------------------------------
   DEPLOYMENT MODES
--------------------------------------------------------------- */
const MODES = {
  mention: {
    id: "mention",
    label: "@mention",
    tag: "single-Mac fallback",
    icon: MessageSquare,
    blurb:
      "One Mac, your own Apple ID. Casual self-texts stay private; only messages carrying the `@roni` token are ingested. The original hack — a bandaid for the hall-of-mirrors problem of texting yourself.",
    trigger: "@roni show me my reminders",
  },
  direct: {
    id: "direct",
    label: "--direct",
    tag: "the real product",
    icon: Cpu,
    blurb:
      "A dedicated agent Mac (stormclaw) with its own Apple ID. You text it like a contact; replies arrive as normal incoming messages. A separate identity is the only real fix for self-iMessage ambiguity.",
    trigger: "text 'roni' like any other contact",
  },
};

/* =============================================================== */

function Chip({ children, color, bg }) {
  return (
    <span
      style={{
        fontFamily: MONO,
        fontSize: 10.5,
        letterSpacing: 0.4,
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

function Stage({ stage, active, done, onHover }) {
  const Icon = stage.icon;
  return (
    <div
      onMouseEnter={() => onHover(stage.id)}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        flex: "1 1 0",
        minWidth: 84,
        cursor: "default",
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 14,
          display: "grid",
          placeItems: "center",
          background: active ? stage.color : stage.dim,
          border: `1.5px solid ${active ? stage.color : stage.color + "55"}`,
          boxShadow: active
            ? `0 0 0 4px ${stage.color}22, 0 0 22px ${stage.color}66`
            : "none",
          transform: active ? "translateY(-3px) scale(1.06)" : "none",
          transition: "all 260ms cubic-bezier(.2,.7,.3,1)",
        }}
      >
        <Icon
          size={24}
          color={active ? "#0F1015" : stage.color}
          strokeWidth={2.1}
        />
      </div>
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: 12.5,
            fontWeight: 700,
            color: active ? stage.color : C.ink,
            letterSpacing: 0.2,
            transition: "color 260ms",
          }}
        >
          {stage.label}
        </div>
        <div
          style={{
            fontFamily: MONO,
            fontSize: 10,
            color: C.muted,
            marginTop: 2,
          }}
        >
          {stage.sub}
        </div>
      </div>
      {done && !active && (
        <div
          style={{
            position: "absolute",
            top: -3,
            right: "50%",
            marginRight: -34,
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: C.green,
            display: "grid",
            placeItems: "center",
            fontSize: 10,
            color: "#0F1015",
            fontWeight: 900,
          }}
        >
          ✓
        </div>
      )}
    </div>
  );
}

function Connector({ lit }) {
  return (
    <div
      style={{
        flex: "0 0 26px",
        height: 2,
        alignSelf: "flex-start",
        marginTop: 25,
        background: lit
          ? `linear-gradient(90deg, ${C.pasta}, ${C.pasta})`
          : C.line,
        boxShadow: lit ? `0 0 10px ${C.pasta}aa` : "none",
        transition: "all 260ms",
        borderRadius: 2,
      }}
    />
  );
}

export default function MacaroniExplainer() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [mode, setMode] = useState("mention");
  const [hovered, setHovered] = useState("imessage");

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      setStep((s) => (s + 1) % (STAGES.length + 1));
    }, 1400);
    return () => clearInterval(t);
  }, [playing]);

  // keep the detail panel synced to the animation unless the user hovers
  useEffect(() => {
    if (playing && step < STAGES.length) setHovered(STAGES[step].id);
  }, [step, playing]);

  const activeStage = useMemo(
    () => STAGES.find((s) => s.id === hovered) || STAGES[0],
    [hovered]
  );
  const currentMode = MODES[mode];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `radial-gradient(1200px 600px at 15% -10%, ${C.bgAlt}, ${C.bg} 60%)`,
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
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: 16,
              display: "grid",
              placeItems: "center",
              fontSize: 32,
              background: `linear-gradient(145deg, ${C.pastaDim}, ${C.panel})`,
              border: `1.5px solid ${C.pasta}55`,
              boxShadow: `0 0 26px ${C.pasta}22`,
            }}
          >
            🍝
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: 30,
                  fontWeight: 800,
                  letterSpacing: -0.5,
                }}
              >
                Macaroni
              </h1>
              <Chip color={C.pasta} bg={C.pastaDim}>
                roni
              </Chip>
            </div>
            <p
              style={{
                margin: "5px 0 0",
                color: C.inkSoft,
                fontSize: 13.5,
                maxWidth: 560,
                lineHeight: 1.5,
              }}
            >
              A local bridge that pipes your Mac's apps to an AI agent over
              iMessage. One core, many surfaces — nothing leaves the Mac.
            </p>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            alignItems: "flex-end",
          }}
        >
          <div style={{ display: "flex", gap: 8 }}>
            <Chip color={C.green} bg={C.greenDim}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                <HardDrive size={11} /> 100% local
              </span>
            </Chip>
            <Chip color={C.blue} bg={C.blueDim}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                <Sparkles size={11} /> bring-your-own-brain
              </span>
            </Chip>
          </div>
          <div style={{ fontFamily: MONO, fontSize: 11, color: C.muted }}>
            jochien/macaroni · v0.2.0
          </div>
        </div>
      </div>

      {/* ===== THE CONTROL LOOP ===== */}
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
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Waypoints size={18} color={C.pasta} />
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
              The control loop
            </h2>
            <span style={{ color: C.muted, fontSize: 12.5 }}>
              a message's round trip
            </span>
          </div>
          <button
            onClick={() => setPlaying((p) => !p)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              background: playing ? C.panelAlt : C.pasta,
              color: playing ? C.ink : "#0F1015",
              border: `1px solid ${playing ? C.line : C.pasta}`,
              borderRadius: 9,
              padding: "7px 14px",
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: FONT,
            }}
          >
            {playing ? <Pause size={14} /> : <Play size={14} />}
            {playing ? "Pause" : "Play"} flow
          </button>
        </div>

        {/* pipeline */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "wrap",
            rowGap: 18,
          }}
        >
          {STAGES.map((s, i) => (
            <React.Fragment key={s.id}>
              <Stage
                stage={s}
                active={step === i}
                done={step > i || step === STAGES.length}
                onHover={(id) => {
                  setHovered(id);
                }}
              />
              {i < STAGES.length - 1 && (
                <Connector lit={step === i || step === i + 1} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* detail panel for the hovered/active stage */}
        <div
          style={{
            marginTop: 22,
            background: C.bgAlt,
            border: `1px solid ${activeStage.color}44`,
            borderLeft: `3px solid ${activeStage.color}`,
            borderRadius: 12,
            padding: "14px 16px",
            display: "flex",
            gap: 14,
            alignItems: "flex-start",
            transition: "border-color 200ms",
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              background: activeStage.dim,
              display: "grid",
              placeItems: "center",
              flex: "0 0 auto",
            }}
          >
            <activeStage.icon size={18} color={activeStage.color} />
          </div>
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 9,
                marginBottom: 3,
              }}
            >
              <span style={{ fontWeight: 700, fontSize: 13.5 }}>
                {activeStage.label}
              </span>
              <span
                style={{ fontFamily: MONO, fontSize: 11, color: activeStage.color }}
              >
                {activeStage.sub}
              </span>
            </div>
            <p
              style={{
                margin: 0,
                fontSize: 12.8,
                lineHeight: 1.55,
                color: C.inkSoft,
              }}
            >
              {activeStage.detail}
            </p>
          </div>
        </div>
        <div
          style={{
            marginTop: 10,
            fontSize: 11.5,
            color: C.muted,
            textAlign: "center",
          }}
        >
          Hover any stage to inspect it · the loop re-arms after every reply
        </div>
      </section>

      {/* TWO-COLUMN: core+surfaces / permissions */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 22,
          marginBottom: 22,
        }}
      >
        {/* ONE CORE, MANY SURFACES */}
        <section
          style={{
            background: C.panel,
            border: `1px solid ${C.line}`,
            borderRadius: 18,
            padding: "22px 24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <Server size={18} color={C.pasta} />
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
              One core, many surfaces
            </h2>
          </div>
          <p style={{ margin: "0 0 18px", color: C.inkSoft, fontSize: 12.8, lineHeight: 1.5 }}>
            <code style={{ fontFamily: MONO, color: C.pasta }}>messages.py</code>{" "}
            is the only thing that touches <code style={{ fontFamily: MONO, color: C.inkSoft }}>chat.db</code>{" "}
            and AppleScript. Every surface calls it.
          </p>

          {/* surfaces feeding into core */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {SURFACES.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    background: C.bgAlt,
                    border: `1px solid ${C.lineSoft}`,
                    borderRadius: 11,
                    padding: "11px 13px",
                  }}
                >
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 9,
                      background: s.dim,
                      display: "grid",
                      placeItems: "center",
                      flex: "0 0 auto",
                    }}
                  >
                    <Icon size={17} color={s.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{s.label}</div>
                    <div style={{ fontFamily: MONO, fontSize: 10.5, color: C.muted }}>
                      {s.sub}
                    </div>
                  </div>
                  <ChevronRight size={16} color={C.muted} />
                </div>
              );
            })}

            {/* the core */}
            <div
              style={{
                marginTop: 4,
                display: "flex",
                alignItems: "center",
                gap: 12,
                background: `linear-gradient(90deg, ${C.pastaDim}, ${C.panelAlt})`,
                border: `1.5px solid ${C.pasta}66`,
                borderRadius: 11,
                padding: "13px 14px",
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: C.pasta,
                  display: "grid",
                  placeItems: "center",
                  flex: "0 0 auto",
                }}
              >
                <Cpu size={20} color="#0F1015" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 13.5, color: C.pasta }}>
                  messages.py
                </div>
                <div style={{ fontFamily: MONO, fontSize: 10.5, color: C.inkSoft }}>
                  the single core · chat.db + AppleScript
                </div>
              </div>
              <HardDrive size={18} color={C.pasta} />
            </div>
          </div>
        </section>

        {/* PERMISSION TIERS */}
        <section
          style={{
            background: C.panel,
            border: `1px solid ${C.line}`,
            borderRadius: 18,
            padding: "22px 24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <Lock size={18} color={C.rose} />
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
              Permission tiers
            </h2>
          </div>
          <p style={{ margin: "0 0 18px", color: C.inkSoft, fontSize: 12.8, lineHeight: 1.5 }}>
            Least-privilege by default. Every sender carries a capability tier;
            the listener only reads whitelisted senders.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {TIERS.map((t) => {
              const Icon = t.icon;
              return (
                <div
                  key={t.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    background: C.bgAlt,
                    border: `1px solid ${t.color}33`,
                    borderRadius: 11,
                    padding: "10px 13px",
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: t.dim,
                      display: "grid",
                      placeItems: "center",
                      flex: "0 0 auto",
                    }}
                  >
                    <Icon size={16} color={t.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 12.8, color: t.color }}>
                      {t.label}
                    </div>
                    <div style={{ fontSize: 11.5, color: C.inkSoft, lineHeight: 1.4 }}>
                      {t.can}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div
            style={{
              marginTop: 14,
              fontSize: 11.5,
              color: C.muted,
              lineHeight: 1.5,
              fontStyle: "italic",
            }}
          >
            Born from a real incident: a self-text filter leaked a family group
            chat. Default-deny became the posture.
          </div>
        </section>
      </div>

      {/* DEPLOYMENT MODES */}
      <section
        style={{
          background: C.panel,
          border: `1px solid ${C.line}`,
          borderRadius: 18,
          padding: "22px 24px 24px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Cpu size={18} color={C.blue} />
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
              Two deployment modes
            </h2>
          </div>
          <div
            style={{
              display: "flex",
              background: C.bgAlt,
              border: `1px solid ${C.line}`,
              borderRadius: 11,
              padding: 4,
              gap: 4,
            }}
          >
            {Object.values(MODES).map((m) => {
              const on = mode === m.id;
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 7,
                    background: on ? C.pasta : "transparent",
                    color: on ? "#0F1015" : C.inkSoft,
                    border: "none",
                    borderRadius: 8,
                    padding: "7px 13px",
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: MONO,
                  }}
                >
                  <Icon size={14} />
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 16,
            alignItems: "stretch",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              flex: "1 1 320px",
              background: C.bgAlt,
              border: `1px solid ${C.line}`,
              borderRadius: 13,
              padding: "16px 18px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 8 }}>
              <Chip color={C.pasta} bg={C.pastaDim}>
                {currentMode.tag}
              </Chip>
            </div>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: C.inkSoft }}>
              {currentMode.blurb}
            </p>
          </div>

          {/* the trigger visualized as a chat bubble */}
          <div
            style={{
              flex: "1 1 260px",
              background: C.bgAlt,
              border: `1px solid ${C.line}`,
              borderRadius: 13,
              padding: 16,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 10,
            }}
          >
            <div style={{ fontSize: 11, color: C.muted, fontFamily: MONO }}>
              how you talk to it
            </div>
            <div
              style={{
                alignSelf: "flex-end",
                maxWidth: "90%",
                background: C.blue,
                color: "#fff",
                borderRadius: "16px 16px 4px 16px",
                padding: "9px 13px",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {currentMode.trigger}
            </div>
            <div
              style={{
                alignSelf: "flex-start",
                maxWidth: "90%",
                background: C.panelAlt,
                color: C.ink,
                borderRadius: "16px 16px 16px 4px",
                padding: "9px 13px",
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span style={{ fontSize: 15 }}>🍝</span>
              on it — reading via <code style={{ fontFamily: MONO, color: C.pasta }}>messages.py</code>
            </div>
          </div>
        </div>
      </section>

      {/* THESIS FOOTER */}
      <div
        style={{
          marginTop: 24,
          display: "flex",
          alignItems: "center",
          gap: 14,
          flexWrap: "wrap",
          justifyContent: "center",
          color: C.inkSoft,
          fontSize: 13.5,
          textAlign: "center",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontWeight: 700,
            color: C.ink,
          }}
        >
          <Ear size={16} color={C.teal} /> Hands
        </span>
        <span style={{ color: C.muted }}>·</span>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontWeight: 700,
            color: C.ink,
          }}
        >
          <MessageSquare size={16} color={C.blue} /> Ears
        </span>
        <span style={{ color: C.muted }}>·</span>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontWeight: 700,
            color: C.ink,
          }}
        >
          <Brain size={16} color={C.pasta} /> Context
        </span>
        <span style={{ color: C.muted, maxWidth: 520, lineHeight: 1.5 }}>
          — the hard part of an agent isn't the model. Macaroni makes the world
          easier for the model to touch.
        </span>
      </div>
    </div>
  );
}
