"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { listSubjects, addCard, type Subject } from "@/lib/localdb";

/* ---------- Navbar ---------- */
function FlashcardsNewNavbar({ onBack }: { onBack: () => void }) {
  return (
    <div style={navsx.edge}>
      <div style={navsx.wrap as React.CSSProperties}>
        <div style={navsx.row}>
          <button type="button" aria-label="Tilbake" style={navsx.backBtn} onClick={onBack}>
            ←
          </button>
          <div style={navsx.centerTitle}>Create Flashcards</div>
          <div />
        </div>
      </div>
    </div>
  );
}

export default function FlashcardsNewPage() {
  const params = useParams<{ id: string; subjectId: string }>();
  const router = useRouter();
  const boardKey = decodeURIComponent(params.id || "untitled");
  const subjectId = decodeURIComponent(params.subjectId || "");

  const [subject, setSubject] = useState<Subject | null>(null);
  const [q, setQ] = useState("");
  const [a, setA] = useState("");
  const canAdd = q.trim().length > 0 && a.trim().length > 0;

  function refresh() {
    const subs = listSubjects(boardKey);
    setSubject(subs.find((s) => s.id === subjectId) ?? null);
  }
  useEffect(() => { refresh(); }, [boardKey, subjectId]);

  const cardsSorted = useMemo(
    () =>
      subject
        ? [...subject.cards].sort(
            (x, y) =>
              new Date(y.createdAt as any).getTime() -
              new Date(x.createdAt as any).getTime()
          )
        : [],
    [subject?.cards]
  );

  function addCardLocal() {
    if (!subject || !canAdd) return;
    addCard(boardKey, subject.id, q.trim(), a.trim());
    setQ(""); setA("");
    refresh();
  }

  return (
    <>
      <FlashcardsNewNavbar
        onBack={() =>
          router.replace(
            `/boards/${encodeURIComponent(boardKey)}/subjects/${encodeURIComponent(subjectId)}/flashcards`
          )
        }
      />

      <main style={sx.page}>
        <section style={sx.shell}>
          <h1 style={sx.subjectTitle}>Create Flashcards</h1>
          <h2 style={sx.h2}>
            Add questions & answers for {subject?.name?.toLowerCase?.() || "this subject"}
          </h2>

          {/* Form-kort */}
          <div style={sx.formCard}>
            <label style={sx.label}>Question</label>
            <textarea
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Write your question…"
              style={sx.textarea as React.CSSProperties}
            />
            <label style={sx.label}>Answer</label>
            <textarea
              value={a}
              onChange={(e) => setA(e.target.value)}
              placeholder="Write the answer…"
              style={sx.textarea as React.CSSProperties}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <Link
                href={`/boards/${encodeURIComponent(boardKey)}/subjects/${encodeURIComponent(
                  subjectId
                )}/flashcards/practice`}
                style={{ textDecoration: "none" }}
              >
                <button type="button" style={sx.ghost}>Practice</button>
              </Link>
              <button type="button" style={sx.primary} disabled={!canAdd} onClick={addCardLocal}>
                Add Card
              </button>
            </div>
          </div>

          {/* Liste over eksisterende kort */}
          <div style={sx.listCard}>
            <div style={sx.listHeaderRow}>
              <div style={sx.listHeaderTitle}>All Cards</div>
              <div style={sx.metaSmall}>{cardsSorted.length} total</div>
            </div>
            {cardsSorted.length === 0 ? (
              <div style={{ color: "#6B7280" }}>No cards yet.</div>
            ) : (
              <div style={sx.cardsList}>
                {cardsSorted.map((c) => (
                  <div key={c.id} style={sx.cardRow}>
                    <div style={sx.qText}>{c.q || "Untitled"}</div>
                    <div style={sx.aText}>{c.a || "—"}</div>
                    <div style={sx.metaSmall}>
                      {new Date(c.createdAt as any).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
  page: {
    minHeight: "100vh",
    background: BG,
    display: "grid",
    placeItems: "center",
    padding: 20,
    paddingTop: 100, // luft til navbar
  },
  shell: {
    width: "min(760px, 94vw)",
    background: SHELL_BG,
    borderRadius: 24,
    border: `1px solid ${BORDER}`,
    boxShadow: "0 18px 36px rgba(0,0,0,0.06)",
    padding: 20,
  },

  subjectTitle: { textAlign: "center", fontSize: 32, fontWeight: 900, color: "#35507A", margin: "18px 0 4px" },
  h2: { textAlign: "center", fontSize: 18, fontWeight: 800, color: TEXT, margin: "0 0 14px" },

  formCard: {
    background: "#FFFFFF", border: "1px solid #ECECEC", borderRadius: 18, padding: 16,
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)", display: "grid", gap: 8, marginBottom: 14,
  },
  label: { fontWeight: 900, color: TEXT },
  textarea: {
    border: "1px solid #E5E7EB", background: "#FFFFFF", borderRadius: 12, padding: "10px 12px",
    minHeight: 72, outline: "none", resize: "vertical", color: TEXT,
  },
  primary: {
    padding: "10px 14px", borderRadius: 12, background: ACCENT, color: "#fff",
    border: "none", fontWeight: 900, cursor: "pointer",
  },
  ghost: {
    padding: "10px 14px", borderRadius: 12, background: "#F4F4F5", color: TEXT,
    border: "none", fontWeight: 800, cursor: "pointer",
  },

  listCard: {
    background: "#FFFFFF", border: "1px solid #ECECEC", borderRadius: 18, padding: 16,
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
  },
  listHeaderRow: { display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 },
  listHeaderTitle: { fontWeight: 900, color: TEXT, fontSize: 18 },
  cardsList: { display: "grid", gap: 10 },
  cardRow: { display: "grid", gap: 4, padding: "10px 12px", border: "1px solid #F2F2F2", borderRadius: 14, background: "#fff" },
  qText: { fontWeight: 800, color: TEXT },
  aText: { color: "#1F2937" },
  metaSmall: { color: SUB, fontSize: 12 },
};

/* Navbar styles */
const navsx: Record<string, React.CSSProperties> = {
  edge: { position: "fixed", top: 0, left: 0, right: 0, zIndex: 60, padding: "12px 12px 0" },
  wrap: {
    background: "#E9DFCF", border: "1px solid #D9CEB9", borderRadius: 20,
    padding: 14, boxShadow: "0 18px 40px rgba(0,0,0,.08)",
    width: "min(760px, 96vw)", margin: "0 auto",
  },
  row: { display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center" },
  backBtn: {
    width: 42, height: 42, borderRadius: 21, display: "grid", placeItems: "center",
    background: "#DFD5C6", border: "1px solid #D9CEB9", cursor: "pointer",
    color: "#1b1b1b", fontWeight: 900, fontSize: 18,
  },
  centerTitle: { justifySelf: "center", fontWeight: 900, color: "#1b1b1b" },
};
