import React, { useState, useMemo, useRef } from "react";
import { Shuffle, Download, Palette, Hash, Circle } from "lucide-react";

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
};

const FONT_MONO = "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
const FONT_SANS = "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif";

const CANVAS = 480;

/* Small deterministic PRNG — mulberry32. Same seed → same stream. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PALETTES = {
  Ember: [12, 28, 44, 4],
  Ocean: [200, 190, 215, 175],
  Forest: [140, 100, 160, 85],
  Orchid: [300, 320, 280, 260],
  Mono: [null, null, null, null], // grayscale
};

function hsl(h, s, l, a = 1) {
  if (h === null) return `hsla(0, 0%, ${l}%, ${a})`;
  return `hsla(${h}, ${s}%, ${l}%, ${a})`;
}

/* Build the list of shapes deterministically from seed + params. */
function buildShapes({ seed, count, paletteName, baseHue }) {
  const rand = mulberry32(seed);
  const palette = PALETTES[paletteName];
  const isMono = paletteName === "Mono";
  const shapes = [];
  for (let i = 0; i < count; i++) {
    const cx = rand() * CANVAS;
    const cy = rand() * CANVAS;
    const radius = 12 + rand() * (CANVAS * 0.22);
    const paletteHue = palette[Math.floor(rand() * palette.length)];
    const hue = isMono ? null : (paletteHue + baseHue) % 360;
    const sat = isMono ? 0 : 55 + Math.floor(rand() * 30);
    const light = 40 + Math.floor(rand() * 40);
    const alpha = 0.28 + rand() * 0.5;
    const kind = rand() > 0.5 ? "circle" : "rect";
    const rot = Math.floor(rand() * 90);
    shapes.push({ i, cx, cy, radius, hue, sat, light, alpha, kind, rot });
  }
  return shapes;
}

function renderShapes(shapes) {
  return shapes.map((s) => {
    const fill = hsl(s.hue, s.sat, s.light, s.alpha);
    if (s.kind === "circle") {
      return <circle key={s.i} cx={s.cx.toFixed(1)} cy={s.cy.toFixed(1)} r={s.radius.toFixed(1)} fill={fill} />;
    }
    const size = s.radius * 1.4;
    return (
      <rect
        key={s.i}
        x={(s.cx - size / 2).toFixed(1)}
        y={(s.cy - size / 2).toFixed(1)}
        width={size.toFixed(1)}
        height={size.toFixed(1)}
        fill={fill}
        transform={`rotate(${s.rot} ${s.cx.toFixed(1)} ${s.cy.toFixed(1)})`}
      />
    );
  });
}

export default function GenerativeArtStudio() {
  const [seed, setSeed] = useState(1337);
  const [count, setCount] = useState(28);
  const [paletteName, setPaletteName] = useState("Ocean");
  const [baseHue, setBaseHue] = useState(0);

  const bgColor = paletteName === "Mono" ? "#141414" : "#0E1A22";

  const shapes = useMemo(
    () => buildShapes({ seed, count, paletteName, baseHue }),
    [seed, count, paletteName, baseHue]
  );

  const randomize = () => setSeed(Math.floor(Math.random() * 1_000_000));

  /* Serialize the current SVG and trigger a Blob download. */
  const downloadSvg = () => {
    const inner = shapes
      .map((s) => {
        const fill = hsl(s.hue, s.sat, s.light, s.alpha);
        if (s.kind === "circle") {
          return `<circle cx="${s.cx.toFixed(1)}" cy="${s.cy.toFixed(1)}" r="${s.radius.toFixed(1)}" fill="${fill}"/>`;
        }
        const size = s.radius * 1.4;
        return `<rect x="${(s.cx - size / 2).toFixed(1)}" y="${(s.cy - size / 2).toFixed(1)}" width="${size.toFixed(1)}" height="${size.toFixed(1)}" fill="${fill}" transform="rotate(${s.rot} ${s.cx.toFixed(1)} ${s.cy.toFixed(1)})"/>`;
      })
      .join("");
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS}" height="${CANVAS}" viewBox="0 0 ${CANVAS} ${CANVAS}">` +
      `<rect width="${CANVAS}" height="${CANVAS}" fill="${bgColor}"/>` +
      inner +
      `</svg>`;
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `generative-art-seed-${seed}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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
      <div style={{ width: "100%", maxWidth: "820px" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginBottom: "20px",
            paddingBottom: "14px",
            borderBottom: `1px solid ${C.ruleStrong}`,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: FONT_MONO,
                fontSize: "11px",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: C.muted,
              }}
            >
              Parametric SVG
            </div>
            <h1 style={{ margin: "4px 0 0", fontSize: "26px", fontWeight: 700, letterSpacing: "-0.01em" }}>
              Generative Art Studio
            </h1>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={randomize} style={btnPrimary}>
              <Shuffle size={15} /> Randomize
            </button>
            <button onClick={downloadSvg} style={btnGhost}>
              <Download size={15} /> Download SVG
            </button>
          </div>
        </div>

        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
          {/* Canvas */}
          <div
            style={{
              flex: "1 1 420px",
              minWidth: "300px",
              border: `1px solid ${C.ruleStrong}`,
              borderRadius: "8px",
              overflow: "hidden",
              background: C.panel,
            }}
          >
            <svg
              viewBox={`0 0 ${CANVAS} ${CANVAS}`}
              width="100%"
              style={{ display: "block", aspectRatio: "1 / 1" }}
            >
              <rect width={CANVAS} height={CANVAS} fill={bgColor} />
              {renderShapes(shapes)}
            </svg>
          </div>

          {/* Controls */}
          <div style={{ flex: "1 1 240px", minWidth: "240px", display: "flex", flexDirection: "column", gap: "14px" }}>
            <Control icon={<Hash size={13} />} label="Seed">
              <input
                type="number"
                value={seed}
                onChange={(e) => setSeed(parseInt(e.target.value || "0", 10) >>> 0)}
                style={numInput}
              />
              <div style={{ fontFamily: FONT_MONO, fontSize: "10px", color: C.muted, marginTop: "4px" }}>
                Same seed reproduces the same art.
              </div>
            </Control>

            <Control icon={<Circle size={13} />} label={`Shape count — ${count}`}>
              <input
                type="range"
                min={4}
                max={80}
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value, 10))}
                style={{ width: "100%", accentColor: C.accent }}
              />
            </Control>

            <Control icon={<Palette size={13} />} label="Palette">
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {Object.keys(PALETTES).map((name) => (
                  <button
                    key={name}
                    onClick={() => setPaletteName(name)}
                    style={{
                      fontFamily: FONT_MONO,
                      fontSize: "11px",
                      padding: "6px 10px",
                      borderRadius: "4px",
                      cursor: "pointer",
                      border: `1px solid ${paletteName === name ? C.accent : C.rule}`,
                      background: paletteName === name ? C.accentSoft : C.panel,
                      color: paletteName === name ? C.accent : C.inkSoft,
                      fontWeight: paletteName === name ? 600 : 400,
                    }}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </Control>

            <Control icon={<Palette size={13} />} label={`Hue shift — ${baseHue}°`}>
              <input
                type="range"
                min={0}
                max={359}
                value={baseHue}
                onChange={(e) => setBaseHue(parseInt(e.target.value, 10))}
                style={{ width: "100%", accentColor: C.accent }}
                disabled={paletteName === "Mono"}
              />
              {paletteName === "Mono" && (
                <div style={{ fontFamily: FONT_MONO, fontSize: "10px", color: C.muted, marginTop: "4px" }}>
                  Hue disabled for the Mono palette.
                </div>
              )}
            </Control>
          </div>
        </div>
      </div>
    </div>
  );
}

const btnPrimary = {
  display: "flex",
  alignItems: "center",
  gap: "7px",
  fontFamily: FONT_MONO,
  fontSize: "11px",
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  fontWeight: 600,
  color: "#fff",
  background: C.accent,
  border: "none",
  borderRadius: "4px",
  padding: "9px 14px",
  cursor: "pointer",
};

const btnGhost = {
  ...btnPrimary,
  color: C.inkSoft,
  background: C.panel,
  border: `1px solid ${C.ruleStrong}`,
};

const numInput = {
  width: "100%",
  fontFamily: FONT_MONO,
  fontSize: "18px",
  fontWeight: 600,
  color: C.ink,
  background: C.panel,
  border: `1px solid ${C.rule}`,
  borderRadius: "4px",
  padding: "8px 10px",
  outline: "none",
};

function Control({ icon, label, children }) {
  return (
    <div
      style={{
        background: C.panel,
        border: `1px solid ${C.rule}`,
        borderRadius: "6px",
        padding: "12px 14px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          fontFamily: FONT_MONO,
          fontSize: "10px",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: C.muted,
          marginBottom: "8px",
        }}
      >
        {icon}
        {label}
      </div>
      {children}
    </div>
  );
}
