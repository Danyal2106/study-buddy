"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getBoard, listSubjects, type Board, type Subject } from "@/lib/localdb";

/* ---------- NAVBAR (med Filtre) ---------- */
type ActionKey = "notes" | "flashcards" | "tasks";
type ActionFilters = { notes: boolean; flashcards: boolean; tasks: boolean };

function SubjectNavbar({
  query,
  setQuery,
  actionFilters,
  setActionFilters,
}: {
  query: string;
  setQuery: (v: string) => void;
  actionFilters: ActionFilters;
  setActionFilters: (f: ActionFilters) => void;
}) {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        (document.getElementById("subject-search") as HTMLInputElement | null)?.focus();
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

  function toggleFilter(k: ActionKey) {
    setActionFilters({ ...actionFilters, [k]: !actionFilters[k] });
  }

  return (
    <div style={{ ...navsx.shell, boxShadow: scrolled ? "0 6px 16px rgba(0,0,0,.06)" : "none" }}>
      <header style={navsx.bar}>
        {/* Venstre: Tilbake + Brand */}
        <div style={navsx.left}>
          <button
            type="button"
            aria-label="Tilbake"
            title="Tilbake"
            style={navsx.backBtn}
            onClick={() => (history.length > 1 ? router.back() : router.replace("/dashboard"))}
            onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 8px 18px rgba(0,0,0,.10)")}
            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 4px 10px rgba(0,0,0,.04)")}
            onMouseDown={(e) => (e.currentTarget.style.transform = "scale(.98)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
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

        {/* Midt: Søk */}
        <div style={navsx.center}>
          <div style={navsx.searchWrap as React.CSSProperties}>
            <span style={navsx.searchIcon}>⌕</span>
            <input
              id="subject-search"
              placeholder="Søk i dette faget …"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search on subject home"
              style={navsx.searchInput as React.CSSProperties}
            />
            <span style={navsx.kbdHint} className="kbd-hint">
              ⌘/Ctrl + K
            </span>
          </div>
        </div>

        {/* Høyre: Filtre */}
        <div style={{ position: "relative" }}>
          <button
            type="button"
            style={navsx.filterBtn}
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-haspopup="dialog"
          >
            <span style={navsx.filterIcon}>⚙︎</span> Filtre
          </button>

          <div
            role="dialog"
            aria-label="Filtre"
            style={{
              ...navsx.pop,
              display: open ? "grid" : "none",
            }}
          >
            <div style={navsx.popGroup}>
              <div style={navsx.popLabel}>Vis handlinger</div>
              <label style={navsx.checkRow}>
                <input type="checkbox" checked={actionFilters.notes} onChange={() => toggleFilter("notes")} />
                Notes
              </label>
              <label style={navsx.checkRow}>
                <input
                  type="checkbox"
                  checked={actionFilters.flashcards}
                  onChange={() => toggleFilter("flashcards")}
                />
                Flashcards
              </label>
              <label style={navsx.checkRow}>
                <input type="checkbox" checked={actionFilters.tasks} onChange={() => toggleFilter("tasks")} />
                Tasks
              </label>
            </div>

            <div style={navsx.popActions}>
              <button
                type="button"
                style={navsx.btnGhost}
                onClick={() => setActionFilters({ notes: true, flashcards: true, tasks: true })}
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

      {/* Skjul tastehint på små skjermer */}
      <style jsx global>{`
        @media (max-width: 860px) {
          .kbd-hint { display: none !important; }
        }
      `}</style>
    </div>
  );
}

/* ---------------- PAGE ---------------- */
export default function SubjectHomePage() {
  const params = useParams<{ id: string; subjectId: string }>();
  const router = useRouter();
  const boardKey = decodeURIComponent(params.id || "untitled");
  const subjectId = decodeURIComponent(params.subjectId || "");

  const [board, setBoard] = useState<Board | null>(null);
  const [subject, setSubject] = useState<Subject | null>(null);

  const [query, setQuery] = useState("");
  const [actionFilters, setActionFilters] = useState<ActionFilters>({
    notes: true,
    flashcards: true,
    tasks: true,
  });

  useEffect(() => {
    setBoard(getBoard(boardKey) ?? null);
    const subs = listSubjects(boardKey);
    setSubject(subs.find((s) => s.id === subjectId) ?? null);
  }, [boardKey, subjectId]);

  const title = subject?.name || "Subject";

  const actions = useMemo(
    () => [
      {
        key: "notes" as const,
        title: "Notes",
        subtitle: `Write and organize notes for ${title.toLowerCase?.() || "this subject"}`,
        href: `/boards/${encodeURIComponent(boardKey)}/subjects/${encodeURIComponent(subjectId)}/notes`,
        icon: <NotesIcon />,
      },
      {
        key: "flashcards" as const,
        title: "Flashcards",
        subtitle: "Create and practice flashcards",
        href: `/boards/${encodeURIComponent(boardKey)}/subjects/${encodeURIComponent(subjectId)}/flashcards`,
        icon: <FlashIcon />,
      },
      {
        key: "tasks" as const,
        title: "Tasks",
        subtitle: "Set up tasks and deadlines",
        href: `/boards/${encodeURIComponent(boardKey)}/subjects/${encodeURIComponent(subjectId)}/tasks`,
        icon: <CheckIcon />,
      },
    ],
    [boardKey, subjectId, title]
  );

  const norm = (s: string) => s.toLowerCase().normalize("NFKD");
  const tokens = useMemo(() => norm(query).split(/\s+/).filter(Boolean), [query]);

  const filtered = useMemo(() => {
    let list = actions.slice();
    // tekstsøk
    if (tokens.length) {
      list = list.filter((a) => tokens.every((t) => `${a.title} ${a.subtitle}`.toLowerCase().includes(t)));
    }
    // filtre (notes/flashcards/tasks)
    const anyOff = !actionFilters.notes || !actionFilters.flashcards || !actionFilters.tasks;
    if (anyOff) {
      list = list.filter((a) => actionFilters[a.key]);
    }
    return list;
  }, [actions, tokens, actionFilters]);

  /* hover helper for kort */
  const hoverOn = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.boxShadow = "0 14px 28px rgba(0,0,0,.10)";
    e.currentTarget.style.transform = "translateY(-2px)";
  };
  const hoverOff = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.06)";
    e.currentTarget.style.transform = "translateY(0)";
  };

  return (
    <>
      <SubjectNavbar
        query={query}
        setQuery={setQuery}
        actionFilters={actionFilters}
        setActionFilters={setActionFilters}
      />

      {/* Sentrert innhold (liten intern scroll i kortlisten om nødvendig) */}
      <main style={sx.page}>
        <section style={sx.shell}>
          {/* Tittelrad med tilbake-knapp VED SIDEN AV teksten */}
          <div style={sx.titleRow}>
            <button
              type="button"
              onClick={() => (history.length > 1 ? router.back() : router.replace("/dashboard"))}
              style={sx.titleBack}
              aria-label="Tilbake"
              title="Tilbake"
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 8px 18px rgba(0,0,0,.10)")}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 4px 10px rgba(0,0,0,.04)")}
              onMouseDown={(e) => (e.currentTarget.style.transform = "scale(.98)")}
              onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              ←
            </button>
            <h1 style={sx.subjectTitle}>{title}</h1>
          </div>

          <h2 style={sx.h2}>What would you like to do?</h2>

          <div style={sx.metaLine}>
            {tokens.length || filtered.length !== actions.length ? (
              <>
                Viser {filtered.length} {filtered.length === 1 ? "valg" : "valg"}
                {tokens.length ? (
                  <>
                    {" "}
                    • søk: <b>{query}</b>
                  </>
                ) : null}
              </>
            ) : (
              <>Choose an action below</>
            )}
          </div>

          <div style={sx.cardList}>
            {filtered.map((a) => (
              <Link key={a.key} href={a.href} style={{ textDecoration: "none" }}>
                <div
                  style={{ ...sx.actionCard, background: "#FFFFFF" }}
                  onMouseEnter={hoverOn}
                  onMouseLeave={hoverOff}
                  onMouseDown={(e) => (e.currentTarget.style.transform = "translateY(0) scale(.99)")}
                  onMouseUp={(e) => (e.currentTarget.style.transform = "translateY(-2px) scale(1)")}
                >
                  <div style={sx.iconWrap}>{a.icon}</div>
                  <div>
                    <div style={sx.cardTitle}>{a.title}</div>
                    <div style={sx.cardSubtitle}>{a.subtitle}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}

/* ------ icons ------ */
function NotesIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="4" width="18" height="16" rx="3" stroke="#4661C5" strokeWidth="1.8" />
      <line x1="7" y1="9" x2="17" y2="9" stroke="#4661C5" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="7" y1="12" x2="15" y2="12" stroke="#4661C5" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="7" y1="15" x2="13" y2="15" stroke="#4661C5" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function FlashIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="5" width="12" height="14" rx="2.5" stroke="#4661C5" strokeWidth="1.8" />
      <rect x="8" y="3" width="12" height="14" rx="2.5" stroke="#87A0F2" strokeWidth="1.6" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="#87A0F2" strokeWidth="1.8" />
      <path d="M7.5 12.5l3 3 6-6" stroke="#4661C5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ---------------- styles ---------------- */
const BG = "linear-gradient(180deg,#F7F4ED 0%, #FAF7F0 100%)";
const SHELL_BG = "linear-gradient(180deg,#FFFEFB 0%, #FCFAF6 100%)";
const TEXT = "#0F172A";
const SUB = "#6B6A66";
const BORDER = "#E6E1D7";

/* NAVBAR-stiler */
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

  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: BORDER,
    background: "#FFFFFF",
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
    transition: "transform .08s ease, box-shadow .16s ease, background .16s ease",
    boxShadow: "0 4px 10px rgba(0,0,0,.04)",
  },
  backIcon: { fontSize: 18, lineHeight: 1, color: "#1b1b1b", fontWeight: 900 },

  brandWrap: { display: "flex", alignItems: "center", gap: 8 },
  brandDot: { width: 8, height: 8, borderRadius: 999, background: "#111827" },
  brand: { fontWeight: 800, color: "#111827", fontSize: 20, letterSpacing: 0.2 },

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
  searchIcon: { color: "#6D6458", fontSize: 16 },
  searchInput: {
    appearance: "none",
    border: "none",
    outline: "none",
    background: "transparent",
    width: "100%",
    color: "#1b1b1b",
    fontWeight: 800,
    fontSize: 15,
  },
  kbdHint: {
    fontSize: 12,
    color: "#6B6A66",
    padding: "2px 6px",
    border: `1px solid ${BORDER}`,
    borderRadius: 6,
    background: "#FFFFFF",
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
  filterIcon: { fontSize: 14, color: "#6B6A66" },

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
  popLabel: { fontSize: 13, color: "#6B6A66", fontWeight: 700 },
  checkRow: { display: "flex", alignItems: "center", gap: 10, fontWeight: 600, color: "#111827" },

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

/* SIDE-stiler (sentrert, ren) */
const sx: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: BG,
    paddingTop: 96,
    display: "grid",
    placeItems: "center",
    paddingLeft: 16,
    paddingRight: 16,
  },
  shell: {
    width: "min(900px, 96vw)",
    background: SHELL_BG,
    borderRadius: 24,
    border: `1px solid ${BORDER}`,
    boxShadow: "0 24px 60px rgba(0,0,0,0.08)",
    padding: 24,
    display: "grid",
    gap: 12,
  },

  /* Tittel + back på samme linje, sentrert */
  titleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 2,
  },
  titleBack: {
    width: 40,
    height: 40,
    borderRadius: 10,
    border: `1px solid ${BORDER}`,
    background: "#FFFFFF",
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
    fontSize: 18,
    transition: "transform .08s ease, box-shadow .16s ease, background .16s ease",
    boxShadow: "0 4px 10px rgba(0,0,0,.04)",
  },

  subjectTitle: {
    margin: 0,
    fontSize: 38,
    fontWeight: 900,
    color: TEXT,
    textTransform: "lowercase", // matcher “it”-stilen i skjermbildet
  },
  h2: { textAlign: "center", fontSize: 22, fontWeight: 900, color: TEXT, margin: "6px 0 6px" },
  metaLine: { textAlign: "center", color: SUB, fontSize: 13, marginBottom: 6 },

  cardList: {
    display: "grid",
    gap: 12,
    maxHeight: "52vh", // liten intern scroll hvis mange actions
    overflow: "auto",
    paddingRight: 2,
  },
  actionCard: {
    display: "grid",
    gridTemplateColumns: "auto 1fr",
    alignItems: "center",
    gap: 12,
    padding: 16,
    background: "#FFFFFF",
    borderRadius: 18,
    border: `1px solid #ECE7DE`,
    boxShadow: "0 8px 16px rgba(0,0,0,0.06)",
    cursor: "pointer",
    transition: "transform .12s ease, box-shadow .12s ease",
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 14,
    background: "#E9F0FF",
    border: `1px solid #D8E3FF`,
    display: "grid",
    placeItems: "center",
  },
  cardTitle: { fontSize: 18, fontWeight: 900, color: TEXT },
  cardSubtitle: { fontSize: 15, color: SUB, marginTop: 2 },
};
