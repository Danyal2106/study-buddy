"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { listSubjects, type Subject } from "@/lib/localdb";

/* ---------------- Navbar (samme stil som de andre skjermene) ---------------- */
function FlashNavbar({
  onBack,
  query,
  setQuery,
  fontPx,
  setFontPx,
  focusMode,
  setFocusMode,
}: {
  onBack: () => void;
  query: string;
  setQuery: (v: string) => void;
  fontPx: number;
  setFontPx: (px: number) => void;
  focusMode: boolean;
  setFocusMode: (v: boolean) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div style={navsx.edge}>
      <div style={navsx.wrap as React.CSSProperties}>
        <div style={navsx.row}>
          {/* Back */}
          <button type="button" aria-label="Tilbake" style={navsx.backBtn} onClick={onBack}>
            ←
          </button>

          {/* Search (kun tekstinput for nå) */}
          <div style={navsx.search as React.CSSProperties}>
            <span style={navsx.searchIcon}>⌕</span>
            <input
              placeholder="Find card…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Find card"
              style={navsx.searchInput as React.CSSProperties}
            />
          </div>

          {/* Filters */}
          <div style={{ position: "relative" }}>
            <button type="button" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen((v) => !v)} style={navsx.filterBtn}>
              <span style={navsx.filterDot} aria-hidden />
              Filters
            </button>
            {open && (
              <div role="dialog" aria-label="Filters" style={navsx.pop}>
                <div style={{ display: "grid", gap: 10 }}>
                  <div style={navsx.fGroup}>
                    <div style={navsx.fLabel}>Text size</div>
                    <div style={navsx.fRow}>
                      {[14, 16, 18, 20].map((px) => (
                        <button
                          key={px}
                          type="button"
                          onClick={() => setFontPx(px)}
                          style={{ ...navsx.fChip, ...(fontPx === px ? navsx.fChipOn : {}) }}
                        >
                          {px}px
                        </button>
                      ))}
                    </div>
                  </div>
                  <label style={navsx.fCheck}>
                    <input type="checkbox" checked={focusMode} onChange={(e) => setFocusMode(e.target.checked)} />
                    Focus mode
                  </label>
                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    <button type="button" style={navsx.resetBtn} onClick={() => { setFontPx(16); setFocusMode(false); }}>
                      Reset
                    </button>
                    <button type="button" style={navsx.doneBtn} onClick={() => setOpen(false)}>
                      Done
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FlashcardsPage() {
  const params = useParams<{ id: string; subjectId: string }>();
  const router = useRouter();
  const boardKey = decodeURIComponent(params.id || "untitled");
  const subjectId = decodeURIComponent(params.subjectId || "");

  const [subject, setSubject] = useState<Subject | null>(null);
  const [query, setQuery] = useState("");
  const [fontPx, setFontPx] = useState(16);
  const [focusMode, setFocusMode] = useState(false);

  useEffect(() => {
    const subs = listSubjects(boardKey);
    setSubject(subs.find((s) => s.id === subjectId) ?? null);
  }, [boardKey, subjectId]);

  const cards = subject?.cards ?? [];
  const cardsSorted = useMemo(
    () =>
      [...cards]
        .filter((c) => !query || c.q?.toLowerCase().includes(query.toLowerCase()))
        .sort((a, b) => new Date(b.createdAt as any).getTime() - new Date(a.createdAt as any).getTime()),
    [cards, query]
  );

  return (
    <>
      <FlashNavbar onBack={() => router.replace(`/boards/${encodeURIComponent(boardKey)}/subjects/${encodeURIComponent(subjectId)}`)} query={query} setQuery={setQuery} fontPx={fontPx} setFontPx={setFontPx} focusMode={focusMode} setFocusMode={setFocusMode} />

      <main style={{ ...sx.page, ...(focusMode ? { background: "#F0ECE4" } : null) }}>
        <section style={sx.shell}>
          <h1 style={sx.subjectTitle}>Flashcards</h1>
          <h2 style={sx.h2}>Create and practice flashcards</h2>

          {/* Action-cards */}
          <div style={sx.cardList}>
            <Link href={`/boards/${encodeURIComponent(boardKey)}/subjects/${encodeURIComponent(subjectId)}/flashcards/practice`} style={{ textDecoration: "none" }}>
              <div style={sx.actionCard}>
                <div style={sx.iconWrap}>
                  <PlayIcon />
                </div>
                <div>
                  <div style={sx.cardTitle}>Practice</div>
                  <div style={sx.cardSubtitle}>Study your cards with a real flashcard viewer</div>
                </div>
                <div style={sx.countChip}>{cards.length} cards</div>
              </div>
            </Link>

            <Link href={`/boards/${encodeURIComponent(boardKey)}/subjects/${encodeURIComponent(subjectId)}/flashcards/new`} style={{ textDecoration: "none" }}>
              <div style={sx.actionCard}>
                <div style={sx.iconWrap}>
                  <PlusIcon />
                </div>
                <div>
                  <div style={sx.cardTitle}>Create Flashcards</div>
                  <div style={sx.cardSubtitle}>Add questions & answers for {subject?.name?.toLowerCase?.() || "this subject"}</div>
                </div>
              </div>
            </Link>
          </div>

          {/* Liste over kort */}
          <div style={sx.flashListCard}>
            <div style={sx.listHeaderRow}>
              <div style={sx.listHeaderTitle}>All Cards</div>
              <Link href={`/boards/${encodeURIComponent(boardKey)}/subjects/${encodeURIComponent(subjectId)}/flashcards/new`} style={{ textDecoration: "none" }}>
                <button type="button" style={sx.addPill}>
                  <span style={{ fontWeight: 900, fontSize: 18, lineHeight: 0, marginRight: 8 }}>+</span>
                  Add Card
                </button>
              </Link>
            </div>

            {cardsSorted.length === 0 ? (
              <div style={{ color: "#6B7280" }}>No cards yet.</div>
            ) : (
              <div style={sx.cardsList}>
                {cardsSorted.map((c) => (
                  <div key={c.id} style={{ ...sx.cardRow, fontSize: fontPx }}>
                    <div style={sx.qText}>{c.q || "Untitled"}</div>
                    <div style={sx.metaSmall}>{new Date(c.createdAt as any).toLocaleDateString()}</div>
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

/* --------- icons ---------- */
function PlayIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="#4661C5" strokeWidth="1.8" />
      <path d="M10 8.5l6 3.5-6 3.5V8.5z" fill="#87A0F2" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="4" stroke="#4661C5" strokeWidth="1.8" />
      <path d="M12 8v8M8 12h8" stroke="#87A0F2" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/* ---------------- styles ---------------- */
const BG = "#F5ECE0";
const SHELL_BG = "#F5EFE7";
const TEXT = "#0F172A";
const SUB = "#6B7280";
const BORDER = "#E7E2D9";

const sx: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: BG, display: "grid", placeItems: "center", padding: 20 },
  shell: { width: "min(760px, 94vw)", background: SHELL_BG, borderRadius: 24, border: `1px solid ${BORDER}`, boxShadow: "0 18px 36px rgba(0,0,0,0.06)", padding: 20 },

  subjectTitle: { textAlign: "center", fontSize: 32, fontWeight: 900, color: "#35507A", margin: "18px 0 4px" },
  h2: { textAlign: "center", fontSize: 24, fontWeight: 900, color: TEXT, margin: "0 0 16px" },

  cardList: { display: "grid", gap: 12, marginBottom: 14 },
  actionCard: { display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center", gap: 12, padding: 16, background: "#FFFFFF", borderRadius: 18, border: "1px solid #ECECEC", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", cursor: "pointer" },
  iconWrap: { width: 54, height: 54, borderRadius: 14, background: "#E9F0FF", border: "1px solid #D8E3FF", display: "grid", placeItems: "center" },
  cardTitle: { fontSize: 18, fontWeight: 900, color: TEXT },
  cardSubtitle: { fontSize: 15, color: SUB, marginTop: 2 },
  countChip: { justifySelf: "end", padding: "6px 10px", borderRadius: 999, background: "#F6F8FF", border: "1px solid #E0E7FF", fontWeight: 800, color: "#3B4C9A" },

  flashListCard: { background: "#FFFFFF", border: "1px solid #ECECEC", borderRadius: 18, padding: 16, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" },
  listHeaderRow: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  listHeaderTitle: { fontWeight: 900, color: TEXT, fontSize: 18 },
  cardsList: { display: "grid", gap: 10 },
  cardRow: { borderRadius: 14, padding: "12px 14px", background: "#FFFFFF", border: "1px solid #F2F2F2", boxShadow: "0 2px 6px rgba(0,0,0,0.04)", display: "grid", gap: 4 },
  qText: { fontWeight: 800, color: TEXT },
  metaSmall: { color: SUB, fontSize: 12 },

  addPill: { display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 999, background: "#FFF", border: "1px solid #E6E6E6", boxShadow: "0 2px 6px rgba(0,0,0,0.04)", fontWeight: 800, color: TEXT, cursor: "pointer" },
};

/* Navbar styles (samme som gjenbrukt) */
const navsx: Record<string, React.CSSProperties> = {
  edge: { margin: "12px 12px 0 12px" },
  wrap: { background: "#E9DFCF", border: "1px solid #D9CEB9", borderRadius: 20, padding: 14, boxShadow: "0 18px 40px rgba(0,0,0,.08)" },
  row: { display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center", gap: 14 },
  backBtn: { width: 42, height: 42, borderRadius: 21, display: "grid", placeItems: "center", background: "#DFD5C6", border: "1px solid #D9CEB9", cursor: "pointer", color: "#1b1b1b", fontWeight: 900, fontSize: 18 },
  search: { display: "flex", alignItems: "center", gap: 10, background: "#E3D8C5", border: "1px solid #D9CEB9", borderRadius: 16, padding: "12px 14px" },
  searchIcon: { color: "#6D6458", fontSize: 15 },
  searchInput: { border: "none", outline: "none", background: "transparent", color: "#1b1b1b", fontWeight: 800, width: "100%", fontSize: 15 },
  filterBtn: { display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 14px", borderRadius: 16, background: "#E3D8C5", border: "1px solid #D9CEB9", color: "#1b1b1b", cursor: "pointer", fontWeight: 900 },
  filterDot: { width: 8, height: 8, borderRadius: 999, background: "#FFFFFF", border: "1px solid #D9CEB9" },
  pop: { position: "absolute", right: 0, marginTop: 8, width: 260, padding: 12, borderRadius: 14, border: "1px solid #D9CEB9", background: "#FFFEFB", boxShadow: "0 18px 36px rgba(0,0,0,.14)", display: "grid", gap: 10, zIndex: 50 },
  fGroup: { display: "grid", gap: 6 },
  fLabel: { fontSize: 12, fontWeight: 900, color: "#6B6A66" },
  fRow: { display: "flex", gap: 8, flexWrap: "wrap" as const },
  fChip: { padding: "6px 10px", borderRadius: 999, border: "1px solid #D9CEB9", background: "#E9DFCF", fontWeight: 800, fontSize: 12, cursor: "pointer" },
  fChipOn: { background: "#FFFFFF", borderColor: "#CABDA3", boxShadow: "inset 0 1px 0 rgba(255,255,255,.4)" },
  fCheck: { display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 800, color: "#1b1b1b" },
  resetBtn: { padding: "8px 10px", borderRadius: 10, background: "#E3D8C5", border: "1px solid #D9CEB9", fontWeight: 900, cursor: "pointer" },
  doneBtn: { padding: "8px 10px", borderRadius: 10, background: "#111827", border: "none", color: "#fff", fontWeight: 900, cursor: "pointer" },
};
