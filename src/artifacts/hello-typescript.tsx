import React, { useState } from "react";
import { Sparkles, Check } from "lucide-react";

export const meta = {
  title: "Hello TypeScript",
  description:
    "A tiny typed .tsx artifact — proof the viewer discovers and renders TypeScript components, not just .jsx.",
  tags: ["typescript", "demo"],
};

type Swatch = { name: string; hex: string; ink: string };

const SWATCHES: Swatch[] = [
  { name: "Iris", hex: "#6C5CE7", ink: "#ffffff" },
  { name: "Mint", hex: "#00B894", ink: "#04231b" },
  { name: "Coral", hex: "#FF7675", ink: "#3a0f0e" },
  { name: "Sky", hex: "#0984E3", ink: "#ffffff" },
];

const FONT =
  "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

export default function HelloTypeScript() {
  const [index, setIndex] = useState<number>(0);
  const active: Swatch = SWATCHES[index % SWATCHES.length];

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 32,
        boxSizing: "border-box",
        background: `radial-gradient(900px 500px at 50% -10%, ${active.hex}33, #0e1016 60%)`,
        color: "#eef1f8",
        fontFamily: FONT,
        transition: "background 400ms ease",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#161922",
          border: "1px solid #2a2f3d",
          borderRadius: 20,
          padding: "26px 26px 28px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 18 }}>
          <Sparkles size={18} color={active.hex} />
          <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: -0.3 }}>
            Hello, TypeScript
          </span>
          <span
            style={{
              marginLeft: "auto",
              fontFamily: MONO,
              fontSize: 11,
              color: "#8b93a7",
              border: "1px solid #2a2f3d",
              borderRadius: 6,
              padding: "2px 7px",
            }}
          >
            .tsx
          </span>
        </div>

        <div
          style={{
            height: 120,
            borderRadius: 14,
            background: active.hex,
            color: active.ink,
            display: "grid",
            placeItems: "center",
            fontWeight: 800,
            fontSize: 22,
            letterSpacing: 0.3,
            transition: "background 300ms ease, color 300ms ease",
          }}
        >
          {active.name}
        </div>

        <div style={{ display: "flex", gap: 6, margin: "14px 0 18px" }}>
          {SWATCHES.map((s, i) => (
            <div
              key={s.name}
              title={s.name}
              style={{
                flex: 1,
                height: 8,
                borderRadius: 4,
                background: s.hex,
                opacity: i === index % SWATCHES.length ? 1 : 0.4,
                transition: "opacity 200ms",
              }}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => setIndex((n: number) => n + 1)}
          style={{
            width: "100%",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "11px 14px",
            fontSize: 14,
            fontWeight: 700,
            fontFamily: FONT,
            color: active.ink,
            background: active.hex,
            border: "none",
            borderRadius: 11,
            cursor: "pointer",
          }}
        >
          Next colour
        </button>

        <div
          style={{
            marginTop: 16,
            display: "flex",
            alignItems: "flex-start",
            gap: 8,
            fontSize: 12.5,
            lineHeight: 1.5,
            color: "#aab2c5",
          }}
        >
          <Check size={14} color={active.hex} style={{ marginTop: 1, flexShrink: 0 }} />
          <span>
            This component is written in TypeScript with typed state and a{" "}
            <code style={{ fontFamily: MONO, color: "#cdd4e4" }}>Swatch</code> type.
            If you can read this, the viewer discovered and rendered a{" "}
            <code style={{ fontFamily: MONO, color: "#cdd4e4" }}>.tsx</code> file.
          </span>
        </div>
      </div>
    </div>
  );
}
