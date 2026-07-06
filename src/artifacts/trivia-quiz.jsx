import React, { useState, useMemo } from "react";
import { Check, X, Trophy, RotateCcw, HelpCircle } from "lucide-react";

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
  danger: "#A5432E",
  dangerSoft: "#F5E5DE",
};

const FONT_MONO = "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
const FONT_SANS = "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif";

/* Each question stores the correct answer text so shuffling options is safe. */
const QUESTIONS = [
  {
    q: "Which planet is the smallest in our solar system?",
    options: ["Mars", "Mercury", "Venus", "Pluto"],
    answer: "Mercury",
  },
  {
    q: "What is the chemical symbol for gold?",
    options: ["Gd", "Go", "Au", "Ag"],
    answer: "Au",
  },
  {
    q: "Who wrote the play 'Romeo and Juliet'?",
    options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
    answer: "William Shakespeare",
  },
  {
    q: "In computing, what does 'HTTP' stand for?",
    options: [
      "HyperText Transfer Protocol",
      "HighText Transmission Process",
      "Hyperlink Transfer Path",
      "Host Terminal Transfer Protocol",
    ],
    answer: "HyperText Transfer Protocol",
  },
  {
    q: "Which ocean is the largest by surface area?",
    options: ["Atlantic", "Indian", "Arctic", "Pacific"],
    answer: "Pacific",
  },
  {
    q: "How many bits are in one byte?",
    options: ["4", "8", "16", "32"],
    answer: "8",
  },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* Build one attempt: shuffled question order, shuffled options each. */
function buildAttempt() {
  return shuffle(QUESTIONS).map((item) => ({
    ...item,
    options: shuffle(item.options),
  }));
}

export default function TriviaQuiz() {
  const [deck, setDeck] = useState(() => buildAttempt());
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null); // selected option text for current question
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const total = deck.length;
  const current = deck[index];
  const answered = selected !== null;
  const isCorrect = answered && selected === current.answer;

  const choose = (option) => {
    if (answered) return;
    setSelected(option);
    if (option === current.answer) setScore((s) => s + 1);
  };

  const next = () => {
    if (index + 1 >= total) {
      setFinished(true);
    } else {
      setIndex((i) => i + 1);
      setSelected(null);
    }
  };

  const restart = () => {
    setDeck(buildAttempt());
    setIndex(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
  };

  const progress = ((index + (answered ? 1 : 0)) / total) * 100;

  const resultMessage = useMemo(() => {
    const pct = score / total;
    if (pct === 1) return "Flawless. You know your stuff.";
    if (pct >= 0.7) return "Strong run — just a couple slipped by.";
    if (pct >= 0.4) return "Not bad. A little review and you've got it.";
    return "Rough round. Give it another go!";
  }, [score, total]);

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
            marginBottom: "20px",
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
            Trivia
          </div>
          <h1 style={{ margin: "4px 0 0", fontSize: "26px", fontWeight: 700, letterSpacing: "-0.01em" }}>
            Quick Quiz
          </h1>
        </div>

        {finished ? (
          <div
            style={{
              background: C.panel,
              border: `1px solid ${C.rule}`,
              borderRadius: "8px",
              padding: "36px 28px",
              textAlign: "center",
            }}
          >
            <Trophy size={40} color={C.accent} style={{ marginBottom: "12px" }} />
            <div style={{ fontFamily: FONT_MONO, fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase", color: C.muted }}>
              Your score
            </div>
            <div style={{ fontFamily: FONT_MONO, fontSize: "52px", fontWeight: 700, margin: "4px 0" }}>
              {score} / {total}
            </div>
            <p style={{ fontSize: "15px", color: C.inkSoft, margin: "8px 0 24px" }}>{resultMessage}</p>
            <button onClick={restart} style={btnPrimary}>
              <RotateCcw size={16} /> Restart
            </button>
          </div>
        ) : (
          <>
            {/* Progress */}
            <div style={{ marginBottom: "16px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontFamily: FONT_MONO,
                  fontSize: "12px",
                  color: C.muted,
                  marginBottom: "6px",
                }}
              >
                <span>Question {index + 1} of {total}</span>
                <span>Score {score}</span>
              </div>
              <div style={{ height: "6px", background: C.rule, borderRadius: "999px", overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${progress}%`,
                    background: C.accent,
                    borderRadius: "999px",
                    transition: "width 0.25s",
                  }}
                />
              </div>
            </div>

            {/* Question */}
            <div
              style={{
                background: C.panel,
                border: `1px solid ${C.rule}`,
                borderRadius: "8px",
                padding: "24px",
              }}
            >
              <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
                <HelpCircle size={20} color={C.accent} style={{ flexShrink: 0, marginTop: "2px" }} />
                <h2 style={{ margin: 0, fontSize: "19px", fontWeight: 600, lineHeight: 1.4 }}>{current.q}</h2>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {current.options.map((option) => {
                  const isThis = selected === option;
                  const isAnswer = option === current.answer;
                  let border = C.rule;
                  let bg = C.paper;
                  let fg = C.ink;
                  if (answered) {
                    if (isAnswer) {
                      border = C.accent;
                      bg = C.accentSoft;
                      fg = C.accent;
                    } else if (isThis) {
                      border = C.danger;
                      bg = C.dangerSoft;
                      fg = C.danger;
                    }
                  }
                  return (
                    <button
                      key={option}
                      onClick={() => choose(option)}
                      disabled={answered}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "10px",
                        textAlign: "left",
                        fontFamily: FONT_SANS,
                        fontSize: "15px",
                        color: fg,
                        background: bg,
                        border: `1px solid ${border}`,
                        borderRadius: "6px",
                        padding: "13px 16px",
                        cursor: answered ? "default" : "pointer",
                        fontWeight: answered && isAnswer ? 600 : 400,
                      }}
                    >
                      <span>{option}</span>
                      {answered && isAnswer && <Check size={17} color={C.accent} />}
                      {answered && isThis && !isAnswer && <X size={17} color={C.danger} />}
                    </button>
                  );
                })}
              </div>

              {/* Feedback + next */}
              {answered && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: "20px",
                    paddingTop: "16px",
                    borderTop: `1px solid ${C.rule}`,
                  }}
                >
                  <span
                    style={{
                      fontFamily: FONT_MONO,
                      fontSize: "12px",
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      fontWeight: 600,
                      color: isCorrect ? C.accent : C.danger,
                    }}
                  >
                    {isCorrect ? "Correct" : `Incorrect — ${current.answer}`}
                  </span>
                  <button onClick={next} style={btnPrimary}>
                    {index + 1 >= total ? "See results" : "Next question"}
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const btnPrimary = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  fontFamily: FONT_MONO,
  fontSize: "12px",
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  fontWeight: 600,
  color: "#fff",
  background: C.accent,
  border: "none",
  borderRadius: "6px",
  padding: "11px 18px",
  cursor: "pointer",
};
