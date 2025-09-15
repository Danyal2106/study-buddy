"use client";
import React from "react";
import { type Subject } from "@/lib/localdb";

export default function SubjectListItem({ subject }: { subject: Subject }) {
  return (
    <div style={sx.subjectRow}>
      <div style={{ display: "grid", gap: 2 }}>
        <div style={{ fontWeight: 800, color: TEXT }}>
          {subject.name || "Untitled Subject"}
        </div>
        <div style={{ color: MUTED, fontSize: 12 }}>
          {new Date(subject.createdAt).toLocaleDateString()}
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span style={sx.countBadge} title="Antall notater">
          📝 {subject.notes.length}
        </span>
        <span style={sx.countBadge} title="Antall flashcards">
          🃏 {subject.cards.length}
        </span>
        <span aria-hidden style={{ color: MUTED, fontSize: 18 }}>›</span>
      </div>
    </div>
  );
}

/* ---- styles (lokalt i denne filen) ---- */
const TEXT = "#1F2937";
const MUTED = "#6B7280";
const BORDER = "#E5E7EB";

const sx: Record<string, React.CSSProperties> = {
  subjectRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    border: `1px solid ${BORDER}`,
    cursor: "pointer",
    background: "#FFF",
  },
  countBadge: {
    border: `1px solid ${BORDER}`,
    borderRadius: 999,
    padding: "6px 8px",
    fontSize: 12,
    color: TEXT,
    background: "#FFF",
  },
};
