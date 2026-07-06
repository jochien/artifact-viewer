import React, { useState, useMemo } from "react";
import {
  Smartphone,
  Laptop,
  Cpu,
  Headphones,
  Speaker,
  Plus,
  Trash2,
  ChevronDown,
  Info,
} from "lucide-react";

/* ---------------------------------------------------------------
   TOKENS — "ledger" aesthetic: paper, ink, hairline rules, tabular
   mono figures. No gradients, no shadows.
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

const DEVICE_TYPES = [
  "iPhone 17 Pro Max",
  "iPhone 14 Pro Max",
  "Mac",
  "Mac mini",
  "AirPods Pro",
  "HomePod",
];

const ICONS = {
  "iPhone 17 Pro Max": Smartphone,
  "iPhone 14 Pro Max": Smartphone,
  Mac: Laptop,
  "Mac mini": Cpu,
  "AirPods Pro": Headphones,
  HomePod: Speaker,
};

const isPhone = (type) => type.startsWith("iPhone");

const APPLECARE_PLUS = {
  "iPhone 17 Pro Max": { price: 13.99, ded: "$99 damage / $149 theft-loss" },
  "iPhone 14 Pro Max": { price: 11.99, ded: "$99 damage / $149 theft-loss" },
  Mac: { price: 9.99, ded: "$99 screen or enclosure / $299 other" },
  "Mac mini": { price: 6.99, ded: "$99 screen or enclosure / $299 other" },
  "AirPods Pro": { price: 1.29, ded: "$29 flat" },
  HomePod: { price: 2.99, ded: "$39 flat" },
};

const TMOBILE_PHONE = {
  "iPhone 17 Pro Max": 25,
  "iPhone 14 Pro Max": 18,
};

let idCounter = 0;
const nextId = () => `d${idCounter++}`;

const PRELOAD = () => [
  ...[1, 2, 3, 4].map((n) => ({
    id: nextId(),
    type: "iPhone 17 Pro Max",
    owner: `Owner ${n}`,
    condition: "New purchase",
  })),
  ...[1, 2, 3, 4].map((n) => ({
    id: nextId(),
    type: "iPhone 14 Pro Max",
    owner: `Owner ${n}`,
    condition: "Already owned",
  })),
  ...Array.from({ length: 2 }, () => ({
    id: nextId(),
    type: "Mac",
    owner: "Household",
    condition: "Already owned",
  })),
  {
    id: nextId(),
    type: "Mac mini",
    owner: "Household",
    condition: "Already owned",
  },
  ...Array.from({ length: 3 }, () => ({
    id: nextId(),
    type: "AirPods Pro",
    owner: "Household",
    condition: "Already owned",
  })),
  ...Array.from({ length: 2 }, () => ({
    id: nextId(),
    type: "HomePod",
    owner: "Household",
    condition: "Already owned",
  })),
];

const money = (n) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

function groupByOwner(devices) {
  const map = new Map();
  devices.forEach((d) => {
    const key = d.owner.trim() || "Unassigned";
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(d);
  });
  return map;
}

/* ---------------------------------------------------------------
   PLAN CALCULATORS
--------------------------------------------------------------- */
function calcAppleCarePlus(devices) {
  const lines = devices.map((d) => {
    const eligible = d.condition === "New purchase";
    const rate = APPLECARE_PLUS[d.type];
    return {
      device: d,
      eligible,
      monthly: eligible ? rate.price : 0,
      note: eligible ? rate.ded : "Not eligible — outside 60-day purchase window",
    };
  });
  const monthly = lines.reduce((s, l) => s + l.monthly, 0);
  return { monthly, annual: monthly * 12, lines };
}

function calcAppleCareOne(devices) {
  const groups = groupByOwner(devices);
  const rows = [];
  let monthly = 0;
  groups.forEach((list, owner) => {
    const count = list.length;
    const cost = count <= 3 ? 19.99 : 19.99 + (count - 3) * 5.99;
    monthly += cost;
    rows.push({ owner, count, cost, devices: list });
  });
  return { monthly, annual: monthly * 12, rows };
}

function calcTMobile(devices) {
  const phones = devices.filter((d) => isPhone(d.type));
  const others = devices.filter((d) => !isPhone(d.type));
  const phoneLines = phones.map((d) => ({ device: d, monthly: TMOBILE_PHONE[d.type] }));
  const phoneMonthly = phoneLines.reduce((s, l) => s + l.monthly, 0);
  const homeTechMonthly = others.length > 0 ? 25 : 0;
  const monthly = phoneMonthly + homeTechMonthly;
  return {
    monthly,
    annual: monthly * 12,
    phoneLines,
    others,
    homeTechMonthly,
  };
}

function calcAkko(devices) {
  const groups = groupByOwner(devices);
  const rows = [];
  let monthly = 0;
  groups.forEach((list, owner) => {
    const phones = list.filter((d) => isPhone(d.type));
    const others = list.filter((d) => !isPhone(d.type));
    const assumedPlan = phones.length === 0 && others.length > 0;
    const plans = assumedPlan ? 1 : phones.length;
    const cost = plans * 15;
    monthly += cost;
    rows.push({ owner, phones, others, plans, cost, assumedPlan });
  });
  return { monthly, annual: monthly * 12, rows };
}

function calcAkkoHomeTech(devices) {
  const monthly = devices.length > 0 ? 50 : 0;
  return { monthly, annual: monthly * 12, count: devices.length };
}

/* ---------------------------------------------------------------
   SMALL UI PRIMITIVES
--------------------------------------------------------------- */
function Badge({ children, tone = "accent" }) {
  const tones = {
    accent: { bg: C.accentSoft, fg: C.accent },
    amber: { bg: C.amberSoft, fg: C.amber },
    danger: { bg: C.dangerSoft, fg: C.danger },
  };
  const t = tones[tone];
  return (
    <span
      style={{
        display: "inline-block",
        fontFamily: FONT_MONO,
        fontSize: "10px",
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        padding: "3px 8px",
        borderRadius: "3px",
        background: t.bg,
        color: t.fg,
        fontWeight: 600,
      }}
    >
      {children}
    </span>
  );
}

function DeviceIcon({ type, size = 14, color = C.inkSoft }) {
  const Icon = ICONS[type] || Smartphone;
  return <Icon size={size} color={color} style={{ flexShrink: 0 }} />;
}

/* ---------------------------------------------------------------
   DEVICE LEDGER (editable inventory)
--------------------------------------------------------------- */
function DeviceLedger({ devices, setDevices }) {
  const update = (id, patch) =>
    setDevices((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  const remove = (id) => setDevices((prev) => prev.filter((d) => d.id !== id));
  const add = () =>
    setDevices((prev) => [
      ...prev,
      { id: nextId(), type: DEVICE_TYPES[0], owner: "Owner 1", condition: "Already owned" },
    ]);

  return (
    <div
      style={{
        background: C.panel,
        border: `1px solid ${C.rule}`,
        borderRadius: "6px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          padding: "14px 18px 10px",
          borderBottom: `1px solid ${C.rule}`,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: "11px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: C.muted,
            }}
          >
            Device Ledger
          </div>
          <div style={{ fontFamily: FONT_SANS, fontSize: "13px", color: C.inkSoft, marginTop: "2px" }}>
            {devices.length} device{devices.length !== 1 ? "s" : ""} across{" "}
            {groupByOwner(devices).size} owner{groupByOwner(devices).size !== 1 ? "s" : ""}
          </div>
        </div>
        <button
          onClick={add}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontFamily: FONT_MONO,
            fontSize: "11px",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            fontWeight: 600,
            color: "#fff",
            background: C.accent,
            border: "none",
            borderRadius: "4px",
            padding: "8px 12px",
            cursor: "pointer",
          }}
        >
          <Plus size={13} /> Add device
        </button>
      </div>

      {/* column headers */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "28px 1fr 1fr 160px 32px",
          gap: "10px",
          padding: "8px 18px",
          fontFamily: FONT_MONO,
          fontSize: "10px",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: C.muted,
          borderBottom: `1px solid ${C.rule}`,
        }}
      >
        <span>#</span>
        <span>Device type</span>
        <span>Owner (Apple ID)</span>
        <span>Condition</span>
        <span></span>
      </div>

      <div>
        {devices.map((d, i) => (
          <div
            key={d.id}
            style={{
              display: "grid",
              gridTemplateColumns: "28px 1fr 1fr 160px 32px",
              gap: "10px",
              alignItems: "center",
              padding: "9px 18px",
              borderBottom: i === devices.length - 1 ? "none" : `1px solid ${C.rule}`,
              background: i % 2 === 1 ? C.paper : "transparent",
            }}
          >
            <span style={{ fontFamily: FONT_MONO, fontSize: "12px", color: C.muted }}>
              {String(i + 1).padStart(2, "0")}
            </span>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <DeviceIcon type={d.type} />
              <select
                value={d.type}
                onChange={(e) => update(d.id, { type: e.target.value })}
                style={{
                  fontFamily: FONT_SANS,
                  fontSize: "13px",
                  color: C.ink,
                  background: "transparent",
                  border: "none",
                  borderBottom: `1px solid transparent`,
                  padding: "2px 0",
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                {DEVICE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <input
              value={d.owner}
              onChange={(e) => update(d.id, { owner: e.target.value })}
              placeholder="Owner name"
              style={{
                fontFamily: FONT_SANS,
                fontSize: "13px",
                color: C.ink,
                background: "transparent",
                border: "none",
                borderBottom: `1px solid ${C.rule}`,
                padding: "3px 0",
                width: "100%",
              }}
            />

            <div style={{ display: "flex", borderRadius: "4px", overflow: "hidden", border: `1px solid ${C.rule}` }}>
              {["Already owned", "New purchase"].map((opt) => (
                <button
                  key={opt}
                  onClick={() => update(d.id, { condition: opt })}
                  style={{
                    flex: 1,
                    fontFamily: FONT_MONO,
                    fontSize: "10px",
                    letterSpacing: "0.02em",
                    padding: "6px 4px",
                    border: "none",
                    cursor: "pointer",
                    background: d.condition === opt ? C.accent : "transparent",
                    color: d.condition === opt ? "#fff" : C.muted,
                  }}
                >
                  {opt === "Already owned" ? "Owned" : "New"}
                </button>
              ))}
            </div>

            <button
              onClick={() => remove(d.id)}
              aria-label="Remove device"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: C.muted,
                padding: "4px",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = C.danger)}
              onMouseLeave={(e) => (e.currentTarget.style.color = C.muted)}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {devices.length === 0 && (
          <div style={{ padding: "24px 18px", fontFamily: FONT_SANS, fontSize: "13px", color: C.muted }}>
            No devices yet — add one to start comparing plans.
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   PLAN CARD SHELL
--------------------------------------------------------------- */
function PartsIndicator({ parts }) {
  if (!parts) return null;
  const tones = {
    accent: { fg: C.accent, dot: C.accent },
    amber: { fg: C.amber, dot: C.amber },
    danger: { fg: C.danger, dot: C.danger },
  };
  const t = tones[parts.tone] || tones.accent;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "7px",
        marginTop: "10px",
      }}
    >
      <span
        style={{
          width: "7px",
          height: "7px",
          borderRadius: "50%",
          background: t.dot,
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontFamily: FONT_MONO,
          fontSize: "10px",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          color: C.muted,
        }}
      >
        Genuine Apple parts:
      </span>
      <span style={{ fontFamily: FONT_SANS, fontSize: "11.5px", fontWeight: 600, color: t.fg }}>
        {parts.label}
      </span>
    </div>
  );
}

function PlanCard({ title, sub, monthly, annual, badge, parts, children, expanded, onToggle }) {
  return (
    <div
      style={{
        background: C.panel,
        border: `1px solid ${C.rule}`,
        borderRadius: "6px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ padding: "16px 18px 14px", borderBottom: `1px solid ${C.rule}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
          <div>
            <div style={{ fontFamily: FONT_SANS, fontWeight: 600, fontSize: "14px", color: C.ink }}>{title}</div>
            {sub && (
              <div style={{ fontFamily: FONT_SANS, fontSize: "11px", color: C.muted, marginTop: "2px" }}>{sub}</div>
            )}
          </div>
          {badge}
        </div>

        <div style={{ marginTop: "14px", display: "flex", alignItems: "baseline", gap: "6px" }}>
          <span style={{ fontFamily: FONT_MONO, fontWeight: 600, fontSize: "26px", color: C.ink, fontVariantNumeric: "tabular-nums" }}>
            {money(monthly)}
          </span>
          <span style={{ fontFamily: FONT_MONO, fontSize: "12px", color: C.muted }}>/mo</span>
        </div>
        <div style={{ fontFamily: FONT_MONO, fontSize: "12px", color: C.muted, marginTop: "2px", fontVariantNumeric: "tabular-nums" }}>
          {money(annual)} / yr
        </div>
        <PartsIndicator parts={parts} />
      </div>

      <button
        onClick={onToggle}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontFamily: FONT_MONO,
          fontSize: "10px",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: C.accent,
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: "10px 18px",
        }}
      >
        Device breakdown
        <ChevronDown
          size={13}
          style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 120ms" }}
        />
      </button>

      {expanded && <div style={{ padding: "0 18px 16px" }}>{children}</div>}
    </div>
  );
}

function BreakdownRow({ label, detail, value, tone }) {
  const color = tone === "danger" ? C.danger : tone === "amber" ? C.amber : C.ink;
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "10px",
        padding: "7px 0",
        borderBottom: `1px solid ${C.rule}`,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: FONT_SANS, fontSize: "12.5px", color: C.ink }}>{label}</div>
        {detail && (
          <div style={{ fontFamily: FONT_SANS, fontSize: "11px", color: C.muted, marginTop: "1px" }}>{detail}</div>
        )}
      </div>
      <div
        style={{
          fontFamily: FONT_MONO,
          fontSize: "12px",
          color,
          whiteSpace: "nowrap",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   MAIN COMPONENT
--------------------------------------------------------------- */
export default function ProtectionPlanComparator() {
  const [devices, setDevices] = useState(PRELOAD);
  const [expanded, setExpanded] = useState({ acplus: true });

  const toggle = (key) => setExpanded((e) => ({ ...e, [key]: !e[key] }));

  const acPlus = useMemo(() => calcAppleCarePlus(devices), [devices]);
  const acOne = useMemo(() => calcAppleCareOne(devices), [devices]);
  const tmobile = useMemo(() => calcTMobile(devices), [devices]);
  const akko = useMemo(() => calcAkko(devices), [devices]);
  const akkoHome = useMemo(() => calcAkkoHomeTech(devices), [devices]);

  const cheapestMonthly = Math.min(
    ...[acPlus, acOne, tmobile, akko, akkoHome].filter((p) => p.monthly > 0).map((p) => p.monthly)
  );

  return (
    <div
      style={{
        fontFamily: FONT_SANS,
        background: C.paper,
        minHeight: "100%",
        padding: "28px 20px 40px",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap');
        select:focus, input:focus, button:focus { outline: 2px solid ${C.accent}; outline-offset: 1px; }
      `}</style>

      <div style={{ maxWidth: "1120px", margin: "0 auto" }}>
        {/* header */}
        <div style={{ marginBottom: "22px" }}>
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: "11px",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: C.accent,
              marginBottom: "6px",
            }}
          >
            Household Coverage Worksheet
          </div>
          <h1 style={{ fontFamily: FONT_SANS, fontWeight: 600, fontSize: "24px", color: C.ink, margin: 0 }}>
            Device protection plan comparator
          </h1>
          <p style={{ fontFamily: FONT_SANS, fontSize: "13px", color: C.inkSoft, marginTop: "6px", maxWidth: "640px" }}>
            Edit the ledger below to match your household, and every plan recalculates —
            individual AppleCare+, AppleCare One, T-Mobile Protection 360, and both AKKO
            options.
          </p>
        </div>

        {/* device ledger */}
        <DeviceLedger devices={devices} setDevices={setDevices} />

        {/* plan grid */}
        <div style={{ marginTop: "26px", marginBottom: "8px" }}>
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: "11px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: C.muted,
            }}
          >
            Plans compared
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "14px",
          }}
        >
          {/* 1. AppleCare+ */}
          <PlanCard
            title="AppleCare+"
            sub="Individual plan, per device"
            monthly={acPlus.monthly}
            annual={acPlus.annual}
            badge={acPlus.monthly === cheapestMonthly ? <Badge>Lowest cost</Badge> : null}
            parts={{ label: "Guaranteed — Apple-authorized", tone: "accent" }}
            expanded={!!expanded.acplus}
            onToggle={() => toggle("acplus")}
          >
            {acPlus.lines.map((l) => (
              <BreakdownRow
                key={l.device.id}
                label={`${l.device.type} · ${l.device.owner}`}
                detail={l.eligible ? l.note : l.note}
                value={l.eligible ? `${money(l.monthly)}/mo` : "Not eligible"}
                tone={l.eligible ? undefined : "danger"}
              />
            ))}
            <div style={{ fontFamily: FONT_SANS, fontSize: "11px", color: C.muted, marginTop: "8px" }}>
              Only devices purchased new within the last 60 days qualify for standalone AppleCare+.
            </div>
          </PlanCard>

          {/* 2. AppleCare One */}
          <PlanCard
            title="AppleCare One"
            sub="One subscription per Apple Account"
            monthly={acOne.monthly}
            annual={acOne.annual}
            badge={acOne.monthly === cheapestMonthly ? <Badge>Lowest cost</Badge> : null}
            parts={{ label: "Guaranteed — Apple-authorized", tone: "accent" }}
            expanded={!!expanded.acone}
            onToggle={() => toggle("acone")}
          >
            {acOne.rows.map((r) => (
              <BreakdownRow
                key={r.owner}
                label={`${r.owner} — ${r.count} device${r.count !== 1 ? "s" : ""}`}
                detail={r.devices.map((d) => d.type).join(", ")}
                value={`${money(r.cost)}/mo`}
              />
            ))}
            <div style={{ fontFamily: FONT_SANS, fontSize: "11px", color: C.muted, marginTop: "8px" }}>
              All device types eligible up to 4 years old, subject to inspection — but
              devices on different Apple Accounts can't be pooled into one subscription;
              each owner needs their own.
            </div>
          </PlanCard>

          {/* 3. T-Mobile */}
          <PlanCard
            title="T-Mobile Protection 360"
            sub="+ HomeTech add-on"
            monthly={tmobile.monthly}
            annual={tmobile.annual}
            badge={tmobile.monthly === cheapestMonthly ? <Badge>Lowest cost</Badge> : null}
            parts={{ label: "Guaranteed — via AppleCare Services", tone: "accent" }}
            expanded={!!expanded.tmobile}
            onToggle={() => toggle("tmobile")}
          >
            {tmobile.phoneLines.map((l) => (
              <BreakdownRow
                key={l.device.id}
                label={`${l.device.type} · ${l.device.owner}`}
                detail="$99–$225 tiered deductible"
                value={`${money(l.monthly)}/mo`}
              />
            ))}
            {tmobile.others.length > 0 && (
              <BreakdownRow
                label="Protection 360 HomeTech"
                detail={`Flat fee covers all ${tmobile.others.length} non-phone device${tmobile.others.length !== 1 ? "s" : ""}`}
                value={`${money(tmobile.homeTechMonthly)}/mo`}
              />
            )}
            {tmobile.others.some((d) => d.type === "Mac mini" || d.type === "HomePod") && (
              <div
                style={{
                  fontFamily: FONT_SANS,
                  fontSize: "11px",
                  color: C.amber,
                  background: C.amberSoft,
                  borderRadius: "4px",
                  padding: "8px 10px",
                  marginTop: "8px",
                  display: "flex",
                  gap: "6px",
                }}
              >
                <Info size={13} style={{ flexShrink: 0, marginTop: "1px" }} />
                <span>
                  Mac mini and HomePod are stationary devices — HomeTech covers them only for
                  breakdown or power surge, not accidental damage. They're excluded from the
                  portable-electronics list.
                </span>
              </div>
            )}
          </PlanCard>

          {/* 4. AKKO per-owner */}
          <PlanCard
            title="AKKO — Everything Protected"
            sub="Per-owner plans"
            monthly={akko.monthly}
            annual={akko.annual}
            badge={akko.monthly === cheapestMonthly ? <Badge>Lowest cost</Badge> : null}
            parts={{ label: "Only if you self-direct to Apple", tone: "amber" }}
            expanded={!!expanded.akko}
            onToggle={() => toggle("akko")}
          >
            {akko.rows.map((r) => (
              <BreakdownRow
                key={r.owner}
                label={`${r.owner} — ${r.plans} plan${r.plans !== 1 ? "s" : ""}`}
                detail={
                  r.assumedPlan
                    ? `No phone owned — one plan assumed to cover ${r.others.length} item${r.others.length !== 1 ? "s" : ""}`
                    : `Covers ${r.phones.length} phone${r.phones.length !== 1 ? "s" : ""} + ${r.others.length} item${r.others.length !== 1 ? "s" : ""} riding along free`
                }
                value={`${money(r.cost)}/mo`}
              />
            ))}
            <div style={{ fontFamily: FONT_SANS, fontSize: "11px", color: C.muted, marginTop: "8px" }}>
              Each $15/mo plan covers exactly one phone plus up to 25 other items owned by
              that same person, and can't be shared across owners.
            </div>
            <div
              style={{
                fontFamily: FONT_SANS,
                fontSize: "11px",
                color: C.amber,
                background: C.amberSoft,
                borderRadius: "4px",
                padding: "8px 10px",
                marginTop: "8px",
                display: "flex",
                gap: "6px",
              }}
            >
              <Info size={13} style={{ flexShrink: 0, marginTop: "1px" }} />
              <span>
                Reimbursement model, not authorized repair: AKKO routes you to its own
                independent shops first and only suggests an Apple Store if no local provider
                can service the device — so genuine Apple parts require you to self-direct to
                Apple, pay upfront, and claim back via PayPal/Venmo/virtual card. AKKO pays the
                lower of repair vs. replacement, and its replacement benchmark is
                excellent-condition refurbished pricing (Swappa/Back Market). While a phone is
                near-new that cap usually clears an Apple repair, but as it ages the cap can
                fall below Apple's genuine-parts price. Theft/loss pays a refurbished cash-out —
                which won't cover a remaining T-Mobile installment balance — and loss is capped
                at one claim per 12 months with location tracking required.
              </span>
            </div>
          </PlanCard>

          {/* 5. AKKO Home Tech+ */}
          <PlanCard
            title="AKKO Home Tech+"
            sub="Household plan, flat rate"
            monthly={akkoHome.monthly}
            annual={akkoHome.annual}
            badge={<Badge tone="accent">Simplest for mixed owners</Badge>}
            parts={{ label: "Only if you self-direct to Apple", tone: "amber" }}
            expanded={!!expanded.akkohome}
            onToggle={() => toggle("akkohome")}
          >
            <BreakdownRow
              label={`All ${akkoHome.count} devices, any owner, one address`}
              detail="Unlimited phones and devices regardless of Apple ID"
              value={`${money(akkoHome.monthly)}/mo`}
            />
            <div
              style={{
                fontFamily: FONT_SANS,
                fontSize: "11px",
                color: C.amber,
                background: C.amberSoft,
                borderRadius: "4px",
                padding: "8px 10px",
                marginTop: "10px",
                display: "flex",
                gap: "6px",
              }}
            >
              <Info size={13} style={{ flexShrink: 0, marginTop: "1px" }} />
              <span>
                Same reimbursement mechanics as AKKO's per-owner plan: genuine Apple parts only
                if you insist on the Apple route and pay upfront, payouts capped at the lower of
                repair vs. refurbished replacement value, and theft/loss settles as a refurb
                cash-out rather than an Apple replacement.
              </span>
            </div>
          </PlanCard>
        </div>

        {/* Amex info panel */}
        <div
          style={{
            marginTop: "22px",
            border: `1px dashed ${C.ruleStrong}`,
            borderRadius: "6px",
            padding: "14px 18px",
            background: C.paperAlt,
          }}
        >
          <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
            <Info size={14} color={C.muted} style={{ marginTop: "2px", flexShrink: 0 }} />
            <div>
              <div style={{ fontFamily: FONT_SANS, fontWeight: 600, fontSize: "12.5px", color: C.ink }}>
                Also worth knowing — Amex Delta Platinum cell phone protection
              </div>
              <div style={{ fontFamily: FONT_SANS, fontSize: "12px", color: C.inkSoft, marginTop: "4px", lineHeight: 1.5 }}>
                Free if the wireless bill is paid with that card. Covers every phone line on
                the bill, up to $800 per claim with a $50 deductible — but limited to 2
                claims total per 12 months shared across all lines, and only for damage or
                theft, not loss. Not a substitute for a per-device plan above, but worth
                factoring in before paying for one.
              </div>
            </div>
          </div>
        </div>

        {/* disclaimer */}
        <div
          style={{
            marginTop: "18px",
            paddingTop: "14px",
            borderTop: `1px solid ${C.rule}`,
            fontFamily: FONT_SANS,
            fontSize: "11px",
            color: C.muted,
            lineHeight: 1.6,
          }}
        >
          Prices are current estimates and can vary by device model, region, and carrier
          promotions. AppleCare+ sold standalone requires purchase within 60 days of the
          device purchase; AppleCare One accepts devices up to 4 years old but only within a
          single Apple Account. Confirm current terms with each provider before enrolling.
        </div>
      </div>
    </div>
  );
}
