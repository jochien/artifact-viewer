import React, { useState, useMemo, useEffect } from "react";
import {
  Smartphone,
  Laptop,
  Tablet,
  ShieldCheck,
  ShieldOff,
  ShieldAlert,
  ChevronDown,
  ChevronRight,
  Info,
  AlertTriangle,
  Users,
  Sparkles,
  Award,
  Wallet,
  TrendingDown,
  RefreshCcw,
  StickyNote,
  Sliders,
  Check,
  X,
  Plus,
  Trash2,
  HelpCircle,
} from "lucide-react";

/* =================================================================
   Device Protection Plan Analysis
   Source: kb device insurance/ (Comparison-Summary.md, Household.md,
   and per-plan files). Built 2026-07-18. This file lives in the KB
   folder on purpose — it's a companion visualization, not a copy of
   the KB. If plan terms change, update the .md files first, then
   revisit the numbers below.
================================================================= */

/* ---------------- palette ---------------- */
const COL = {
  bg: "#f6f3ec",
  panel: "#ffffff",
  panelAlt: "#f1ede2",
  ink: "#231f18",
  inkSoft: "#5b5546",
  muted: "#948d7a",
  rule: "#e0dac8",
  ruleStrong: "#cfc7ac",
  good: "#2f6f5e",
  goodSoft: "#e3efe9",
  warn: "#a8681f",
  warnSoft: "#f8ecd8",
  bad: "#a5432e",
  badSoft: "#f5e2dc",
  accent: "#3a5a8c",
  accentSoft: "#e6ecf6",
};

const PROVIDER_COLOR = {
  apple: "#2f6f5e",
  tmobile: "#9c2d5e",
  akko: "#b5651d",
  allstate: "#2d5f9c",
  existing: "#6b6558",
};

const FONT_SANS =
  "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const FONT_MONO =
  "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

const money = (n) =>
  (isFinite(n) ? n : 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });

/* ---------------- persistence ---------------- */
const STORAGE_KEY = "kb-protection-plan-analysis:v1";

function loadSaved() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function saveState(state) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* private mode / storage disabled — edits just won't persist */
  }
}

/* ---------------- the household ---------------- */
const PERSONS = [
  {
    id: "jc",
    name: "JC (me)",
    role: "Adult · mostly office/home-office",
    riskLevel: "moderate",
    usage:
      "Phone goes everywhere. Laptop travels with him most days, but the usage context is office-ish.",
    risk: "Commute, general carelessness — moderate.",
    takeaway:
      "Already handled, confirmed 2026-07-18: JC has an active AppleCare One plan covering his phone, this laptop, and his AirPods. Deliberately left out of this comparison round rather than re-shopped — both his devices show as \"already covered\" below.",
  },
  {
    id: "jy",
    name: "JY",
    role: "Adult · spouse",
    riskLevel: "moderate",
    usage:
      "Moves around a lot, phone is her primary and only device — no laptop.",
    risk: "Commute/transit, general carelessness.",
    takeaway:
      "Single-device household member. Her phone plan is the whole decision — no \"other device\" trade-off to make.",
  },
  {
    id: "ac",
    name: "AC",
    role: "Daughter · in college",
    riskLevel: "high",
    usage:
      "Phone is primary; moves around constantly, rides with friends, takes transit, campus life.",
    risk:
      "Transit + rideshare + campus life = higher loss/theft exposure than the rest of the household. Documented: a prior phone of hers is on record as LOST.",
    takeaway:
      "Corrected 2026-07-18: her MacBook is now the 2024 M4, which already has AppleCare+ through 2028 — no new decision needed there. Her 2022 M2 was reassigned to JC's \"stormclaw\" project. That leaves just her phone and iPad as live decisions, and her iPad's elevated loss/theft exposure is worth paying for on its own.",
  },
  {
    id: "jeffc",
    name: "JeffC",
    role: "Son · 9th grader",
    riskLevel: "highest-breakage",
    usage: "Phone + laptop both go everywhere, school daily.",
    risk:
      "Highest breakage risk in the household — has already broken the phone screen and the laptop screen multiple times. Sports + young-kid handling.",
    takeaway:
      "Phone is fine on any plan (unlimited damage claims everywhere). The laptop is the one to isolate — never let it share a plan with a shared household dollar cap.",
  },
];

/* device.type: "phone" | "mac" | "ipad" */
const DEVICES = [
  { id: "jc-phone", owner: "jc", ownerName: "JC", type: "phone", label: "iPhone 17 Pro Max — already covered" },
  { id: "jc-laptop", owner: "jc", ownerName: "JC", type: "mac", label: "MacBook Pro (M1 Pro, 2021) — already covered" },
  { id: "jy-phone", owner: "jy", ownerName: "JY", type: "phone", label: "iPhone 17 Pro Max" },
  { id: "ac-phone", owner: "ac", ownerName: "AC", type: "phone", label: "iPhone 17 Pro Max" },
  { id: "ac-laptop", owner: "ac", ownerName: "AC", type: "mac", label: "MacBook Pro (M4, 2024) — already covered" },
  { id: "ac-ipad", owner: "ac", ownerName: "AC", type: "ipad", label: "iPad Pro" },
  { id: "jeffc-phone", owner: "jeffc", ownerName: "JeffC", type: "phone", label: "iPhone 17 Pro Max" },
  { id: "jeffc-laptop", owner: "jeffc", ownerName: "JeffC", type: "mac", label: "MacBook Pro (M2)" },
];

const TYPE_ICON = { phone: Smartphone, mac: Laptop, ipad: Tablet };

/* ---------------- plan catalog ----------------
   poolType:
   - perDevice     price[key] x count of devices assigned
   - householdFlat price[key] once, regardless of how many devices point to it
   - perOwnerFlat  price[key] once per distinct owner assigned to it (AKKO Plan)
   - perOwnerTiered  appleCareOneBase covers the first 3 devices per owner,
                     +additional x max(0, n-3) beyond that
------------------------------------------------ */
const PLAN_INFO = {
  applePhoneTL: {
    name: "AppleCare+ with Theft & Loss",
    provider: "apple",
    appliesTo: ["phone"],
    poolType: "perDevice",
    priceKey: "applePhoneTL",
    priceLabel: "$13.99/mo per iPhone 17 Pro Max (confirmed Pro/Pro Max tier — base/16e tier is cheaper at $9.99–$11.99)",
    confirmed: true,
    theftLoss: "Yes — 2 claims / rolling 12 mo",
    deductible: "$29 screen · $99 other damage · $149 theft/loss",
    covered: [
      "Unlimited accidental damage repairs (drops, spills)",
      "Defects + battery service below 80% capacity",
      "Theft & loss: 2 claims / 12 mo",
      "24/7 Apple support, same-day repair where available",
    ],
    excluded: [
      "Requires Find My enabled at time of loss, through the claim",
      "No same-day replacement for theft/loss (only for damage)",
      "International replacement not guaranteed",
      "1 device per plan — no pooling",
    ],
    fit: "Best if theft/loss really matters and you want Apple-certified repairs on one device.",
  },
  appleMacPlus: {
    name: "AppleCare+ for Mac",
    provider: "apple",
    appliesTo: ["mac"],
    poolType: "perDevice",
    priceKey: "appleMacPlus",
    priceLabel: "~$11.99/mo per Mac (monthly price still an estimate; deductible confirmed)",
    confirmed: false,
    theftLoss: "Never offered for Mac, on any Apple plan",
    deductible: "CONFIRMED (apple.com/legal/applecare/fees-deductibles): $99 screen/enclosure · $299 other accidental damage (standard Mac models — JC's, AC's, and JeffC's Macs all qualify)",
    covered: [
      "Unlimited accidental damage repairs",
      "Defects + battery service, Apple-certified parts",
      "No shared household dollar cap — a repeat-breaker never exhausts a pool",
    ],
    excluded: [
      "Theft/loss is not offered for Mac under any AppleCare plan — confirmed",
      "Apple hardware only, one device per plan",
    ],
    fit: "The safe isolation choice for a repeat laptop-breaker — unlimited per-incident, no pool to burn through.",
  },
  appleIpadTL: {
    name: "AppleCare+ for iPad w/ Theft & Loss",
    provider: "apple",
    appliesTo: ["ipad"],
    poolType: "perDevice",
    priceKey: "appleIpadTL",
    priceLabel: "~$8.99/mo per iPad (monthly price still an estimate; deductible confirmed)",
    confirmed: false,
    theftLoss: "Yes — pooled with whatever plan it's on (2/yr solo, 3/yr on AppleCare One)",
    deductible: "CONFIRMED (apple.com/legal/applecare/fees-deductibles): $129 theft/loss (all models) · $49 other accidental damage for AC's 2021 iPad Pro specifically (older models get $49, not the $29/$99 newer-tier pricing)",
    covered: [
      "Unlimited accidental damage repairs",
      "Theft & loss coverage — one of the few non-phone devices Apple insures for it",
      "Compatible Apple Pencil + keyboard covered for damage (not theft/loss)",
    ],
    excluded: [
      "Same Find My requirement as iPhone",
      "Pencil/keyboard never covered for theft/loss even bundled with a covered iPad",
    ],
    fit: "Worth it specifically when the iPad travels with someone who has elevated loss/theft exposure.",
  },
  appleCareOne: {
    name: "AppleCare One",
    provider: "apple",
    appliesTo: ["phone", "mac", "ipad"],
    poolType: "perOwnerTiered",
    priceKey: "appleCareOneBase",
    priceLabel: "$19.99/mo first 3 devices, +$5.99/mo each additional (per Apple ID)",
    confirmed: true,
    theftLoss: "Yes — 3 claims / 12 mo, pooled across the whole plan",
    deductible: "Same fee schedule as AppleCare+",
    covered: [
      "All AppleCare+ benefits across multiple Apple devices",
      "Surge protection (unique vs. plain AppleCare+)",
      "Coverage carries over on device upgrades",
      "Can add already-owned devices (if under ~4 yrs old)",
    ],
    excluded: [
      "Scoped to ONE Apple Account — cannot span family members' separate IDs",
      "Mac never gets theft/loss, even here",
      "3 theft/loss claims are shared across every device on the plan, not per-device",
    ],
    fit: "Best once one person owns 3+ Apple devices, or to backfill theft/loss onto a non-phone device (like AC's iPad) alongside a Mac.",
  },
  tmobileP360: {
    name: "T-Mobile Protection 360",
    provider: "tmobile",
    appliesTo: ["phone"],
    poolType: "perDevice",
    priceKey: "tmobileP360",
    priceLabel: "$7–$26/mo, tiered by device value (est. $26 for a flagship)",
    confirmed: true,
    theftLoss: "Yes — CONFIRMED 5 claims / rolling 12 mo (also covers a simply-misplaced device, not just stolen)",
    deductible: "Tiered by device: $10/$49/$99/$149/$224/$449 (loss/theft, confirmed schedule)",
    covered: [
      "Unlimited accidental damage, $0 front-screen + back-glass repair on eligible phones",
      "Mechanical/electrical failure beyond manufacturer warranty",
      "AppleCare Services referral for iPhone (first 24 mo)",
      "McAfee security (ID theft reimbursement up to $1M), JUMP! early upgrade",
    ],
    excluded: [
      "Requires an active T-Mobile line",
      "No cybersecurity/identity protection beyond bundled McAfee app",
      "Canceling drops McAfee/JUMP!/AppleCare Services simultaneously",
      "\"Voluntary parting\" (e.g. handing it to a scammer) isn't covered as theft",
    ],
    fit: "Best if already on T-Mobile postpaid and you want the carrier to bundle everything — now the confirmed highest loss/theft claim allowance in this comparison (5/yr).",
  },
  tmobileStandard: {
    name: "T-Mobile Standard Device Protection",
    provider: "tmobile",
    appliesTo: ["phone"],
    poolType: "perDevice",
    priceKey: "tmobileStandard",
    priceLabel: "$5 or $10/mo per device, depending on tier (cheaper than full P360)",
    confirmed: true,
    theftLoss: "Yes, but pooled with damage — only 1 combined claim / 12 mo total",
    deductible: "$10/$49/$99/$149/$249/$499 by tier for that one combined claim",
    covered: [
      "Unlimited mechanical/electrical failure, same as full Protection 360",
      "Tech support via the Protection 360 app",
      "The cheapest T-Mobile device-protection tier",
    ],
    excluded: [
      "Only 1 claim total per 12 mo — damage AND loss/theft draw from the same single claim",
      "File one cracked-screen claim and you have zero loss/theft coverage left that year",
      "No AppleCare Services, JUMP!, or McAfee bundle (full P360 only)",
    ],
    fit: "A budget-tier fallback for a low-value or low-risk device — not a serious theft/loss plan for anyone's daily phone.",
  },
  tmobileHomeTech: {
    name: "T-Mobile Protection 360 HomeTech",
    provider: "tmobile",
    appliesTo: ["mac", "ipad"],
    poolType: "householdFlat",
    priceKey: "tmobileHomeTech",
    priceLabel: "$25/mo flat, unlimited devices",
    confirmed: true,
    theftLoss: "Never — not a covered peril at all on this plan",
    deductible: "Varies per Coverage Confirmation; shared claim caps below",
    covered: [
      "Unlimited eligible Wi-Fi devices at one flat price (laptops, tablets, smart TVs, etc.)",
      "Breakdown + power surge (all eligible devices)",
      "Accidental damage — but only for *portable* electronics",
      "Tech support from day one",
    ],
    excluded: [
      "Smartphones and major appliances excluded entirely",
      "Non-portable items (TVs, smart speakers) get no drop/spill damage coverage",
      "Lost/stolen devices are not covered, ever",
      "SHARED POOL: max $2,000/claim, max $5,000 total across ALL devices per rolling 12 mo",
      "30-day wait for breakdown/damage benefits",
    ],
    fit: "Good flat-fee bucket for low-risk \"everything else\" — dangerous for a repeat-breaker, since one person can burn the whole household's $5,000/yr pool.",
  },
  akkoPhoneOnly: {
    name: "AKKO Phone Only",
    provider: "akko",
    appliesTo: ["phone"],
    poolType: "perDevice",
    priceKey: "akkoPhoneOnly",
    priceLabel: "$5–$12/mo by model (est. $9)",
    confirmed: false,
    theftLoss: "Theft yes; lost-phone limited to 1/yr, annual-pay plans only",
    deductible: "$29–$99 damage · $75–$99 theft/replacement (capped at $99)",
    covered: [
      "Cracked screens, spills, mechanical/electrical failure — any age/condition",
      "Theft, including forced-entry vehicle break-ins",
      "Lowest max deductible ($99) of any plan compared",
      "Carrier-agnostic — any phone, any carrier, including used",
    ],
    excluded: [
      "30-day waiting period from signup",
      "Lost (not stolen) phone: only 1 claim/12mo, and ONLY if paid annually — $0 on monthly plans",
      "Only 1 phone per account",
    ],
    fit: "Cheapest true theft coverage, but the weakest \"I just misplaced it\" story of the group.",
  },
  akkoPlan: {
    name: "AKKO Plan (1 phone + 25 items)",
    provider: "akko",
    appliesTo: ["phone", "mac", "ipad"],
    poolType: "perOwnerFlat",
    priceKey: "akkoPlan",
    priceLabel: "$15/mo per person (1 phone + up to 25 other items)",
    confirmed: true,
    theftLoss: "Theft yes on all items; lost-phone still capped at 1/yr, annual-pay only",
    deductible: "$29–$99 phone (by model) · $99 flat on other items (this SKU's own compare-plans page)",
    covered: [
      "Everything AKKO Phone Only covers, PLUS up to 25 other belongings",
      "Laptops, tablets, cameras, gaming gear, sports gear, even clothing",
      "One low fee covers a whole person's \"stuff\", not just their phone",
    ],
    excluded: [
      "Only pays off vs. individual plans once you're actually insuring several items, not just one laptop",
      "Long exclusion list: vehicles, jewelry >$1,000/incident, furniture, cash, etc.",
      "Same weak lost-phone story as Phone Only",
      "UNCONFIRMED whether this SKU shares the $1,500/claim, $3,000/12mo aggregate cap AKKO's FAQ confirms for its Home/Home+ family-bundle tiers below — not stated either way for this specific plan",
    ],
    fit: "Best $/claim value for a household member with a pile of gear beyond just a laptop — but don't assume it's pool-cap-free until that's confirmed for this exact SKU.",
  },
  akkoHome: {
    name: "AKKO Home (a.k.a. Home Tech)",
    provider: "akko",
    appliesTo: ["mac", "ipad"],
    poolType: "householdFlat",
    priceKey: "akkoHome",
    priceLabel: "$25/mo flat, unlimited devices at one address, no phone",
    confirmed: true,
    theftLoss: "Marketed as \"unlimited claims incl. theft\" generically, but not listed as a bullet on this tier's own plan card — treat as uncertain for non-phone items",
    deductible: "CONFIRMED via AKKO's Family Bundle FAQ: $75 flat per claim, any item (differs from the general $99 figure quoted elsewhere on AKKO's site for the $15/mo individual plan)",
    covered: [
      "Unlimited devices at one address",
      "Same broad category list as the AKKO Plan (minus the phone slot)",
    ],
    excluded: [
      "CORRECTED 2026-07-18: this is NOT a cap-free pool. AKKO's own Family Bundle FAQ confirms a shared $1,500-per-claim, $3,000-per-rolling-12-months aggregate limit — tighter than T-Mobile HomeTech's $5,000/$2,000. A repeat-breaker can burn through this pool too.",
      "Not separately reviewed beyond the FAQ — verify exact current scope before relying on it",
    ],
    fit: "A household-wide flat-fee alternative to T-Mobile HomeTech with a lower deductible ($75 vs. HomeTech's tiered fee) but an even lower aggregate ceiling ($3,000/yr vs. $5,000/yr) — still not safe for a repeat-breaker.",
  },
  akkoHomePlus: {
    name: "AKKO Home Plus (a.k.a. Home Tech+)",
    provider: "akko",
    appliesTo: ["phone", "mac", "ipad"],
    poolType: "householdFlat",
    priceKey: "akkoHomePlus",
    priceLabel: "$50/mo flat — unlimited phones + devices at one address",
    confirmed: true,
    theftLoss: "Theft yes; lost-phone still 1/yr per phone, annual-pay only",
    deductible: "$75 flat per claim (same Family Bundle schedule as AKKO Home, per AKKO's FAQ)",
    covered: ["Everything AKKO covers, phones included, unlimited items, one household fee"],
    excluded: [
      "Still the weak lost-phone story across every phone on the plan",
      "Same $1,500/claim, $3,000/12mo aggregate cap as AKKO Home — and here it also applies to phones. A single stolen iPhone 17 Pro Max could use up most of a year's pool by itself.",
    ],
    fit: "The flattest household-wide number in this comparison, but pooling 4 flagship iPhones' theft/loss risk into a $3,000/yr shared ceiling is a real mismatch for this household — better suited to lower-value phones than an iPhone 17 Pro Max.",
  },
  allstatePhone: {
    name: "Allstate Phone Protection",
    provider: "allstate",
    appliesTo: ["phone"],
    poolType: "perDevice",
    priceKey: "allstatePhone",
    priceLabel: "$8.99/mo per line",
    confirmed: true,
    theftLoss: "Not advertised in the direct consumer plan — damage/malfunction only",
    deductible: "Flat $149, any model",
    covered: [
      "Cracked screen, liquid damage, battery/touchscreen/speaker/port failure",
      "Any carrier, any model, coverage follows you on upgrade",
      "Same-day repair options in most areas",
    ],
    excluded: [
      "No clear loss/theft replacement benefit found",
      "Must retain original purchase/lease receipt to claim",
    ],
    fit: "Simplest flat deductible of the group — but not a like-for-like theft/loss competitor.",
  },
  allstatePhonePlus: {
    name: "Allstate Phone Protection Plus",
    provider: "allstate",
    appliesTo: ["phone"],
    poolType: "perDevice",
    priceKey: "allstatePhonePlus",
    priceLabel: "$12.99/mo per line",
    confirmed: true,
    theftLoss: "Same as base plan — not advertised",
    deductible: "Flat $149, any model",
    covered: [
      "Everything in the base plan",
      "Premium tech support, ID theft recovery + digital footprint monitoring",
      "1 roadside assistance call/year",
    ],
    excluded: ["Still no clear device loss/theft replacement benefit"],
    fit: "Worth it only for the ID-theft/roadside perks, not for device loss/theft.",
  },
  allstateFamilyPlus: {
    name: "Allstate Phone Protection Plus (Family, up to 4 lines)",
    provider: "allstate",
    appliesTo: ["phone"],
    poolType: "householdFlat",
    priceKey: "allstateFamilyPlus",
    priceLabel: "$24.99/mo flat for up to 4 lines",
    confirmed: true,
    theftLoss: "Not advertised — damage/malfunction only, for the whole family",
    deductible: "Flat $149 per claim, any model",
    covered: ["Everything Plus covers, for up to 4 phones under one flat household fee"],
    excluded: [
      "The whole household loses phone theft/loss coverage to get this price",
      "The gap this KB was built to avoid, for the household member(s) with real transit/theft exposure",
    ],
    fit: "The floor price for phone coverage — only worth it if you've decided theft/loss isn't worth paying for.",
  },
  alreadyCovered: {
    name: "Already covered (existing plan)",
    provider: "existing",
    appliesTo: ["phone", "mac", "ipad"],
    poolType: "perDevice",
    priceKey: "alreadyCovered",
    priceLabel: "$0 — no new spend, already handled elsewhere",
    confirmed: true,
    theftLoss: "Depends on the existing plan — not re-evaluated here",
    deductible: "N/A — see the existing plan's own terms",
    covered: [
      "Whatever the existing plan already covers (e.g. JC's AppleCare One, or AC's M4's AppleCare+ through 2028)",
      "Deliberately excluded from this comparison round — not being re-shopped right now",
    ],
    excluded: ["Not actually evaluated — this is a placeholder for \"don't touch this device right now,\" not a real plan"],
    fit: "Use this for any device that's already handled by a plan outside the scope of this round of analysis.",
  },
};

const DEFAULT_PRICES = {
  alreadyCovered: 0,
  applePhoneTL: 13.99,
  appleMacPlus: 11.99,
  appleIpadTL: 8.99,
  appleCareOneBase: 19.99,
  appleCareOneAdditional: 5.99,
  tmobileP360: 26,
  tmobileStandard: 7.5,
  tmobileHomeTech: 25,
  akkoPhoneOnly: 9,
  akkoPlan: 15,
  akkoHome: 25,
  akkoHomePlus: 50,
  allstatePhone: 8.99,
  allstatePhonePlus: 12.99,
  allstateFamilyPlus: 24.99,
};

const PRICE_LABELS = {
  applePhoneTL: "AppleCare+ iPhone w/ T&L",
  appleMacPlus: "AppleCare+ Mac (estimate)",
  appleIpadTL: "AppleCare+ iPad w/ T&L (estimate)",
  appleCareOneBase: "AppleCare One (first 3 devices)",
  appleCareOneAdditional: "AppleCare One (each additional)",
  tmobileP360: "T-Mobile P360 (flagship tier, estimate)",
  tmobileStandard: "T-Mobile Standard Device Protection (estimate)",
  tmobileHomeTech: "T-Mobile P360 HomeTech (flat)",
  akkoPhoneOnly: "AKKO Phone Only (estimate)",
  akkoPlan: "AKKO Plan, 1 phone + 25 items",
  akkoHome: "AKKO Home (flat)",
  akkoHomePlus: "AKKO Home Plus (flat)",
  allstatePhone: "Allstate Phone Protection",
  allstatePhonePlus: "Allstate Phone Protection Plus",
  allstateFamilyPlus: "Allstate Plus, family up to 4 lines (flat)",
};

/* ---------------- bundles (curated recommendation options) ---------------- */
const BUNDLES = [
  {
    id: "isolate",
    name: "Recommended — match exposure",
    badge: "RECOMMENDED",
    badgeIcon: Award,
    badgeColor: COL.good,
    tagline: "Individual Apple plans for the 5 devices that actually still need a decision.",
    why: "Updated 2026-07-18: JC's phone + laptop are already covered by his existing AppleCare One (left out of this round by decision), and AC's MacBook is now the 2024 M4 with its own AppleCare+ through 2028 (her 2022 M2 was reassigned to JC's \"stormclaw\" project). That leaves only 5 devices to actually decide on: JY's phone, AC's phone + iPad, and JeffC's phone + laptop. Each gets its own AppleCare+ plan, matched to its real exposure — theft/loss for every phone and AC's iPad, and an isolated, unpooled plan for JeffC's laptop given his repeat-breaker history. Note: AppleCare+ w/ Theft & Loss for iPhone 17 Pro Max is confirmed at $13.99/mo, not the cheaper $9.99 base/16e tier used in an earlier pass — this bundle costs more than it used to as a result.",
    assignments: {
      "jc-phone": "alreadyCovered",
      "jc-laptop": "alreadyCovered",
      "jy-phone": "applePhoneTL",
      "ac-phone": "applePhoneTL",
      "ac-laptop": "alreadyCovered",
      "ac-ipad": "appleIpadTL",
      "jeffc-phone": "applePhoneTL",
      "jeffc-laptop": "appleMacPlus",
    },
    tradeoffs: [
      "Everyone stays inside Apple's fee schedule — no carrier-agnostic option",
      "AC's iPad now stands alone (not paired with her Mac under one AppleCare One) since her Mac no longer needs a new plan — cheaper this way, since AppleCare One's $19.99 base only pays off with 2+ devices on it",
      "Now the priciest of the 3 \"keep real protection\" options per phone — AppleCare+'s Pro Max tier ($13.99/mo) costs more than AKKO's phone-only option, so Cost-optimized mix is worth a real look, not a marginal one",
    ],
  },
  {
    id: "tmobile-first",
    name: "T-Mobile-first",
    badge: "RICHER CLAIMS",
    badgeIcon: Sparkles,
    badgeColor: COL.accent,
    tagline: "Now that the whole family's confirmed on T-Mobile, use Protection 360 for the phones directly.",
    why: "Carrier eligibility is no longer hypothetical — confirmed 2026-07-18, the whole family is on T-Mobile. Protection 360 offers the household's highest confirmed loss/theft allowance (5/yr vs. AppleCare+'s 2/yr), plus McAfee, JUMP! early upgrades, and AppleCare Services referral for iPhones (first 24 months) — all bundled onto a bill the family already pays. AC's iPad and JeffC's laptop stay on Apple/isolated plans since P360 doesn't clearly cover iPad theft/loss and never covers laptops at all.",
    assignments: {
      "jc-phone": "alreadyCovered",
      "jc-laptop": "alreadyCovered",
      "jy-phone": "tmobileP360",
      "ac-phone": "tmobileP360",
      "ac-laptop": "alreadyCovered",
      "ac-ipad": "appleIpadTL",
      "jeffc-phone": "tmobileP360",
      "jeffc-laptop": "appleMacPlus",
    },
    tradeoffs: [
      "Meaningfully more expensive per phone than AppleCare+ ($26/mo estimated flagship tier vs. $13.99 confirmed) — you're paying roughly $12/mo per phone extra for the richer claims allowance and carrier perks",
      "Still can't cover AC's iPad or JeffC's laptop, so it's not a full escape from managing Apple plans too",
      "Worth it only if the 5-claim loss/theft allowance or the bundled McAfee/JUMP! perks are worth ~$36/mo more across 3 phones than the Recommended bundle",
    ],
  },
  {
    id: "cost-optimized",
    name: "Cost-optimized mix",
    badge: "REAL SAVINGS NOW",
    badgeIcon: Wallet,
    badgeColor: COL.warn,
    tagline: "AKKO for JY's and JeffC's phones — now a genuine ~$11/mo saving, not a marginal one.",
    why: "Corrected 2026-07-18: AppleCare+ w/ Theft & Loss for iPhone 17 Pro Max is confirmed at $13.99/mo, not the $9.99 figure used earlier — that makes AKKO Phone Only's ~$9/mo a real ~$5/mo-per-phone saving, not a rounding error. JY's and JeffC's phones move to AKKO Phone Only since neither has AC's documented loss history, so AKKO's weaker lost-phone story is an acceptable trade. AC's phone stays on AppleCare+ given her real LOST-phone record. AC's iPad and JeffC's laptop stay on Apple too — AKKO's $15/mo Plan is still pricier than individual AppleCare+ for a single device, and its household-tier aggregate cap is unconfirmed for that specific SKU.",
    assignments: {
      "jc-phone": "alreadyCovered",
      "jc-laptop": "alreadyCovered",
      "jy-phone": "akkoPhoneOnly",
      "ac-phone": "applePhoneTL",
      "ac-laptop": "alreadyCovered",
      "ac-ipad": "appleIpadTL",
      "jeffc-phone": "akkoPhoneOnly",
      "jeffc-laptop": "appleMacPlus",
    },
    tradeoffs: [
      "Now saves roughly $11/mo vs. the Recommended bundle — worth a real look, not dismissible as marginal anymore",
      "AKKO's lost-phone benefit (1/yr, annual-pay only) is meaningfully weaker than AppleCare+'s (2/yr) for JY and JeffC",
      "Kept on Apple for AC's phone/iPad and JeffC's laptop anyway, so this isn't a full escape from Apple billing either",
    ],
  },
  {
    id: "budget",
    name: "Budget / accept the gap",
    badge: "FLOOR PRICE",
    badgeIcon: TrendingDown,
    badgeColor: COL.bad,
    tagline: "The cheapest number here — now a real ~$13/mo cheaper than doing it right, not a wash.",
    why: "One flat Allstate family line ($24.99/mo, up to 4 lines, using 3) covers JY, AC, and JeffC's phones. AC's iPad and JeffC's laptop share one flat T-Mobile HomeTech line ($25/mo). Corrected 2026-07-18: now that AppleCare+'s Pro Max tier is confirmed at $13.99/mo (not $9.99), this floor-price bundle is a genuine ~$13/mo cheaper than the Recommended bundle — a real trade-off to weigh, not a wash.",
    assignments: {
      "jc-phone": "alreadyCovered",
      "jc-laptop": "alreadyCovered",
      "jy-phone": "allstateFamilyPlus",
      "ac-phone": "allstateFamilyPlus",
      "ac-laptop": "alreadyCovered",
      "ac-ipad": "tmobileHomeTech",
      "jeffc-phone": "allstateFamilyPlus",
      "jeffc-laptop": "tmobileHomeTech",
    },
    tradeoffs: [
      "Zero theft/loss coverage on any phone — including AC's, despite her documented loss history",
      "JeffC's laptop is back inside T-Mobile HomeTech's shared $5,000/12mo pool, the exact structure this KB flagged as risky for a repeat-breaker",
      "Now a real ~$13/mo saving vs. the Recommended bundle — worth weighing deliberately against the risks above, not dismissing as a wash",
    ],
  },
];

/* ---------------- computation ---------------- */
function computeBundle(assignments, prices) {
  const byPlan = {};
  DEVICES.forEach((d) => {
    const planKey = assignments[d.id];
    if (!planKey) return;
    (byPlan[planKey] ||= []).push(d);
  });

  let total = 0;
  const lines = []; // { planKey, cost, devices }

  Object.entries(byPlan).forEach(([planKey, list]) => {
    const meta = PLAN_INFO[planKey];
    if (!meta) return;
    let cost = 0;
    if (meta.poolType === "perDevice") {
      cost = (prices[meta.priceKey] || 0) * list.length;
    } else if (meta.poolType === "householdFlat") {
      cost = prices[meta.priceKey] || 0;
    } else if (meta.poolType === "perOwnerFlat") {
      const owners = new Set(list.map((d) => d.owner));
      cost = (prices[meta.priceKey] || 0) * owners.size;
    } else if (meta.poolType === "perOwnerTiered") {
      const byOwner = {};
      list.forEach((d) => (byOwner[d.owner] ||= []).push(d));
      // AppleCare One: $19.99 base covers the first 3 devices on one Apple ID,
      // then +$5.99/mo for each device beyond 3 (not beyond 1 — fixed 2026-07-18).
      cost = Object.values(byOwner).reduce(
        (s, arr) =>
          s +
          (prices.appleCareOneBase || 0) +
          Math.max(0, arr.length - 3) * (prices.appleCareOneAdditional || 0),
        0
      );
    }
    total += cost;
    lines.push({ planKey, cost, devices: list });
  });

  lines.sort((a, b) => b.cost - a.cost);
  return { total, lines };
}

/* ---------------- small shared UI bits ---------------- */
function Badge({ children, color, soft }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        padding: "3px 8px",
        borderRadius: 999,
        color: color,
        background: soft,
        border: `1px solid ${color}33`,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function ProviderChip({ provider }) {
  const labels = { apple: "Apple", tmobile: "T-Mobile", akko: "AKKO", allstate: "Allstate", existing: "Existing" };
  const c = PROVIDER_COLOR[provider];
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        color: c,
        background: `${c}18`,
        border: `1px solid ${c}40`,
        borderRadius: 6,
        padding: "2px 7px",
      }}
    >
      {labels[provider]}
    </span>
  );
}

function SectionTitle({ icon: Icon, children, sub }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {Icon ? <Icon size={18} color={COL.ink} /> : null}
        <h2 style={{ margin: 0, fontSize: 19, fontWeight: 700, color: COL.ink }}>{children}</h2>
      </div>
      {sub ? (
        <p style={{ margin: "4px 0 0", fontSize: 13.5, color: COL.inkSoft, maxWidth: 720 }}>{sub}</p>
      ) : null}
    </div>
  );
}

const cardStyle = {
  background: COL.panel,
  border: `1px solid ${COL.rule}`,
  borderRadius: 12,
  padding: 18,
};

const inputStyle = {
  width: "100%",
  fontFamily: FONT_MONO,
  fontSize: 13,
  padding: "6px 8px",
  borderRadius: 6,
  border: `1px solid ${COL.ruleStrong}`,
  background: "#fffdf8",
  color: COL.ink,
};

const tabButtonStyle = (active) => ({
  padding: "9px 14px",
  fontSize: 13.5,
  fontWeight: 600,
  borderRadius: 8,
  border: `1px solid ${active ? COL.ink : COL.rule}`,
  background: active ? COL.ink : "transparent",
  color: active ? "#fdfcf8" : COL.inkSoft,
  cursor: "pointer",
  whiteSpace: "nowrap",
});

const DEFAULT_CHECKLIST = [
  { id: "c1", text: "RESOLVED 2026-07-18: T-Mobile P360 theft/loss claim cap confirmed at 5/rolling 12 mo (T-Mobile's March 2026 brochure + Certificate of Insurance)", done: true },
  { id: "c2", text: "RESOLVED 2026-07-18: SquareTrade's own FAQ confirms Allstate Protection Plans does not cover loss/theft (has a dedicated FAQ titled exactly that)", done: true },
  { id: "c3", text: "RESOLVED 2026-07-18: whole family confirmed on T-Mobile; all 4 iPhones confirmed still in the AppleCare+ enrollment window", done: true },
  { id: "c4", text: "RESOLVED for iPhone 2026-07-18: AppleCare+ w/ Theft & Loss confirmed at $13.99/mo for iPhone 17 Pro Max (was wrongly using the $9.99 base/16e tier). Still open: real AppleCare+ monthly price for the specific Mac/iPad models (deductibles confirmed via apple.com; premium still an estimate)", done: false },
  { id: "c5", text: "Confirm whether AKKO's $15/mo Individual/AKKO Plan shares the $1,500/claim, $3,000/12mo aggregate cap confirmed for AKKO Home / Home Tech+", done: false },
  { id: "c6", text: "Confirm exact T-Mobile P360 device tier (and monthly price) for the iPhone 17 Pro Max specifically — the T-Mobile-first bundle currently uses the top-tier estimate ($26/mo)", done: false },
];

/* =================================================================
   MAIN COMPONENT
================================================================= */
export default function ProtectionPlanAnalysis() {
  const saved = useMemo(() => loadSaved(), []);
  const [tab, setTab] = useState("overview");
  const [prices, setPrices] = useState(saved?.prices || DEFAULT_PRICES);
  const [assignments, setAssignments] = useState(saved?.assignments || BUNDLES[0].assignments);
  const [activeBundleHint, setActiveBundleHint] = useState(saved?.activeBundleHint || "isolate");
  const [names, setNames] = useState(
    saved?.names || Object.fromEntries(PERSONS.map((p) => [p.id, p.name]))
  );
  const [notes, setNotes] = useState(
    saved?.notes ??
      "Add your own thinking here — what you actually decided, quotes you got, dates you enrolled, anything the KB doesn't capture yet."
  );
  const [checklist, setChecklist] = useState(saved?.checklist || DEFAULT_CHECKLIST);
  const [expandedPlans, setExpandedPlans] = useState(() => new Set());
  const [newChecklistText, setNewChecklistText] = useState("");
  const [showPricing, setShowPricing] = useState(false);

  useEffect(() => {
    saveState({ prices, assignments, notes, checklist, activeBundleHint, names });
  }, [prices, assignments, notes, checklist, activeBundleHint, names]);

  const bundleTotals = useMemo(
    () => BUNDLES.map((b) => ({ id: b.id, ...computeBundle(b.assignments, prices) })),
    [prices]
  );
  const mixerResult = useMemo(() => computeBundle(assignments, prices), [assignments, prices]);
  const cheapest = Math.min(...bundleTotals.map((b) => b.total));
  const priciest = Math.max(...bundleTotals.map((b) => b.total));

  const togglePlanExpanded = (key) =>
    setExpandedPlans((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const loadPreset = (bundleId) => {
    const b = BUNDLES.find((x) => x.id === bundleId);
    if (!b) return;
    setAssignments({ ...b.assignments });
    setActiveBundleHint(bundleId);
  };

  const loadScratch = () => {
    setAssignments({});
    setActiveBundleHint("scratch");
  };

  const resetAll = () => {
    if (!window.confirm("Reset all prices, assignments, names, and notes back to defaults?")) return;
    setPrices(DEFAULT_PRICES);
    setAssignments({ ...BUNDLES[0].assignments });
    setActiveBundleHint(BUNDLES[0].id);
    setNames(Object.fromEntries(PERSONS.map((p) => [p.id, p.name])));
    setNotes("");
    setChecklist(DEFAULT_CHECKLIST);
  };

  const TABS = [
    { id: "overview", label: "Overview" },
    { id: "plans", label: "Plans" },
    { id: "household", label: "Household" },
    { id: "logic", label: "How we got here" },
    { id: "recommendations", label: "Recommendations" },
    { id: "mixer", label: "Mix & match" },
    { id: "notes", label: "Notes" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: COL.bg, fontFamily: FONT_SANS, color: COL.ink }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 22px 60px" }}>
        {/* header */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: COL.muted }}>
            kb device insurance · built 2026-07-18
          </div>
          <h1 style={{ margin: "6px 0 6px", fontSize: 30, fontWeight: 800 }}>Device Protection Plan Analysis</h1>
          <p style={{ margin: 0, fontSize: 14.5, color: COL.inkSoft, maxWidth: 760 }}>
            4 people, 8 devices, 6 plans (14 pricing variants). Everything below is computed live from the
            numbers in the KB — where the KB didn't capture an exact price (Mac/iPad AppleCare+, T-Mobile
            P360's exact tier, AKKO's per-model phone price), it's marked as an estimate you can edit in
            <strong> Mix &amp; match</strong>.
          </p>
        </div>

        {/* tabs */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 22 }}>
          {TABS.map((t) => (
            <button key={t.id} style={tabButtonStyle(tab === t.id)} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <Overview bundleTotals={bundleTotals} cheapest={cheapest} priciest={priciest} />
        )}

        {tab === "plans" && (
          <PlansTab expandedPlans={expandedPlans} togglePlanExpanded={togglePlanExpanded} prices={prices} />
        )}

        {tab === "household" && <HouseholdTab names={names} setNames={setNames} />}

        {tab === "logic" && <LogicTab />}

        {tab === "recommendations" && (
          <RecommendationsTab bundleTotals={bundleTotals} names={names} onLoadIntoMixer={(id) => { loadPreset(id); setTab("mixer"); }} />
        )}

        {tab === "mixer" && (
          <MixerTab
            assignments={assignments}
            setAssignments={setAssignments}
            prices={prices}
            setPrices={setPrices}
            mixerResult={mixerResult}
            names={names}
            activeBundleHint={activeBundleHint}
            loadPreset={loadPreset}
            loadScratch={loadScratch}
            showPricing={showPricing}
            setShowPricing={setShowPricing}
          />
        )}

        {tab === "notes" && (
          <NotesTab
            notes={notes}
            setNotes={setNotes}
            checklist={checklist}
            setChecklist={setChecklist}
            newChecklistText={newChecklistText}
            setNewChecklistText={setNewChecklistText}
            resetAll={resetAll}
          />
        )}
      </div>
    </div>
  );
}

/* ---------------- Overview ---------------- */
function Overview({ bundleTotals, cheapest, priciest }) {
  const stat = (label, value, note) => (
    <div style={{ ...cardStyle, flex: "1 1 200px" }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: COL.muted, textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4 }}>{value}</div>
      {note ? <div style={{ fontSize: 12, color: COL.inkSoft, marginTop: 3 }}>{note}</div> : null}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        {stat("People", "4", "JC · JY · AC · JeffC")}
        {stat("Devices", "8", "4 phones, 3 Macs, 1 iPad")}
        {stat("Plans compared", "6", "14 priced variants")}
        {stat("Monthly range", `${money(cheapest)}–${money(priciest)}`, "across the 4 curated bundles")}
      </div>

      <div style={cardStyle}>
        <SectionTitle icon={Info}>The core tension</SectionTitle>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: COL.ink, margin: 0 }}>
          Every plan in this comparison trades off the same three levers: <strong>does theft/loss matter for
          this device</strong> (phones: yes; Mac: never offered at all; iPad: only for whoever actually carries
          loss/theft risk), <strong>does this person break things often enough that a shared-dollar-cap plan is
          dangerous</strong> (only JeffC, so far), and <strong>is it worth paying more to isolate a device versus
          pooling it with others</strong>. The four bundles under <em>Recommendations</em> apply those levers
          differently — from "isolate everything that needs it" down to "accept the theft/loss gap for the
          lowest possible bill."
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
        {bundleTotals.map((bt) => {
          const b = BUNDLES.find((x) => x.id === bt.id);
          const Icon = b.badgeIcon;
          return (
            <div key={b.id} style={cardStyle}>
              <Badge color={b.badgeColor} soft={`${b.badgeColor}18`}>
                <Icon size={12} /> {b.badge}
              </Badge>
              <div style={{ fontSize: 15, fontWeight: 700, marginTop: 8 }}>{b.name}</div>
              <div style={{ fontSize: 24, fontWeight: 800, marginTop: 6, fontFamily: FONT_MONO }}>
                {money(bt.total)}<span style={{ fontSize: 13, fontWeight: 500, color: COL.muted }}>/mo</span>
              </div>
              <div style={{ fontSize: 12, color: COL.muted }}>{money(bt.total * 12)}/yr</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Plans ---------------- */
function PlansTab({ expandedPlans, togglePlanExpanded, prices }) {
  const groups = [
    { key: "apple", label: "Apple" },
    { key: "tmobile", label: "T-Mobile / Assurant" },
    { key: "akko", label: "AKKO" },
    { key: "allstate", label: "Allstate / SquareTrade" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
      <SectionTitle
        icon={ShieldCheck}
        sub="Every plan variant from the KB. Expand a card for what's covered, what's excluded, and who it fits. Prices shown reflect your current edits from Mix & match."
      >
        The plans, side by side
      </SectionTitle>

      {groups.map((g) => (
        <div key={g.key}>
          <div style={{ fontSize: 13, fontWeight: 700, color: PROVIDER_COLOR[g.key], marginBottom: 10 }}>
            {g.label}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
            {Object.entries(PLAN_INFO)
              .filter(([, info]) => info.provider === g.key)
              .map(([key, info]) => {
                const expanded = expandedPlans.has(key);
                const theftIcon = /never|not advertised/i.test(info.theftLoss) ? ShieldOff : /limited|capped|only|not clearly|unverified/i.test(info.theftLoss) ? ShieldAlert : ShieldCheck;
                const ThIcon = theftIcon;
                const thColor = ThIcon === ShieldCheck ? COL.good : ThIcon === ShieldAlert ? COL.warn : COL.bad;
                const priceNow = info.poolType === "perOwnerTiered"
                  ? prices.appleCareOneBase
                  : prices[info.priceKey];
                return (
                  <div key={key} style={cardStyle}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <div>
                        <ProviderChip provider={info.provider} />
                        <div style={{ fontSize: 15, fontWeight: 700, marginTop: 6 }}>{info.name}</div>
                      </div>
                      {!info.confirmed && (
                        <span title="Estimate — not itemized precisely in the KB">
                          <HelpCircle size={16} color={COL.warn} />
                        </span>
                      )}
                    </div>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 20, fontWeight: 800, marginTop: 10 }}>
                      {money(priceNow)}<span style={{ fontSize: 12, fontWeight: 500, color: COL.muted }}>/mo{info.poolType !== "perDevice" ? " (pooled/flat)" : ""}</span>
                    </div>
                    <div style={{ fontSize: 12, color: COL.muted, marginBottom: 10 }}>{info.priceLabel}</div>

                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: thColor, marginBottom: 6 }}>
                      <ThIcon size={14} /> {info.theftLoss}
                    </div>
                    <div style={{ fontSize: 12.5, color: COL.inkSoft, marginBottom: 10 }}>
                      Deductible: {info.deductible}
                    </div>

                    <button
                      onClick={() => togglePlanExpanded(key)}
                      style={{
                        display: "flex", alignItems: "center", gap: 4, fontSize: 12.5, fontWeight: 600,
                        color: COL.accent, background: "none", border: "none", cursor: "pointer", padding: 0,
                      }}
                    >
                      {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      {expanded ? "Hide detail" : "What's covered / excluded"}
                    </button>

                    {expanded && (
                      <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${COL.rule}` }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: COL.good, marginBottom: 4 }}>Covered</div>
                        <ul style={{ margin: "0 0 10px", paddingLeft: 18, fontSize: 12.5, color: COL.ink, lineHeight: 1.6 }}>
                          {info.covered.map((c, i) => <li key={i}>{c}</li>)}
                        </ul>
                        <div style={{ fontSize: 12, fontWeight: 700, color: COL.bad, marginBottom: 4 }}>Excluded / watch for</div>
                        <ul style={{ margin: "0 0 10px", paddingLeft: 18, fontSize: 12.5, color: COL.ink, lineHeight: 1.6 }}>
                          {info.excluded.map((c, i) => <li key={i}>{c}</li>)}
                        </ul>
                        <div style={{ fontSize: 12.5, fontStyle: "italic", color: COL.inkSoft }}>{info.fit}</div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Household ---------------- */
function HouseholdTab({ names, setNames }) {
  const riskColor = { moderate: COL.warn, high: COL.bad, "highest-breakage": COL.bad };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <SectionTitle icon={Users} sub="Usage changes which plan's claim-limit structure fits — not just the price. Names are editable — click into a name to relabel it (e.g. before sharing a screenshot).">
        Who's in the household
      </SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
        {PERSONS.map((p) => {
          const devices = DEVICES.filter((d) => d.owner === p.id);
          return (
            <div key={p.id} style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <input
                  value={names[p.id] ?? p.name}
                  onChange={(e) => setNames((prev) => ({ ...prev, [p.id]: e.target.value }))}
                  style={{
                    fontSize: 16, fontWeight: 800, border: "none", borderBottom: `1px dashed ${COL.ruleStrong}`,
                    background: "transparent", color: COL.ink, fontFamily: FONT_SANS, padding: "0 0 2px", width: "60%",
                  }}
                />
                <Badge color={riskColor[p.riskLevel]} soft={`${riskColor[p.riskLevel]}18`}>
                  {p.riskLevel === "highest-breakage" ? "repeat breaker" : `${p.riskLevel} risk`}
                </Badge>
              </div>
              <div style={{ fontSize: 12.5, color: COL.muted, marginBottom: 10 }}>{p.role}</div>

              <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                {devices.map((d) => {
                  const Icon = TYPE_ICON[d.type];
                  return (
                    <span
                      key={d.id}
                      style={{
                        display: "flex", alignItems: "center", gap: 4, fontSize: 12, background: COL.panelAlt,
                        border: `1px solid ${COL.rule}`, borderRadius: 8, padding: "4px 8px",
                      }}
                    >
                      <Icon size={13} /> {d.label}
                    </span>
                  );
                })}
              </div>

              <div style={{ fontSize: 13, marginBottom: 6 }}><strong>Usage:</strong> {p.usage}</div>
              <div style={{ fontSize: 13, marginBottom: 10 }}><strong>Risk:</strong> {p.risk}</div>
              <div
                style={{
                  fontSize: 12.5, fontStyle: "italic", color: COL.inkSoft, background: COL.panelAlt,
                  borderRadius: 8, padding: 10, borderLeft: `3px solid ${riskColor[p.riskLevel]}`,
                }}
              >
                {p.takeaway}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Logic / decision tree ---------------- */
const RULES = [
  { icon: Smartphone, title: "Does it leave the house often?", text: "Phones do, daily. That's the whole reason theft/loss coverage is worth paying for — the everything-else tier doesn't need it." },
  { icon: ShieldOff, title: "Is theft/loss even offered for this device?", text: "Confirmed: Apple never offers theft/loss for Mac, on any plan. iPhone/iPad/Watch can get it from Apple; almost anything can get it from AKKO; T-Mobile HomeTech never offers it at all." },
  { icon: AlertTriangle, title: "Is this person a repeat-breaker?", text: "Only JeffC so far. That doesn't affect his phone (every plan here has unlimited damage claims) — it specifically rules out plans with a shared household-dollar claim cap for his laptop." },
  { icon: Users, title: "Does pooling save money without pooling risk?", text: "JC's laptop and AC's Mac are reasonable pooling candidates — neither is a repeat-breaker. JeffC's laptop is not." },
  { icon: Sparkles, title: "Is AppleCare One worth it for this specific person?", text: "Only pays off once one Apple ID has 3+ eligible devices, or to backfill theft/loss onto a non-phone device (AC: Mac + iPad = 2 devices, one of which unlocks theft/loss she couldn't get any other way from Apple)." },
];

function LogicTab() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <SectionTitle icon={Info} sub="The rules applied, in order, to turn 8 generic devices into 8 specific recommendations.">
        How the recommendation gets derived
      </SectionTitle>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {RULES.map((r, i) => {
          const Icon = r.icon;
          return (
            <div key={i} style={{ ...cardStyle, display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div
                style={{
                  width: 34, height: 34, borderRadius: 8, background: COL.accentSoft, color: COL.accent,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontWeight: 800,
                }}
              >
                {i + 1}
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, fontSize: 14 }}>
                  <Icon size={15} /> {r.title}
                </div>
                <div style={{ fontSize: 13, color: COL.inkSoft, marginTop: 3, lineHeight: 1.5 }}>{r.text}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={cardStyle}>
        <SectionTitle icon={ShieldCheck}>Applying the rules, device by device</SectionTitle>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: `2px solid ${COL.ruleStrong}` }}>
                {["Person", "Device", "Coverage type", "Recommended plan", "Why"].map((h) => (
                  <th key={h} style={{ padding: "8px 10px", color: COL.muted, fontWeight: 700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["All 4", "iPhone 17 Pro Max", "Theft + loss", "AppleCare+ w/ Theft & Loss, per phone", "Still in the eligibility window; keeps each person's own 2/yr claim pool instead of sharing one family pool of 3"],
                ["JY", "(phone only)", "n/a", "Nothing further needed", "Her AppleCare+ plan already covers her only device end-to-end"],
                ["JC", "MacBook Pro", "Breakage-only", "Pooled option (T-Mobile HomeTech or similar)", "Office-context use, lower breakage risk — a reasonable pooling candidate"],
                ["AC", "MacBook Pro + iPad Pro", "Breakage-only (+ theft/loss on iPad)", "Her own AppleCare One (2 devices)", "Transit/rideshare exposure justifies iPad theft/loss; Mac has no theft/loss option regardless"],
                ["JeffC", "MacBook Pro (M2)", "Breakage-only, isolated", "AppleCare+ for Mac, individually", "Repeat-breaker — a shared $5,000/12mo household pool (T-Mobile HomeTech) could get squeezed by his claims alone"],
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${COL.rule}` }}>
                  {row.map((cell, j) => (
                    <td key={j} style={{ padding: "8px 10px", verticalAlign: "top", color: j === 0 ? COL.ink : COL.inkSoft, fontWeight: j === 0 ? 700 : 400 }}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Recommendations ---------------- */
function RecommendationsTab({ bundleTotals, names, onLoadIntoMixer }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <SectionTitle
        icon={Award}
        sub="Not one answer — four ways to apply the same rules with different priorities. There's no constraint against mixing plans across providers per device; pick a starting point and tune it in Mix & match."
      >
        A few recommended options
      </SectionTitle>

      {BUNDLES.map((b) => {
        const totals = bundleTotals.find((t) => t.id === b.id);
        const Icon = b.badgeIcon;
        return (
          <div key={b.id} style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
              <div style={{ flex: "1 1 320px" }}>
                <Badge color={b.badgeColor} soft={`${b.badgeColor}18`}><Icon size={12} /> {b.badge}</Badge>
                <div style={{ fontSize: 18, fontWeight: 800, marginTop: 8 }}>{b.name}</div>
                <div style={{ fontSize: 13, color: COL.inkSoft, marginTop: 2 }}>{b.tagline}</div>
                <p style={{ fontSize: 13, lineHeight: 1.55, marginTop: 10 }}>{b.why}</p>

                <div style={{ fontSize: 12, fontWeight: 700, color: COL.warn, marginTop: 12, marginBottom: 4 }}>Trade-offs</div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: COL.inkSoft, lineHeight: 1.6 }}>
                  {b.tradeoffs.map((t, i) => <li key={i}>{t}</li>)}
                </ul>
              </div>

              <div style={{ flex: "0 0 260px", minWidth: 240 }}>
                <div style={{ background: COL.panelAlt, borderRadius: 10, padding: 14, marginBottom: 10 }}>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 26, fontWeight: 800 }}>
                    {money(totals.total)}<span style={{ fontSize: 13, fontWeight: 500, color: COL.muted }}>/mo</span>
                  </div>
                  <div style={{ fontSize: 12, color: COL.muted }}>{money(totals.total * 12)}/yr for the whole household</div>
                </div>

                <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                  <tbody>
                    {totals.lines.map((l) => (
                      <tr key={l.planKey} style={{ borderBottom: `1px solid ${COL.rule}` }}>
                        <td style={{ padding: "5px 0", color: COL.inkSoft }}>
                          {PLAN_INFO[l.planKey].name}
                          <div style={{ fontSize: 11, color: COL.muted }}>
                            {l.devices.map((d) => `${names[d.owner] ?? d.ownerName} · ${d.label}`).join(" · ")}
                          </div>
                        </td>
                        <td style={{ padding: "5px 0", textAlign: "right", fontFamily: FONT_MONO, whiteSpace: "nowrap" }}>
                          {money(l.cost)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <button
                  onClick={() => onLoadIntoMixer(b.id)}
                  style={{
                    marginTop: 12, width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${COL.ink}`,
                    background: COL.ink, color: "#fdfcf8", fontSize: 12.5, fontWeight: 700, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}
                >
                  <Sliders size={13} /> Load into Mix &amp; match
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- Mixer ---------------- */
function MixerTab({ assignments, setAssignments, prices, setPrices, mixerResult, names, activeBundleHint, loadPreset, loadScratch, showPricing, setShowPricing }) {
  const setDevicePlan = (deviceId, planKey) =>
    setAssignments((prev) => ({ ...prev, [deviceId]: planKey }));

  const setPrice = (key, value) =>
    setPrices((prev) => ({ ...prev, [key]: value === "" ? 0 : parseFloat(value) }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <SectionTitle
        icon={Sliders}
        sub="No constraint on mixing providers per device. Start from a preset (or a blank slate), then override anything — totals recompute live."
      >
        Mix &amp; match
      </SectionTitle>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {BUNDLES.map((b) => (
          <button
            key={b.id}
            onClick={() => loadPreset(b.id)}
            style={tabButtonStyle(activeBundleHint === b.id)}
          >
            Start from: {b.name}
          </button>
        ))}
        <button onClick={loadScratch} style={tabButtonStyle(activeBundleHint === "scratch")}>
          Start from: Scratch
        </button>
      </div>

      <div style={cardStyle}>
        <button
          onClick={() => setShowPricing((s) => !s)}
          style={{
            display: "flex", alignItems: "center", gap: 6, fontSize: 13.5, fontWeight: 700, color: COL.ink,
            background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: showPricing ? 14 : 0,
          }}
        >
          {showPricing ? <ChevronDown size={15} /> : <ChevronRight size={15} />} Edit plan pricing assumptions
        </button>
        {showPricing && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
            {Object.entries(PRICE_LABELS).map(([key, label]) => (
              <div key={key}>
                <label style={{ fontSize: 11.5, color: COL.muted, display: "block", marginBottom: 3 }}>{label}</label>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: COL.muted }}>$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={prices[key]}
                    onChange={(e) => setPrice(key, e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={cardStyle}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: `2px solid ${COL.ruleStrong}` }}>
                {["Person", "Device", "Assigned plan"].map((h) => (
                  <th key={h} style={{ padding: "8px 10px", color: COL.muted, fontWeight: 700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DEVICES.map((d) => {
                const options = Object.entries(PLAN_INFO).filter(([, info]) => info.appliesTo.includes(d.type));
                const Icon = TYPE_ICON[d.type];
                return (
                  <tr key={d.id} style={{ borderBottom: `1px solid ${COL.rule}` }}>
                    <td style={{ padding: "8px 10px", fontWeight: 700 }}>{names[d.owner] ?? d.ownerName}</td>
                    <td style={{ padding: "8px 10px", color: COL.inkSoft }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Icon size={14} /> {d.label}
                      </span>
                    </td>
                    <td style={{ padding: "8px 10px" }}>
                      <select
                        value={assignments[d.id] || ""}
                        onChange={(e) => setDevicePlan(d.id, e.target.value)}
                        style={{ ...inputStyle, fontFamily: FONT_SANS, cursor: "pointer" }}
                      >
                        <option value="">— choose a plan —</option>
                        {options.map(([key, info]) => (
                          <option key={key} value={key}>{info.name}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div style={cardStyle}>
        <SectionTitle icon={Wallet}>Live total</SectionTitle>
        <div style={{ fontFamily: FONT_MONO, fontSize: 30, fontWeight: 800 }}>
          {money(mixerResult.total)}<span style={{ fontSize: 14, fontWeight: 500, color: COL.muted }}>/mo</span>
        </div>
        <div style={{ fontSize: 13, color: COL.muted, marginBottom: 14 }}>{money(mixerResult.total * 12)}/yr</div>

        <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
          <tbody>
            {mixerResult.lines.map((l) => (
              <tr key={l.planKey} style={{ borderBottom: `1px solid ${COL.rule}` }}>
                <td style={{ padding: "7px 0" }}>
                  <ProviderChip provider={PLAN_INFO[l.planKey].provider} />{" "}
                  <span style={{ marginLeft: 6 }}>{PLAN_INFO[l.planKey].name}</span>
                  <div style={{ fontSize: 11.5, color: COL.muted, marginTop: 2 }}>
                    {l.devices.map((d) => `${names[d.owner] ?? d.ownerName} · ${d.label}`).join(" · ")}
                  </div>
                </td>
                <td style={{ padding: "7px 0", textAlign: "right", fontFamily: FONT_MONO }}>{money(l.cost)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ fontSize: 12, color: COL.muted, marginTop: 12, lineHeight: 1.5 }}>
          <Info size={12} style={{ verticalAlign: "-1px", marginRight: 4 }} />
          AppleCare One and the AKKO Plan are billed once per person, not per device, when more than one of
          that person's devices lands on the same plan. T-Mobile HomeTech, AKKO Home / Home Plus, and
          Allstate's family plan are flat household fees regardless of how many devices you point at them.
        </div>
      </div>
    </div>
  );
}

/* ---------------- Notes ---------------- */
function NotesTab({ notes, setNotes, checklist, setChecklist, newChecklistText, setNewChecklistText, resetAll }) {
  const toggleItem = (id) =>
    setChecklist((prev) => prev.map((c) => (c.id === id ? { ...c, done: !c.done } : c)));
  const removeItem = (id) => setChecklist((prev) => prev.filter((c) => c.id !== id));
  const addItem = () => {
    const text = newChecklistText.trim();
    if (!text) return;
    setChecklist((prev) => [...prev, { id: `c${Date.now()}`, text, done: false }]);
    setNewChecklistText("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <SectionTitle icon={StickyNote} sub="This is your space. Edits here are saved in this browser automatically — nothing is sent anywhere.">
        Your notes
      </SectionTitle>

      <div style={cardStyle}>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={8}
          style={{
            width: "100%", fontFamily: FONT_SANS, fontSize: 13.5, lineHeight: 1.6, padding: 12,
            borderRadius: 8, border: `1px solid ${COL.rule}`, background: "#fffdf8", color: COL.ink, resize: "vertical",
          }}
        />
      </div>

      <div style={cardStyle}>
        <SectionTitle icon={HelpCircle}>Open items to verify</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {checklist.map((c) => (
            <div key={c.id} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              <button
                onClick={() => toggleItem(c.id)}
                style={{
                  width: 20, height: 20, borderRadius: 5, flexShrink: 0, marginTop: 1,
                  border: `1px solid ${c.done ? COL.good : COL.ruleStrong}`,
                  background: c.done ? COL.good : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                }}
              >
                {c.done && <Check size={13} color="#fff" />}
              </button>
              <span
                style={{
                  fontSize: 13.5, lineHeight: 1.5, flex: 1,
                  color: c.done ? COL.muted : COL.ink,
                  textDecoration: c.done ? "line-through" : "none",
                }}
              >
                {c.text}
              </span>
              <button
                onClick={() => removeItem(c.id)}
                style={{ background: "none", border: "none", cursor: "pointer", color: COL.muted, padding: 2 }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <input
            value={newChecklistText}
            onChange={(e) => setNewChecklistText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addItem()}
            placeholder="Add an item to verify…"
            style={{ ...inputStyle, fontFamily: FONT_SANS, flex: 1 }}
          />
          <button
            onClick={addItem}
            style={{
              display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 6,
              border: `1px solid ${COL.ink}`, background: COL.ink, color: "#fdfcf8", fontSize: 12.5,
              fontWeight: 700, cursor: "pointer",
            }}
          >
            <Plus size={13} /> Add
          </button>
        </div>
      </div>

      <div style={{ ...cardStyle, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 12.5, color: COL.muted, maxWidth: 480 }}>
          Resets prices, the household mix, notes, and this checklist back to the defaults this file shipped
          with. Your browser's saved copy is cleared too.
        </div>
        <button
          onClick={resetAll}
          style={{
            display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8,
            border: `1px solid ${COL.bad}`, background: COL.badSoft, color: COL.bad, fontSize: 12.5,
            fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
          }}
        >
          <RefreshCcw size={13} /> Reset everything
        </button>
      </div>
    </div>
  );
}
