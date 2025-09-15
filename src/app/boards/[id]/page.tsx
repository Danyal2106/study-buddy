"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ensureBoard,
  getBoard,
  setBoardTitle,
  listSubjects,
  addSubject,
  type Subject,
  type Board,
} from "@/lib/localdb";

/* ---------------- NAVBAR ---------------- */
type LocalFilters = { hasNotes: boolean; hasCards: boolean };

function BoardNavbar({
  query,
  setQuery,
  filters,
  setFilters,
}: {
  query: string;
  setQuery: (v: string) => void;
  filters: LocalFilters;
  setFilters: (f: LocalFilters) => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        (document.getElementById("board-search") as HTMLInputElement | null)?.focus();
        e.preventDefault();
      }
      if (e.key === "Escape") setOpen(false);
    };
    const onScroll = () => setScrolled(window.scrollY > 2);
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div style={{ ...navsx.shell, boxShadow: scrolled ? "0 6px 16px rgba(0,0,0,.06)" : "none" }}>
      <header style={navsx.bar}>
        {/* Left: Back + Brand (pilen skal stå her – bare stylet) */}
        <div style={navsx.left}>
          <button
            type="button"
            aria-label="Tilbake"
            title="Tilbake"
            style={navsx.backBtn}
            onClick={() => (history.length > 1 ? router.back() : router.replace("/dashboard"))}
            onMouseDown={(e) => (e.currentTarget.style.transform = "scale(.98)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <span style={navsx.backIcon}>←</span>
          </button>

          <Link href="/dashboard" style={{ textDecoration: "none" }}>
            <div style={navsx.brandWrap}>
              <span style={navsx.brandDot} />
              <span style={navsx.brand}>NoteAndPlan</span>
            </div>
          </Link>
        </div>

        {/* Middle: Search */}
        <div style={navsx.center}>
          <div style={navsx.searchWrap as React.CSSProperties}>
            <span style={navsx.searchIcon}>⌕</span>
            <input
              id="board-search"
              placeholder="Søk i dette boardet …"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search subjects"
              style={navsx.searchInput as React.CSSProperties}
            />
          </div>
        </div>

        {/* Right: Filters */}
        <div style={{ position: "relative" }}>
          <button
            type="button"
            style={navsx.filterBtn}
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-haspopup="dialog"
          >
            <span style={navsx.filterIcon}>⚙︎</span>
            Filtre
          </button>

          {/* Popup */}
          <div
            role="dialog"
            aria-label="Filtre"
            style={{
              ...navsx.pop,
              display: open ? "grid" : "none",
            }}
          >
            <div style={navsx.popGroup}>
              <div style={navsx.popLabel}>Vis kun</div>
              <label style={navsx.checkRow}>
                <input
                  type="checkbox"
                  checked={filters.hasNotes}
                  onChange={(e) => setFilters({ ...filters, hasNotes: e.target.checked })}
                />
                Fag med notater
              </label>
              <label style={navsx.checkRow}>
                <input
                  type="checkbox"
                  checked={filters.hasCards}
                  onChange={(e) => setFilters({ ...filters, hasCards: e.target.checked })}
                />
                Fag med flashcards
              </label>
            </div>

            <div style={navsx.popActions}>
              <button
                type="button"
                style={navsx.btnGhost}
                onClick={() => setFilters({ hasNotes: false, hasCards: false })}
              >
                Nullstill
              </button>
              <button type="button" style={navsx.btnPrimary} onClick={() => setOpen(false)}>
                Ferdig
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Små globale styles for hintet på desktop */}
      <style jsx global>{`
        @media (max-width: 860px) {
          .kbd-hint { display: none !important; }
        }
      `}</style>
    </div>
  );
}

/* ---------------- PAGE ---------------- */
export default function BoardPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const boardKey = decodeURIComponent(params.id || "untitled");

  const [board, setBoard] = useState<Board | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [adding, setAdding] = useState(false);
  const [subjectName, setSubjectName] = useState("");

  // local navbar state
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<LocalFilters>({ hasNotes: false, hasCards: false });

  useEffect(() => {
    const b = getBoard(boardKey) ?? ensureBoard(boardKey, boardKey);
    setBoard(b);
    setSubjects(listSubjects(boardKey));
  }, [boardKey]);

  function handleAddSubject() {
    const name = subjectName.trim();
    if (!name) return;
    const s = addSubject(boardKey, name);
    setSubjects((prev) => [s, ...prev]);
    setSubjectName("");
    setAdding(false);
  }

  async function handleDeleteSubject(e: React.MouseEvent, id: string, name: string) {
    e.preventDefault();
    e.stopPropagation();
    const ok = confirm(`Slette faget «${name || "Untitled Subject"}»?`);
    if (!ok) return;

    try {
      const mod = await import("@/lib/localdb");
      // @ts-ignore optional
      if (typeof mod.removeSubject === "function") {
        // @ts-ignore
        mod.removeSubject(boardKey, id);
      }
    } catch {}
    setSubjects((prev) => prev.filter((s) => s.id !== id));
  }

  // tittel
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  useEffect(() => {
    if (board) setTitleDraft(board.title);
  }, [board]);

  function saveTitle() {
    setBoardTitle(boardKey, titleDraft);
    const b = getBoard(boardKey);
    setBoard(b);
    setEditingTitle(false);
  }

  // filter
  const norm = (s: string) => s.toLowerCase().normalize("NFKD");
  const tokens = useMemo(() => norm(query).split(/\s+/).filter(Boolean), [query]);

  const filteredSubjects = useMemo(() => {
    let list = subjects.slice();
    if (tokens.length) list = list.filter((s) => tokens.every((t) => norm(s.name || "").includes(t)));
    if (filters.hasNotes) list = list.filter((s) => Array.isArray((s as any).notes) && (s as any).notes.length > 0);
    if (filters.hasCards) list = list.filter((s) => Array.isArray((s as any).cards) && (s as any).cards.length > 0);
    return list;
  }, [subjects, tokens, filters]);

  // statistikk
  const countWithNotes = useMemo(
    () => subjects.filter((s) => Array.isArray((s as any).notes) && (s as any).notes.length > 0).length,
    [subjects]
  );
  const countWithCards = useMemo(
    () => subjects.filter((s) => Array.isArray((s as any).cards) && (s as any).cards.length > 0).length,
    [subjects]
  );

  return (
    <>
      <BoardNavbar query={query} setQuery={setQuery} filters={filters} setFilters={setFilters} />

      <main style={sx.page}>
        <section style={sx.container}>
          {/* Header */}
          <div style={sx.header}>
            {editingTitle ? (
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  style={sx.titleInput as React.CSSProperties}
                  aria-label="Board-tittel"
                />
                <button type="button" onClick={saveTitle} style={sx.btnPrimarySm}>
                  Lagre
                </button>
                <button type="button" onClick={() => setEditingTitle(false)} style={sx.btnGhostSm}>
                  Avbryt
                </button>
              </div>
            ) : (
              <h1 style={sx.h1} onDoubleClick={() => setEditingTitle(true)}></h1>
            )}
          </div>

          {/* Kort */}
          <section style={sx.card}>
            <div style={sx.cardHead}>
              {/* Back pil i kortets header – beholdes her og styles via sx.iconBtn2 */}
              <button
                type="button"
                onClick={() => (history.length > 1 ? router.back() : router.replace("/dashboard"))}
                style={sx.iconBtn2}
                aria-label="Tilbake"
                title="Tilbake"
              >
                ←
              </button>
              <h2 style={sx.cardTitle}>Fag</h2>
            </div>

            {/* Statistikk */}
            <div style={sx.statsRow}>
              <div style={sx.statChip}>
                <div style={sx.statNum}>{subjects.length}</div>
                <div style={sx.statLabel}>Fag totalt</div>
              </div>
              <div style={sx.statChip}>
                <div style={sx.statNum}>{countWithNotes}</div>
                <div style={sx.statLabel}>Med notater</div>
              </div>
              <div style={sx.statChip}>
                <div style={sx.statNum}>{countWithCards}</div>
                <div style={sx.statLabel}>Med kort</div>
              </div>
            </div>

            <div style={sx.list}>
              {filteredSubjects.map((s, i) => (
                <div key={s.id} style={sx.row}>
                  <Link
                    href={`/boards/${encodeURIComponent(boardKey)}/subjects/${encodeURIComponent(s.id)}`}
                    style={{ textDecoration: "none", flex: 1 }}
                  >
                    <div
                      style={{
                        ...sx.pill,
                        background: pastel(i),
                        borderColor: pale(i),
                      }}
                    >
                      <div style={sx.pillTitle}>{s.name || "Untitled Subject"}</div>
                      <div style={sx.pillSub}>Trykk for å åpne faget</div>
                    </div>
                  </Link>
                  <button
                    type="button"
                    aria-label={`Slett ${s.name || "fag"}`}
                    title="Slett fag"
                    style={sx.deleteBtn}
                    onClick={(e) => handleDeleteSubject(e, s.id, s.name)}
                  >
                    🗑️
                  </button>
                </div>
              ))}

              {!adding ? (
                <button type="button" onClick={() => setAdding(true)} style={sx.addBtn}>
                  + Legg til fag
                </button>
              ) : (
                <div style={sx.addRow}>
                  <input
                    value={subjectName}
                    onChange={(e) => setSubjectName(e.target.value)}
                    placeholder="Fagnavn…"
                    style={sx.input as React.CSSProperties}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddSubject();
                      if (e.key === "Escape") {
                        setAdding(false);
                        setSubjectName("");
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddSubject}
                    style={sx.btnPrimary}
                    disabled={!subjectName.trim()}
                  >
                    Opprett
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAdding(false);
                      setSubjectName("");
                    }}
                    style={sx.btnGhost}
                  >
                    Avbryt
                  </button>
                </div>
              )}
            </div>
          </section>
        </section>
      </main>
    </>
  );
}

/* --------- helpers ---------- */
function pastel(i: number) {
  const colors = ["#F3F7FF", "#FFF5F0", "#FFF9D9", "#FFF2EB"];
  return colors[i % colors.length];
}
function pale(i: number) {
  const colors = ["#D7E4FF", "#FFD8C7", "#F3E19A", "#F7CDB7"];
  return colors[i % colors.length];
}

/* ---- Palett ---- */
const TEXT = "#111827";
const SUBTLE = "#6B7280";
const BORDER = "#E5E7EB";
const SURFACE = "#FFFFFF";
const BG = "#F7F4ED";

/* ---- Page styles ---- */
const sx: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: BG,
    paddingTop: 96,
  },

  container: {
    width: "min(1120px, 94vw)",
    margin: "0 auto",
  },

  header: {
    display: "grid",
    gridTemplateColumns: "1fr",
    alignItems: "center",
    gap: 14,
    margin: "18px 0 12px",
  },
  h1: { margin: 0, fontSize: 34, fontWeight: 800, color: TEXT },

  card: {
    background: SURFACE,
    border: `1px solid ${BORDER}`,
    borderRadius: 14,
    padding: 20,
  },
  cardHead: {
    display: "grid",
    gridTemplateColumns: "auto 1fr auto",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  iconBtn2: {
    width: 42,
    height: 42,
    borderRadius: 10,
    border: `1px solid ${BORDER}`,
    background: "#FFFFFF",
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
    fontSize: 18,
  },
  cardTitle: { margin: 0, fontSize: 26, fontWeight: 800, color: TEXT },
  cardMeta: { fontSize: 14, color: SUBTLE, justifySelf: "end" },

  /* Stats */
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 12,
    marginTop: 12,
    marginBottom: 10,
  },
  statChip: {
    border: `1px solid ${BORDER}`,
    borderRadius: 12,
    padding: "10px 12px",
    background: "#FAFAFA",
  },
  statNum: { fontSize: 20, fontWeight: 800, color: TEXT, lineHeight: 1.1 },
  statLabel: { fontSize: 13, color: SUBTLE },

  list: { display: "grid", gap: 12, marginTop: 10 },
  row: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: 10,
    alignItems: "stretch",
  },

  pill: {
    borderRadius: 12,
    padding: "18px 20px",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: BORDER,
  },
  pillTitle: { fontSize: 20, fontWeight: 700, color: TEXT },
  pillSub: { fontSize: 13, color: SUBTLE, marginTop: 6 },

  deleteBtn: {
    borderRadius: 10,
    padding: "0 14px",
    border: `1px solid ${BORDER}`,
    background: SURFACE,
    cursor: "pointer",
    fontSize: 18,
  },

  addBtn: {
    borderRadius: 12,
    padding: "14px 16px",
    border: `1px solid ${BORDER}`,
    background: SURFACE,
    textAlign: "left",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 16,
  },

  addRow: {
    display: "grid",
    gridTemplateColumns: "1fr auto auto",
    gap: 10,
    alignItems: "center",
  },

  // Inputs & buttons
  input: {
    height: 44,
    borderRadius: 10,
    border: `1px solid ${BORDER}`,
    background: "#F9FAFB",
    padding: "10px 12px",
    outline: "none",
    color: TEXT,
    fontSize: 16,
  },
  titleInput: {
    height: 42,
    borderRadius: 10,
    border: `1px solid ${BORDER}`,
    background: SURFACE,
    padding: "8px 12px",
    outline: "none",
    color: TEXT,
    fontWeight: 700,
    fontSize: 16,
  },
  btnPrimary: {
    height: 44,
    padding: "0 14px",
    borderRadius: 10,
    border: "none",
    background: "#111827",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 16,
  },
  btnGhost: {
    height: 44,
    padding: "0 14px",
    borderRadius: 10,
    border: `1px solid ${BORDER}`,
    background: SURFACE,
    color: TEXT,
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 16,
  },
  btnPrimarySm: {
    height: 40,
    padding: "0 12px",
    borderRadius: 10,
    border: "none",
    background: "#111827",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 15,
  },
  btnGhostSm: {
    height: 40,
    padding: "0 12px",
    borderRadius: 10,
    border: `1px solid ${BORDER}`,
    background: SURFACE,
    color: TEXT,
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 15,
  },
};

/* ---- NAVBAR (unik, ren, større) ---- */
const navsx: Record<string, React.CSSProperties> = {
  shell: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 40,
    background:
      "linear-gradient(180deg, #FFFFFF 0%, #FFFFFF 70%, rgba(255,255,255,0.96) 100%)",
    borderBottom: `1px solid ${BORDER}`,
    transition: "box-shadow .18s ease",
  },
  bar: {
    height: 84,
    display: "grid",
    gridTemplateColumns: "auto 1fr auto",
    alignItems: "center",
    gap: 18,
    padding: "0 20px",
    width: "100%",
    maxWidth: "1400px",
    margin: "0 auto",
  },
  left: { display: "flex", alignItems: "center", gap: 12 },

  // Back-knapp (samme plassering, men pen)
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    border: `1px solid ${BORDER}`,
    background: "#FFFFFF",
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
    transition: "transform .08s ease, box-shadow .16s ease, background .16s ease",
  },
  backIcon: { fontSize: 18, lineHeight: 1 },

  brandWrap: { display: "flex", alignItems: "center", gap: 8 },
  brandDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    background: "#111827",
  },
  brand: { fontWeight: 800, color: TEXT, fontSize: 20, letterSpacing: 0.2 },

  center: { display: "flex", justifyContent: "center" },

  searchWrap: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    width: "min(860px, 100%)",
    height: 46,
    background: "#F3F4F6",
    border: `1px solid ${BORDER}`,
    borderRadius: 12,
    padding: "0 12px",
    transition: "box-shadow .16s ease, border-color .16s ease",
  },
  searchIcon: { color: SUBTLE, fontSize: 16 },
  searchInput: {
    appearance: "none",
    border: "none",
    outline: "none",
    background: "transparent",
    width: "100%",
    color: TEXT,
    fontWeight: 600,
    fontSize: 15,
  },


  filterBtn: {
    height: 44,
    padding: "0 14px",
    borderRadius: 12,
    border: `1px solid ${BORDER}`,
    background: "#FFFFFF",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 15,
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  filterIcon: { fontSize: 14, color: SUBTLE },

  pop: {
    position: "absolute",
    right: 0,
    top: 54,
    width: 300,
    background: "#FFFFFF",
    border: `1px solid ${BORDER}`,
    borderRadius: 12,
    padding: 14,
    boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
    zIndex: 50,
    gap: 12,
  },
  popGroup: { display: "grid", gap: 10 },
  popLabel: { fontSize: 13, color: SUBTLE, fontWeight: 700 },
  checkRow: { display: "flex", alignItems: "center", gap: 10, fontWeight: 600, color: TEXT },

  popActions: { display: "flex", gap: 10, justifyContent: "flex-end" },
  btnGhost: {
    height: 40,
    padding: "0 12px",
    borderRadius: 10,
    border: `1px solid ${BORDER}`,
    background: "#FFFFFF",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 14,
  },
  btnPrimary: {
    height: 40,
    padding: "0 12px",
    borderRadius: 10,
    border: "none",
    background: "#111827",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 14,
  },
};
