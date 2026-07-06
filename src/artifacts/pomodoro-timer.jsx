import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Coffee, Brain } from "lucide-react";

/* ---------------------------------------------------------------
   TOKENS — shared "ledger" paper/ink aesthetic.
--------------------------------------------------------------- */
const C = {
  paper: "#F6F4EE",
  paperAlt: "#EEEBE0",
  panel: "#FCFBF7",
  ink: "#1C1A15",
  inkSoft: "#55503F",
  muted: "#928D77",
  rule: "#DBD5C2",
  ruleStrong: "#C7C0A8",
  accent: "#1F6F5C",
  accentSoft: "#E4EFE9",
  amber: "#A8762A",
  amberSoft: "#F8EFD9",
};

const FONT_MONO = "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
const FONT_SANS = "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif";

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

function fmt(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function PomodoroTimer() {
  const [workMin, setWorkMin] = useState(25);
  const [breakMin, setBreakMin] = useState(5);
  const [phase, setPhase] = useState("work"); // "work" | "break"
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);

  const phaseLen = (phase === "work" ? workMin : breakMin) * 60;

  // Keep remaining in sync with the length inputs while idle at phase start.
  const atPhaseStartRef = useRef(true);
  useEffect(() => {
    if (!running && atPhaseStartRef.current) {
      setRemaining((phase === "work" ? workMin : breakMin) * 60);
    }
  }, [workMin, breakMin, phase, running]);

  // The countdown interval. Only decrements; the phase boundary is handled
  // separately below so we never nest one state setter inside another's updater.
  // Cleaned up on unmount and whenever `running` flips.
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 0) return 0;
        atPhaseStartRef.current = false;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  // Phase boundary: when the countdown hits 0, decide the next phase and whether
  // a work session just completed, then call the setters at the top level.
  useEffect(() => {
    if (!running || remaining > 0) return;
    const workJustCompleted = phase === "work";
    atPhaseStartRef.current = true;
    setPhase(workJustCompleted ? "break" : "work");
    if (workJustCompleted) setSessions((s) => s + 1);
  }, [running, remaining, phase]);

  // When the phase changes (via boundary), load the new phase length.
  useEffect(() => {
    setRemaining((phase === "work" ? workMin : breakMin) * 60);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const toggle = () => {
    atPhaseStartRef.current = false;
    setRunning((r) => !r);
  };

  const reset = () => {
    setRunning(false);
    atPhaseStartRef.current = true;
    setRemaining(phaseLen);
  };

  const progress = phaseLen > 0 ? 1 - remaining / phaseLen : 0;

  // SVG ring geometry.
  const size = 240;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const ringColor = phase === "work" ? C.accent : C.amber;
  const ringSoft = phase === "work" ? C.accentSoft : C.amberSoft;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.paper,
        fontFamily: FONT_SANS,
        color: C.ink,
        padding: "40px 20px",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
      }}
    >
      <div style={{ width: "100%", maxWidth: "460px" }}>
        {/* Header */}
        <div
          style={{
            marginBottom: "22px",
            paddingBottom: "14px",
            borderBottom: `1px solid ${C.ruleStrong}`,
          }}
        >
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: "11px",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: C.muted,
            }}
          >
            Focus timer
          </div>
          <h1 style={{ margin: "4px 0 0", fontSize: "26px", fontWeight: 700, letterSpacing: "-0.01em" }}>
            Pomodoro
          </h1>
        </div>

        {/* Phase pill */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "18px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: ringSoft,
              color: ringColor,
              border: `1px solid ${ringColor}`,
              borderRadius: "999px",
              padding: "6px 16px",
              fontFamily: FONT_MONO,
              fontSize: "12px",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            {phase === "work" ? <Brain size={15} /> : <Coffee size={15} />}
            {phase === "work" ? "Work" : "Break"}
          </div>
        </div>

        {/* Ring + countdown */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "22px" }}>
          <div style={{ position: "relative", width: size, height: size }}>
            <svg width={size} height={size}>
              <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.rule} strokeWidth={stroke} />
              <circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={ringColor}
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={circ * (1 - progress)}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                style={{ transition: "stroke-dashoffset 0.9s linear" }}
              />
            </svg>
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={{ fontFamily: FONT_MONO, fontSize: "48px", fontWeight: 600, letterSpacing: "0.02em" }}>
                {fmt(remaining)}
              </div>
              <div style={{ fontFamily: FONT_MONO, fontSize: "11px", color: C.muted, letterSpacing: "0.08em" }}>
                {Math.round(progress * 100)}% complete
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginBottom: "24px" }}>
          <button
            onClick={toggle}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontFamily: FONT_MONO,
              fontSize: "13px",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              fontWeight: 600,
              color: "#fff",
              background: C.accent,
              border: "none",
              borderRadius: "6px",
              padding: "12px 24px",
              cursor: "pointer",
            }}
          >
            {running ? <Pause size={16} /> : <Play size={16} />}
            {running ? "Pause" : "Start"}
          </button>
          <button
            onClick={reset}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontFamily: FONT_MONO,
              fontSize: "13px",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              fontWeight: 600,
              color: C.inkSoft,
              background: C.panel,
              border: `1px solid ${C.ruleStrong}`,
              borderRadius: "6px",
              padding: "12px 20px",
              cursor: "pointer",
            }}
          >
            <RotateCcw size={16} /> Reset
          </button>
        </div>

        {/* Settings + sessions */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "10px",
          }}
        >
          <LengthInput
            label="Work (min)"
            value={workMin}
            onChange={(v) => setWorkMin(clamp(v, 1, 90))}
          />
          <LengthInput
            label="Break (min)"
            value={breakMin}
            onChange={(v) => setBreakMin(clamp(v, 1, 60))}
          />
          <div
            style={{
              background: C.panel,
              border: `1px solid ${C.rule}`,
              borderRadius: "6px",
              padding: "10px 14px",
            }}
          >
            <div
              style={{
                fontFamily: FONT_MONO,
                fontSize: "10px",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: C.muted,
              }}
            >
              Sessions
            </div>
            <div style={{ fontFamily: FONT_MONO, fontSize: "24px", fontWeight: 600, marginTop: "2px" }}>
              {sessions}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LengthInput({ label, value, onChange }) {
  return (
    <div
      style={{
        background: C.panel,
        border: `1px solid ${C.rule}`,
        borderRadius: "6px",
        padding: "10px 14px",
      }}
    >
      <div
        style={{
          fontFamily: FONT_MONO,
          fontSize: "10px",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: C.muted,
        }}
      >
        {label}
      </div>
      <input
        type="number"
        min={1}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value || "0", 10))}
        style={{
          width: "100%",
          fontFamily: FONT_MONO,
          fontSize: "24px",
          fontWeight: 600,
          color: C.ink,
          background: "transparent",
          border: "none",
          padding: "2px 0 0",
          outline: "none",
        }}
      />
    </div>
  );
}
