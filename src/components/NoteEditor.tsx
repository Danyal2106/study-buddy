"use client";
import React, { useState } from "react";

type NotePayload = { title: string; body: string };
export default function NoteEditor({ onSave }: { onSave: (payload: NotePayload) => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const validTitle = title.trim().length > 0;
  const validBody = body.trim().length >= 3;
  const canSave = validTitle && validBody;

  function save() {
    if (!canSave) return;
    onSave({ title: title.trim(), body: body.trim() });
    setTitle("");
    setBody("");
  }

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Tittel (påkrevd)"
        style={sx.input as React.CSSProperties}
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Skriv gode, konkrete notater (min. 3 tegn)…"
        style={sx.textarea as React.CSSProperties}
      />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <small style={{ color: MUTED }}>
          {!validTitle ? "Tittel må fylles ut." : !validBody ? "Skriv litt mer i notatet." : ""}
        </small>
        <button
          type="button"
          style={{ ...sx.smallPrimary, opacity: canSave ? 1 : 0.6, pointerEvents: canSave ? "auto" : "none" }}
          onClick={save}
        >
          Lagre notat
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
  textarea: {
    border: `1px solid ${BORDER}`,
    background: "#F6F7FA",
    padding: "12px 14px",
    borderRadius: 14,
    color: TEXT,
    outline: "none",
    minHeight: 96,
    resize: "vertical",
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
