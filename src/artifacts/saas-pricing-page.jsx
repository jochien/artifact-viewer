import React, { useState } from "react";
import { Check, Minus, Zap, Star, Building2 } from "lucide-react";

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
};

const FONT_MONO = "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
const FONT_SANS = "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif";

/* monthly price; annual = 10 months (2 free) → the shown per-month annual rate. */
const ANNUAL_MONTHS = 10;

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    Icon: Zap,
    monthly: 12,
    blurb: "For individuals getting off the ground.",
    popular: false,
    cta: "Start free",
    features: [
      { text: "1 project", included: true },
      { text: "Up to 3 collaborators", included: true },
      { text: "5 GB storage", included: true },
      { text: "Community support", included: true },
      { text: "Advanced analytics", included: false },
      { text: "SSO & audit logs", included: false },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    Icon: Star,
    monthly: 29,
    blurb: "For growing teams that ship often.",
    popular: true,
    cta: "Start 14-day trial",
    features: [
      { text: "Unlimited projects", included: true },
      { text: "Up to 20 collaborators", included: true },
      { text: "100 GB storage", included: true },
      { text: "Priority email support", included: true },
      { text: "Advanced analytics", included: true },
      { text: "SSO & audit logs", included: false },
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    Icon: Building2,
    monthly: 79,
    blurb: "For organizations that need control.",
    popular: false,
    cta: "Contact sales",
    features: [
      { text: "Unlimited projects", included: true },
      { text: "Unlimited collaborators", included: true },
      { text: "1 TB storage", included: true },
      { text: "Dedicated support & SLA", included: true },
      { text: "Advanced analytics", included: true },
      { text: "SSO & audit logs", included: true },
    ],
  },
];

export default function SaasPricingPage() {
  const [annual, setAnnual] = useState(false);

  const perMonth = (plan) =>
    annual ? Math.round((plan.monthly * ANNUAL_MONTHS) / 12) : plan.monthly;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.paper,
        fontFamily: FONT_SANS,
        color: C.ink,
        padding: "48px 20px",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
      }}
    >
      <div style={{ width: "100%", maxWidth: "960px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: "11px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: C.muted,
            }}
          >
            Pricing
          </div>
          <h1 style={{ margin: "8px 0 6px", fontSize: "32px", fontWeight: 700, letterSpacing: "-0.02em" }}>
            Plans that scale with you
          </h1>
          <p style={{ margin: 0, fontSize: "16px", color: C.inkSoft }}>
            Simple, transparent pricing. Switch or cancel anytime.
          </p>
        </div>

        {/* Billing toggle */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "36px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              background: C.panel,
              border: `1px solid ${C.ruleStrong}`,
              borderRadius: "999px",
              padding: "4px",
            }}
          >
            {[
              { key: false, label: "Monthly" },
              { key: true, label: "Annual" },
            ].map((opt) => (
              <button
                key={String(opt.key)}
                onClick={() => setAnnual(opt.key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontFamily: FONT_MONO,
                  fontSize: "12px",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                  border: "none",
                  borderRadius: "999px",
                  padding: "9px 18px",
                  cursor: "pointer",
                  background: annual === opt.key ? C.accent : "transparent",
                  color: annual === opt.key ? "#fff" : C.inkSoft,
                }}
              >
                {opt.label}
                {opt.key && (
                  <span
                    style={{
                      fontSize: "10px",
                      background: annual ? "rgba(255,255,255,0.22)" : C.accentSoft,
                      color: annual ? "#fff" : C.accent,
                      borderRadius: "999px",
                      padding: "2px 7px",
                    }}
                  >
                    Save 2 months
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Plan cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "20px",
            alignItems: "stretch",
          }}
        >
          {PLANS.map((plan) => {
            const { Icon } = plan;
            const highlighted = plan.popular;
            const monthlyEquivalent = perMonth(plan);
            const annualTotal = plan.monthly * ANNUAL_MONTHS;
            const annualSavings = plan.monthly * 12 - annualTotal;
            return (
              <div
                key={plan.id}
                style={{
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  background: C.panel,
                  border: `1px solid ${highlighted ? C.accent : C.rule}`,
                  boxShadow: highlighted ? `0 0 0 1px ${C.accent}` : "none",
                  borderRadius: "10px",
                  padding: "26px 24px",
                }}
              >
                {highlighted && (
                  <div
                    style={{
                      position: "absolute",
                      top: "-11px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      background: C.accent,
                      color: "#fff",
                      fontFamily: FONT_MONO,
                      fontSize: "10px",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      fontWeight: 600,
                      padding: "4px 12px",
                      borderRadius: "999px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Most popular
                  </div>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: "9px", marginBottom: "10px" }}>
                  <Icon size={20} color={highlighted ? C.accent : C.inkSoft} />
                  <span style={{ fontSize: "18px", fontWeight: 700 }}>{plan.name}</span>
                </div>
                <p style={{ margin: "0 0 18px", fontSize: "13px", color: C.inkSoft, minHeight: "36px" }}>
                  {plan.blurb}
                </p>

                <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                  <span style={{ fontFamily: FONT_MONO, fontSize: "42px", fontWeight: 700, letterSpacing: "-0.02em" }}>
                    ${monthlyEquivalent}
                  </span>
                  <span style={{ fontFamily: FONT_MONO, fontSize: "13px", color: C.muted }}>/mo</span>
                </div>
                <div style={{ fontFamily: FONT_MONO, fontSize: "11px", color: C.muted, marginTop: "4px", minHeight: "16px" }}>
                  {annual
                    ? `$${annualTotal}/yr billed annually · save $${annualSavings}`
                    : "billed monthly"}
                </div>

                <button
                  style={{
                    marginTop: "20px",
                    fontFamily: FONT_MONO,
                    fontSize: "12px",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    fontWeight: 600,
                    borderRadius: "6px",
                    padding: "12px",
                    cursor: "pointer",
                    border: highlighted ? "none" : `1px solid ${C.ruleStrong}`,
                    background: highlighted ? C.accent : "transparent",
                    color: highlighted ? "#fff" : C.ink,
                  }}
                >
                  {plan.cta}
                </button>

                <div style={{ height: "1px", background: C.rule, margin: "22px 0 18px" }} />

                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "11px" }}>
                  {plan.features.map((f) => (
                    <li key={f.text} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      {f.included ? (
                        <Check size={16} color={C.accent} style={{ flexShrink: 0 }} />
                      ) : (
                        <Minus size={16} color={C.muted} style={{ flexShrink: 0 }} />
                      )}
                      <span style={{ fontSize: "13.5px", color: f.included ? C.ink : C.muted }}>
                        {f.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
