"use client";
import React, { useState } from "react";

export default function FlashcardEditor({ onSave }: { onSave: (q: string, a: string) => void }) {
  const [q, setQ] = useState("");
  const [a, setA] = useState("");
  const canSave = q.trim().length > 0 && a.trim().length > 0;

  function save() {
    if (!canSave) return;
    onSave(q.trim(), a.trim());
    setQ("");
    setA("");
  }

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Forside: spørsmål / begrep…"
        style={sx.input as React.CSSProperties}
      />
      <input
        value={a}
        onChange={(e) => setA(e.target.value)}
        placeholder="Bakside: svar / forklaring…"
        style={sx.input as React.CSSProperties}
      />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <small style={{ color: MUTED }}>
          {canSave ? "" : "Både spørsmål og svar må fylles ut."}
        </small>
        <button
          type="button"
          style={{ ...sx.smallPrimary, opacity: canSave ? 1 : 0.6, pointerEvents: canSave ? "auto" : "none" }}
          onClick={save}
        >
          Legg til kort
        </button>
      </div>
    </div>
  );
}

/* ---- styles (lokalt i denne filen) ---- */
const TEXT = "#1F2937";
const MUTED = "#6B7280";
const BORDER = "#E5E7EB";
const ACCENT = "#111827";

const sx: Record<string, React.CSSProperties> = {
  input: {
    border: `1px solid ${BORDER}`,
    background: "#F6F7FA",
    padding: "12px 14px",
    borderRadius: 14,
    color: TEXT,
    outline: "none",
  },
  smallPrimary: {
    padding: "8px 10px",
    borderRadius: 10,
    background: ACCENT,
    color: "#fff",
    border: "none",
    fontWeight: 800,
    cursor: "pointer",
  },
};
