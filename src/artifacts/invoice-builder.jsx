import React, { useState, useMemo } from "react";
import { Plus, Trash2, Printer, FileText } from "lucide-react";

/* ---------------------------------------------------------------
   TOKENS — shared "ledger" paper/ink aesthetic. Fits an invoice well.
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
};

const FONT_MONO = "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
const FONT_SANS = "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif";

const money = (n) =>
  (isFinite(n) ? n : 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });

let rowId = 0;
const nextRow = () => `r${rowId++}`;

const PRINT_CSS = `
@media print {
  .no-print { display: none !important; }
  .invoice-sheet { border: none !important; box-shadow: none !important; margin: 0 !important; }
  body { background: #fff !important; }
}
`;

export default function InvoiceBuilder() {
  const [business, setBusiness] = useState("Northwind Studio");
  const [client, setClient] = useState("Acme Corp.");
  const [invoiceNo, setInvoiceNo] = useState("INV-0007");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [taxRate, setTaxRate] = useState(8.5);
  const [items, setItems] = useState(() => [
    { id: nextRow(), desc: "Design consultation", qty: 4, price: 120 },
  ]);

  const update = (id, patch) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  const addItem = () =>
    setItems((prev) => [...prev, { id: nextRow(), desc: "", qty: 1, price: 0 }]);
  const removeItem = (id) => setItems((prev) => prev.filter((it) => it.id !== id));

  const { subtotal, tax, total } = useMemo(() => {
    const sub = items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.price) || 0), 0);
    const t = sub * ((Number(taxRate) || 0) / 100);
    return { subtotal: sub, tax: t, total: sub + t };
  }, [items, taxRate]);

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
      <style>{PRINT_CSS}</style>
      <div style={{ width: "100%", maxWidth: "720px" }}>
        {/* Toolbar (hidden in print) */}
        <div
          className="no-print"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "18px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
            <FileText size={18} color={C.accent} />
            <span style={{ fontFamily: FONT_MONO, fontSize: "12px", letterSpacing: "0.06em", textTransform: "uppercase", color: C.muted }}>
              Invoice builder
            </span>
          </div>
          <button
            onClick={() => window.print()}
            style={{
              display: "flex",
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
              padding: "10px 18px",
              cursor: "pointer",
            }}
          >
            <Printer size={15} /> Print
          </button>
        </div>

        {/* The invoice sheet */}
        <div
          className="invoice-sheet"
          style={{
            background: C.panel,
            border: `1px solid ${C.ruleStrong}`,
            borderRadius: "8px",
            padding: "34px 34px 30px",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "20px",
              paddingBottom: "22px",
              borderBottom: `2px solid ${C.ink}`,
            }}
          >
            <div style={{ flex: 1 }}>
              <LabeledInput
                label="From"
                value={business}
                onChange={setBusiness}
                big
              />
              <div style={{ marginTop: "12px" }}>
                <LabeledInput label="Bill to" value={client} onChange={setClient} />
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: "28px",
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  color: C.ink,
                }}
              >
                Invoice
              </div>
              <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-end" }}>
                <FieldPair label="Invoice #" value={invoiceNo} onChange={setInvoiceNo} />
                <FieldPair label="Date" value={date} onChange={setDate} type="date" />
              </div>
            </div>
          </div>

          {/* Line-item table */}
          <div style={{ marginTop: "22px" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 70px 110px 110px 34px",
                gap: "10px",
                fontFamily: FONT_MONO,
                fontSize: "10px",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: C.muted,
                paddingBottom: "8px",
                borderBottom: `1px solid ${C.rule}`,
              }}
            >
              <span>Description</span>
              <span style={{ textAlign: "right" }}>Qty</span>
              <span style={{ textAlign: "right" }}>Unit price</span>
              <span style={{ textAlign: "right" }}>Amount</span>
              <span></span>
            </div>

            {items.map((it) => {
              const amount = (Number(it.qty) || 0) * (Number(it.price) || 0);
              return (
                <div
                  key={it.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 70px 110px 110px 34px",
                    gap: "10px",
                    alignItems: "center",
                    padding: "10px 0",
                    borderBottom: `1px solid ${C.rule}`,
                  }}
                >
                  <input
                    value={it.desc}
                    onChange={(e) => update(it.id, { desc: e.target.value })}
                    placeholder="Item description"
                    style={cellInput(FONT_SANS, "left")}
                  />
                  <input
                    type="number"
                    min={0}
                    value={it.qty}
                    onChange={(e) => update(it.id, { qty: e.target.value })}
                    style={cellInput(FONT_MONO, "right")}
                  />
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={it.price}
                    onChange={(e) => update(it.id, { price: e.target.value })}
                    style={cellInput(FONT_MONO, "right")}
                  />
                  <span style={{ fontFamily: FONT_MONO, fontSize: "14px", textAlign: "right", color: C.ink }}>
                    {money(amount)}
                  </span>
                  <button
                    className="no-print"
                    onClick={() => removeItem(it.id)}
                    aria-label="Remove item"
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
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              );
            })}

            <button
              className="no-print"
              onClick={addItem}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                marginTop: "14px",
                fontFamily: FONT_MONO,
                fontSize: "11px",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                fontWeight: 600,
                color: C.accent,
                background: C.accentSoft,
                border: `1px solid ${C.accent}`,
                borderRadius: "4px",
                padding: "8px 12px",
                cursor: "pointer",
              }}
            >
              <Plus size={13} /> Add line item
            </button>
          </div>

          {/* Totals */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px" }}>
            <div style={{ width: "280px" }}>
              <TotalRow label="Subtotal" value={money(subtotal)} />
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 0",
                  borderBottom: `1px solid ${C.rule}`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontFamily: FONT_MONO, fontSize: "13px", color: C.inkSoft }}>
                  Tax
                  <input
                    type="number"
                    min={0}
                    step="0.1"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    className="tax-input"
                    style={{
                      width: "56px",
                      fontFamily: FONT_MONO,
                      fontSize: "13px",
                      textAlign: "right",
                      color: C.ink,
                      background: C.paper,
                      border: `1px solid ${C.rule}`,
                      borderRadius: "3px",
                      padding: "2px 5px",
                    }}
                  />
                  <span>%</span>
                </div>
                <span style={{ fontFamily: FONT_MONO, fontSize: "14px" }}>{money(tax)}</span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 0 0",
                }}
              >
                <span style={{ fontFamily: FONT_MONO, fontSize: "13px", letterSpacing: "0.04em", textTransform: "uppercase", fontWeight: 700 }}>
                  Total
                </span>
                <span style={{ fontFamily: FONT_MONO, fontSize: "22px", fontWeight: 700, color: C.accent }}>
                  {money(total)}
                </span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: "28px", paddingTop: "16px", borderTop: `1px solid ${C.rule}`, fontFamily: FONT_MONO, fontSize: "11px", color: C.muted }}>
            Thank you for your business.
          </div>
        </div>
      </div>
    </div>
  );
}

const cellInput = (family, align) => ({
  fontFamily: family,
  fontSize: "14px",
  color: C.ink,
  background: "transparent",
  border: "none",
  borderBottom: `1px solid transparent`,
  padding: "3px 0",
  width: "100%",
  textAlign: align,
  outline: "none",
});

function LabeledInput({ label, value, onChange, big }) {
  return (
    <div>
      <div
        style={{
          fontFamily: FONT_MONO,
          fontSize: "10px",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: C.muted,
          marginBottom: "3px",
        }}
      >
        {label}
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          fontFamily: FONT_SANS,
          fontSize: big ? "20px" : "15px",
          fontWeight: big ? 700 : 500,
          color: C.ink,
          background: "transparent",
          border: "none",
          borderBottom: `1px solid ${C.rule}`,
          padding: "2px 0",
          width: "100%",
          outline: "none",
        }}
      />
    </div>
  );
}

function FieldPair({ label, value, onChange, type = "text" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <span style={{ fontFamily: FONT_MONO, fontSize: "10px", letterSpacing: "0.06em", textTransform: "uppercase", color: C.muted }}>
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          fontFamily: FONT_MONO,
          fontSize: "13px",
          color: C.ink,
          background: C.paper,
          border: `1px solid ${C.rule}`,
          borderRadius: "3px",
          padding: "4px 8px",
          textAlign: "right",
          outline: "none",
        }}
      />
    </div>
  );
}

function TotalRow({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "8px 0",
        borderBottom: `1px solid ${C.rule}`,
        fontFamily: FONT_MONO,
        fontSize: "13px",
        color: C.inkSoft,
      }}
    >
      <span>{label}</span>
      <span style={{ fontSize: "14px", color: C.ink }}>{value}</span>
    </div>
  );
}
