import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Anchor,
  Bell,
  Bolt,
  Cloud,
  Compass,
  Crown,
  Feather,
  Flame,
  Gem,
  Ghost,
  Heart,
  Leaf,
  Moon,
  Rocket,
  Star,
  Sun,
  RotateCcw,
  Trophy,
  Sparkles,
} from "lucide-react";

/* ---------------------------------------------------------------
   TOKENS — same "ledger" paper/ink aesthetic as the comparator.
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
  danger: "#A5432E",
  dangerSoft: "#F5E5DE",
};

const FONT_MONO = "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
const FONT_SANS = "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif";

/* Eight symbols → eight pairs → a 4x4 board. */
const SYMBOLS = [
  { key: "anchor", Icon: Anchor },
  { key: "bell", Icon: Bell },
  { key: "bolt", Icon: Bolt },
  { key: "cloud", Icon: Cloud },
  { key: "compass", Icon: Compass },
  { key: "crown", Icon: Crown },
  { key: "feather", Icon: Feather },
  { key: "flame", Icon: Flame },
  { key: "gem", Icon: Gem },
  { key: "ghost", Icon: Ghost },
  { key: "heart", Icon: Heart },
  { key: "leaf", Icon: Leaf },
  { key: "moon", Icon: Moon },
  { key: "rocket", Icon: Rocket },
  { key: "star", Icon: Star },
  { key: "sun", Icon: Sun },
];

const PAIR_COUNT = 8;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildDeck() {
  const chosen = shuffle(SYMBOLS).slice(0, PAIR_COUNT);
  const cards = chosen.flatMap((s, pairIndex) =>
    [0, 1].map((half) => ({
      id: `${s.key}-${half}`,
      pairId: pairIndex,
      key: s.key,
      Icon: s.Icon,
    }))
  );
  return shuffle(cards);
}

export default function MemoryMatchGame() {
  const [deck, setDeck] = useState(() => buildDeck());
  const [flipped, setFlipped] = useState([]); // indices currently face-up under comparison
  const [matched, setMatched] = useState(() => new Set()); // matched pairIds
  const [moves, setMoves] = useState(0);
  const [locked, setLocked] = useState(false); // true while a mismatched pair is on screen

  const matchedPairs = matched.size;
  const won = matchedPairs === PAIR_COUNT;

  const newGame = useCallback(() => {
    setDeck(buildDeck());
    setFlipped([]);
    setMatched(new Set());
    setMoves(0);
    setLocked(false);
  }, []);

  const handleFlip = (index) => {
    if (locked || won) return;
    if (flipped.includes(index)) return;
    if (matched.has(deck[index].pairId)) return;
    if (flipped.length >= 2) return;

    const next = [...flipped, index];
    setFlipped(next);

    if (next.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = next;
      if (deck[a].pairId === deck[b].pairId) {
        // Match — keep face-up, clear comparison immediately.
        setMatched((prev) => {
          const s = new Set(prev);
          s.add(deck[a].pairId);
          return s;
        });
        setFlipped([]);
      } else {
        // Mismatch — lock the board, flip back after a short delay.
        setLocked(true);
      }
    }
  };

  useEffect(() => {
    if (!locked) return;
    const t = setTimeout(() => {
      setFlipped([]);
      setLocked(false);
    }, 850);
    return () => clearTimeout(t);
  }, [locked]);

  const isFaceUp = (index) =>
    flipped.includes(index) || matched.has(deck[index].pairId);

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
      <div style={{ width: "100%", maxWidth: "560px" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginBottom: "18px",
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
              Concentration
            </div>
            <h1 style={{ margin: "4px 0 0", fontSize: "26px", fontWeight: 700, letterSpacing: "-0.01em" }}>
              Memory Match
            </h1>
          </div>
          <button
            onClick={newGame}
            style={{
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
            }}
          >
            <RotateCcw size={14} /> New game
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "18px" }}>
          <Stat label="Moves" value={moves} />
          <Stat label="Matched" value={`${matchedPairs} / ${PAIR_COUNT}`} />
        </div>

        {/* Win banner */}
        {won && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: C.accentSoft,
              border: `1px solid ${C.accent}`,
              borderRadius: "6px",
              padding: "14px 16px",
              marginBottom: "18px",
            }}
          >
            <Trophy size={20} color={C.accent} />
            <div>
              <div style={{ fontWeight: 700, color: C.accent }}>You matched every pair!</div>
              <div style={{ fontSize: "13px", color: C.inkSoft }}>
                Solved in {moves} move{moves !== 1 ? "s" : ""}. Click “New game” to reshuffle.
              </div>
            </div>
          </div>
        )}

        {/* Board */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "12px",
          }}
        >
          {deck.map((card, index) => {
            const faceUp = isFaceUp(index);
            const isMatched = matched.has(card.pairId);
            const { Icon } = card;
            return (
              <button
                key={card.id}
                onClick={() => handleFlip(index)}
                aria-label={faceUp ? card.key : "hidden card"}
                style={{
                  aspectRatio: "3 / 4",
                  border: `1px solid ${faceUp ? (isMatched ? C.accent : C.ruleStrong) : C.rule}`,
                  borderRadius: "8px",
                  background: faceUp ? (isMatched ? C.accentSoft : C.panel) : C.paperAlt,
                  cursor: locked || won || faceUp ? "default" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background 0.15s, border-color 0.15s",
                  padding: 0,
                }}
              >
                {faceUp ? (
                  <Icon size={30} color={isMatched ? C.accent : C.ink} strokeWidth={1.75} />
                ) : (
                  <Sparkles size={22} color={C.muted} strokeWidth={1.5} />
                )}
              </button>
            );
          })}
        </div>

        <p
          style={{
            fontFamily: FONT_MONO,
            fontSize: "11px",
            color: C.muted,
            textAlign: "center",
            marginTop: "20px",
          }}
        >
          Flip two cards to find a matching pair.
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div
      style={{
        flex: 1,
        background: C.panel,
        border: `1px solid ${C.rule}`,
        borderRadius: "6px",
        padding: "12px 16px",
      }}
    >
      <div
        style={{
          fontFamily: FONT_MONO,
          fontSize: "10px",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: C.muted,
        }}
      >
        {label}
      </div>
      <div style={{ fontFamily: FONT_MONO, fontSize: "22px", fontWeight: 600, marginTop: "2px" }}>
        {value}
      </div>
    </div>
  );
}
