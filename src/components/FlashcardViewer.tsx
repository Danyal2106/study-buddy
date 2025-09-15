"use client";
import React, { useMemo, useState } from "react";
import type { Card as DBCard } from "@/lib/localdb"; // <- bruk samme type som i localdb

export default function FlashcardViewer({ cards }: { cards: DBCard[] }) {
  const total = cards.length;
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [seed, setSeed] = useState(0); // for å reshuffle

  // Lag en stabil, seed-basert rekkefølge
  const order = useMemo(() => {
    const indices = Array.from({ length: total }, (_, i) => i);
    // enkel pseudo-random basert på seed
    function rand(n: number) {
      const x = Math.sin(n + seed) * 10000;
      return x - Math.floor(x);
    }
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(rand(i) * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices;
  }, [total, seed]);

  const current = total > 0 ? cards[order[idx]] : null;

  function next() {
    setFlipped(false);
    setIdx((i) => (i + 1) % Math.max(total, 1));
  }
  function prev() {
    setFlipped(false);
    setIdx((i) => (i - 1 + Math.max(total, 1)) % Math.max(total, 1));
  }
  function shuffle() {
    setFlipped(false);
    setIdx(0);
    setSeed((s) => s + 1);
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ color: MUTED }}>
          {total === 0 ? "Ingen kort" : `Kort ${Math.min(idx + 1, total)} / ${total}`}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" style={sx.ghost} onClick={shuffle} disabled={total === 0}>
            Shuffle
          </button>
          <button type="button" style={sx.ghost} onClick={prev} disabled={total === 0}>
            ‹ Forrige
          </button>
          <button
            type="button"
            style={sx.primary}
            onClick={() => setFlipped((f) => !f)}
            disabled={total === 0}
          >
            {flipped ? "Skjul svar" : "Vis svar"}
          </button>
          <button type="button" style={sx.ghost} onClick={next} disabled={total === 0}>
            Neste ›
          </button>
        </div>
      </div>

      {/* Selve “kortet” */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setFlipped((f) => !f)}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") setFlipped((f) => !f);
          if (e.key === "ArrowRight") next();
          if (e.key === "ArrowLeft") prev();
        }}
        style={sx.card}
        aria-label={flipped ? "Flashcard – bakside" : "Flashcard – forside"}
      >
        <div style={{ ...sx.face, opacity: flipped ? 0 : 1 }}>
          <div style={sx.faceTitle}>Spørsmål</div>
          <div style={sx.faceText}>{current?.q || ""}</div>
          <div style={sx.hint}>Klikk/space for å flippe</div>
        </div>
        <div style={{ ...sx.face, position: "absolute", inset: 0, opacity: flipped ? 1 : 0 }}>
          <div style={sx.faceTitle}>Svar</div>
          <div style={sx.faceText}>{current?.a || ""}</div>
          <div style={sx.hint}>Klikk/space for å flippe</div>
        </div>
      </div>
    </div>
  );
}

/* ---- styles (lokalt i denne filen) ---- */
const TEXT = "#1F2937";
const MUTED = "#6B7280";
const BORDER = "#E5E7EB";
const ACCENT = "#111827";
const CARD_BG = "#FFFFFF";
const R = 16;

const sx: Record<string, React.CSSProperties> = {
  primary: {
    padding: "8px 10px",
    borderRadius: 10,
    background: ACCENT,
    color: "#fff",
    border: "none",
    fontWeight: 800,
    cursor: "pointer",
  },
  ghost: {
    padding: "8px 10px",
    borderRadius: 10,
    background: "#F4F4F5",
    color: TEXT,
    border: "none",
    fontWeight: 800,
    cursor: "pointer",
  },
  card: {
    position: "relative",
    background: CARD_BG,
    border: `1px solid ${BORDER}`,
    borderRadius: R,
    minHeight: 180,
    padding: 16,
    display: "grid",
    placeItems: "center",
    overflow: "hidden",
    transition: "transform 0.2s ease",
  },
  face: {
    display: "grid",
    gap: 6,
    textAlign: "center",
    transition: "opacity 0.15s ease",
  },
  faceTitle: { fontWeight: 900, color: MUTED, fontSize: 12, letterSpacing: 0.5 },
  faceText: { color: TEXT, fontSize: 18, fontWeight: 700 },
  hint: { color: MUTED, fontSize: 12, marginTop: 8 },
};
