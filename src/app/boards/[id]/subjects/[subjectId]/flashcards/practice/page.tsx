"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { listSubjects, type Subject } from "@/lib/localdb";

/* ---------------- Navbar ---------------- */
function PracticeNavbar({
  onBack,
  shuffle,
  setShuffle,
}: {
  onBack: () => void;
  shuffle: boolean;
  setShuffle: (v: boolean) => void;
}) {
  return (
    <div style={navsx.edge}>
      <div style={navsx.wrap as React.CSSProperties}>
        <div style={navsx.row}>
          <button type="button" aria-label="Tilbake" style={navsx.backBtn} onClick={onBack}>
            ←
          </button>
          <div style={navsx.centerTitle}>Practice</div>
          <label style={navsx.chk}>
            <input
              type="checkbox"
              checked={shuffle}
              onChange={(e) => setShuffle(e.target.checked)}
            />
            Shuffle
          </label>
        </div>
      </div>
    </div>
  );
}

export default function FlashcardsPracticePage() {
  const params = useParams<{ id: string; subjectId: string }>();
  const router = useRouter();
  const boardKey = decodeURIComponent(params.id || "untitled");
  const subjectId = decodeURIComponent(params.subjectId || "");

  const [subject, setSubject] = useState<Subject | null>(null);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [shuffle, setShuffle] = useState(true);

  function refresh() {
    const subs = listSubjects(boardKey);
    setSubject(subs.find((s) => s.id === subjectId) ?? null);
  }
  useEffect(() => { refresh(); }, [boardKey, subjectId]);

  const deck = useMemo(() => {
    const cards = subject?.cards ?? [];
    const arr = [...cards].sort(
      (a, b) => new Date(a.createdAt as any).getTime() - new Date(b.createdAt as any).getTime()
    );
    if (!shuffle) return arr;
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [subject?.cards, shuffle]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === " " || e.key.toLowerCase() === "f") { e.preventDefault(); setFlipped((v) => !v); }
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [idx, deck.length]);

  function next() { setFlipped(false); setIdx((i) => (i + 1) % Math.max(1, deck.length)); }
  function prev() { setFlipped(false); setIdx((i) => (i - 1 + Math.max(1, deck.length)) % Math.max(1, deck.length)); }
  function restart() { setIdx(0); setFlipped(false); }

  const card = deck[idx];

  return (
    <>
      <PracticeNavbar
        onBack={() => router.replace(`/boards/${encodeURIComponent(boardKey)}/subjects/${encodeURIComponent(subjectId)}/flashcards`)}
        shuffle={shuffle}
        setShuffle={(v) => { setShuffle(v); restart(); }}
      />

      <main style={sx.page}>
        <section style={sx.shell}>
          <h1 style={sx.subjectTitle}>{subject?.name || "Flashcards"}</h1>
          <h2 style={sx.h2}>Study your cards</h2>

          {/* Progress */}
          <div style={sx.controlsRow}>
            <div style={sx.progress}>
              <div style={{ ...sx.progressBar, width: `${deck.length ? ((idx + 1) / deck.length) * 100 : 0}%` }} />
            </div>
            <div style={sx.progressText}>
              {deck.length ? `${idx + 1}/${deck.length}` : "0/0"}
            </div>
          </div>

          {!deck.length ? (
            <div style={sx.emptyWrap}>
              <div style={{ color: "#6B7280" }}>No cards yet.</div>
              <Link
                href={`/boards/${encodeURIComponent(boardKey)}/subjects/${encodeURIComponent(subjectId)}/flashcards/new`}
                style={{ textDecoration: "none" }}
              >
                <button type="button" style={sx.primary}>Create cards</button>
              </Link>
            </div>
          ) : (
            <>
              {/* Flashcard */}
              <div style={sx.viewerWrap}>
                <div
                  style={{
                    ...sx.card3d,
                    transform: `translateZ(0) rotateY(${flipped ? 180 : 0}deg)`,
                  }}
                  onClick={() => setFlipped((v) => !v)}
                  aria-label="Flashcard"
                >
                  <div style={{ ...sx.face, backfaceVisibility: "hidden" }}>
                    <div style={sx.faceLabel}>Question</div>
                    <div style={sx.faceText}>{card.q || "—"}</div>
                    <div style={sx.hint}>Click / Space to flip</div>
                  </div>
                  <div style={{ ...sx.face, transform: "rotateY(180deg)", backfaceVisibility: "hidden" }}>
                    <div style={sx.faceLabel}>Answer</div>
                    <div style={sx.faceText}>{card.a || "—"}</div>
                  </div>
                </div>
              </div>

              {/* Nav */}
              <div style={sx.navRow}>
                <button type="button" style={sx.ghost} onClick={prev}>← Prev</button>
                <button type="button" style={sx.pill} onClick={() => setFlipped((v) => !v)}>
                  {flipped ? "Show Question" : "Show Answer"}
                </button>
                <button type="button" style={sx.ghost} onClick={next}>Next →</button>
              </div>
            </>
          )}
        </section>
      </main>
    </>
  );
}

/* ---------------- styles ---------------- */
const BG = "#F5ECE0";
const SHELL_BG = "#F5EFE7";
const TEXT = "#0F172A";
const SUB = "#6B7280";
const BORDER = "#E7E2D9";
const ACCENT = "#111827";

const sx: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: BG, display: "grid", placeItems: "center", padding: 20 },
  shell: { width: "min(760px, 94vw)", background: SHELL_BG, borderRadius: 24, border: `1px solid ${BORDER}`, boxShadow: "0 18px 36px rgba(0,0,0,0.06)", padding: 20 },

  subjectTitle: { textAlign: "center", fontSize: 32, fontWeight: 900, color: "#35507A", margin: "18px 0 4px" },
  h2: { textAlign: "center", fontSize: 18, fontWeight: 800, color: TEXT, margin: "0 0 14px" },

  controlsRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 12 },
  progress: { position: "relative", height: 8, background: "#EEE8DD", borderRadius: 999, overflow: "hidden", flex: 1 },
  progressBar: { height: "100%", background: "#3B4C9A" },
  progressText: { fontWeight: 800, color: TEXT, marginLeft: 8 },

  emptyWrap: { display: "grid", placeItems: "center", gap: 10, padding: 24, background: "#fff", borderRadius: 18, border: "1px solid #ECECEC", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" },

  viewerWrap: { display: "grid", placeItems: "center", padding: "10px 0 12px" },
  card3d: { width: "min(560px, 90vw)", height: 280, borderRadius: 22, border: "1px solid #EDE7DA", background: "#FFFFFF", boxShadow: "0 14px 36px rgba(0,0,0,0.10)", transformStyle: "preserve-3d", transition: "transform .5s ease", cursor: "pointer", position: "relative" },
  face: { position: "absolute", inset: 0, display: "grid", gridTemplateRows: "auto 1fr auto", padding: 18, borderRadius: 22 },
  faceLabel: { fontWeight: 900, color: "#3B4C9A" },
  faceText: { alignSelf: "center", fontSize: 24, fontWeight: 800, color: TEXT, textAlign: "center", lineHeight: 1.4 },
  hint: { justifySelf: "center", color: SUB, fontSize: 13 },

  navRow: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginTop: 8 },
  ghost: { padding: "10px 14px", borderRadius: 12, background: "#F4F4F5", color: TEXT, border: "none", fontWeight: 800, cursor: "pointer" },
  pill: { padding: "10px 18px", borderRadius: 999, background: "#FFFFFF", border: "1px solid #E6E6E6", boxShadow: "0 2px 6px rgba(0,0,0,0.04)", fontWeight: 900, color: TEXT, cursor: "pointer" },
  primary: { padding: "10px 14px", borderRadius: 12, background: ACCENT, color: "#fff", border: "none", fontWeight: 900, cursor: "pointer" },
};

/* Navbar styles */
const navsx: Record<string, React.CSSProperties> = {
  edge: { margin: "12px 12px 0 12px" },
  wrap: { background: "#E9DFCF", border: "1px solid #D9CEB9", borderRadius: 20, padding: 14, boxShadow: "0 18px 40px rgba(0,0,0,.08)" },
  row: { display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center", gap: 14 },
  backBtn: { width: 42, height: 42, borderRadius: 21, display: "grid", placeItems: "center", background: "#DFD5C6", border: "1px solid #D9CEB9", cursor: "pointer", color: "#1b1b1b", fontWeight: 900, fontSize: 18 },
  centerTitle: { justifySelf: "center", fontWeight: 900, color: "#1b1b1b" },
  chk: { display: "flex", alignItems: "center", gap: 8, fontWeight: 800, color: "#1b1b1b" },
};
