"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { listSubjects, type Subject } from "@/lib/localdb";

/* ---------------- NAVBAR (samme farger/stil, lokal søk/filtre for NOTATER) ---------------- */
function NotesNavbar({
  query,
  setQuery,
  sort,
  setSort,
  hasBodyOnly,
  setHasBodyOnly,
  onBack,
}: {
  query: string;
  setQuery: (v: string) => void;
  sort: "newest" | "oldest";
  setSort: (v: "newest" | "oldest") => void;
  hasBodyOnly: boolean;
  setHasBodyOnly: (v: boolean) => void;
  onBack: () => void;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        (document.getElementById("notes-search") as HTMLInputElement | null)?.focus();
        e.preventDefault();
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div style={navsx.edge}>
      <div style={navsx.wrap as React.CSSProperties} className="elev">
        <div style={navsx.row}>
          <button
            type="button"
            aria-label="Tilbake"
            title="Tilbake"
            style={navsx.backBtn}
            onClick={onBack}
            onMouseDown={(e) => (e.currentTarget.style.transform = "scale(.98)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            ←
          </button>

          <div style={navsx.search as React.CSSProperties}>
            <span style={navsx.searchIcon}>⌕</span>
            <input
              id="notes-search"
              placeholder="Search notes… (Tip: ⌘/Ctrl+K)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search notes"
              style={navsx.searchInput as React.CSSProperties}
            />
          </div>

          <div style={{ position: "relative" }}>
            <button
              type="button"
              aria-haspopup="dialog"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              style={navsx.filterBtn}
            >
              <span style={navsx.filterDot} aria-hidden />
              Filters
            </button>

            {open && (
              <div role="dialog" aria-label="Filters" style={navsx.pop}>
                <div style={{ display: "grid", gap: 10 }}>
                  <div style={navsx.fGroup}>
                    <div style={navsx.fLabel}>Sort</div>
                    <div style={navsx.fRow}>
                      {(["newest", "oldest"] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSort(s)}
                          style={{ ...navsx.fChip, ...(sort === s ? navsx.fChipOn : {}) }}
                        >
                          {s === "newest" ? "Newest first" : "Oldest first"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label style={navsx.fCheck}>
                    <input
                      type="checkbox"
                      checked={hasBodyOnly}
                      onChange={(e) => setHasBodyOnly(e.target.checked)}
                    />
                    With content only
                  </label>

                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      style={navsx.resetBtn}
                      onClick={() => {
                        setSort("newest");
                        setHasBodyOnly(false);
                        setOpen(false);
                      }}
                    >
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

/* ---------------- SIDE ---------------- */
export default function SubjectNotesPage() {
  const params = useParams<{ id: string; subjectId: string }>();
  const router = useRouter();
  const boardKey = decodeURIComponent(params.id || "untitled");
  const subjectId = decodeURIComponent(params.subjectId || "");

  const [subject, setSubject] = useState<Subject | null>(null);
  const [preview, setPreview] = useState<{ id: string; text: string; createdAt: any } | null>(null);

  // navbar state
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [hasBodyOnly, setHasBodyOnly] = useState(false);

  useEffect(() => {
    const subs = listSubjects(boardKey);
    setSubject(subs.find((s) => s.id === subjectId) ?? null);
  }, [boardKey, subjectId]);

  const notesSorted = useMemo(() => {
    const src = subject?.notes ?? [];
    const arr = [...src].sort((a, b) => {
      const ad = new Date(a.createdAt as any).getTime();
      const bd = new Date(b.createdAt as any).getTime();
      return sort === "newest" ? bd - ad : ad - bd;
    });
    return arr;
  }, [subject?.notes, sort]);

  const tokens = useMemo(() => query.toLowerCase().normalize("NFKD").split(/\s+/).filter(Boolean), [query]);

  const filteredNotes = useMemo(() => {
    let arr = notesSorted;
    if (hasBodyOnly) {
      arr = arr.filter((n) => splitNote(n.text).body.trim().length > 0);
    }
    if (tokens.length) {
      arr = arr.filter((n) => {
        const { title, body } = splitNote(n.text);
        const hay = `${title} ${body}`.toLowerCase();
        return tokens.every((t) => hay.includes(t));
      });
    }
    return arr;
  }, [notesSorted, tokens, hasBodyOnly]);

  function splitNote(text: string) {
    const [rawTitle, ...rest] = (text || "").split(/\n\n/);
    return { title: (rawTitle || "").trim(), body: rest.join("\n\n").trim() };
  }
  function bodyPreview(text: string, max = 120) {
    const { body } = splitNote(text);
    const plain = body.replace(/\s+/g, " ").trim();
    return plain.length > max ? plain.slice(0, max - 1) + "…" : plain;
  }
  function summarize(text: string, max = 3) {
    const { body } = splitNote(text);
    const clean = body.replace(/\s+/g, " ").trim();
    if (!clean) return "";
    const sentences = clean.split(/(?<=[.!?])\s+(?=[A-ZÆØÅ])/).slice(0, 8);
    const ranked = [...sentences].sort((a, b) => b.length - a.length);
    return ranked.slice(0, max).join("\n");
  }

  return (
    <>
      <NotesNavbar
        query={query}
        setQuery={setQuery}
        sort={sort}
        setSort={setSort}
        hasBodyOnly={hasBodyOnly}
        setHasBodyOnly={setHasBodyOnly}
        onBack={() =>
          router.replace(`/boards/${encodeURIComponent(boardKey)}/subjects/${encodeURIComponent(subjectId)}`)
        }
      />

      <main style={sx.page}>
        <section style={sx.shell}>
          {/* Crumb-Stripe */}
          <div style={sx.topbar}>
            <div style={sx.crumbDot} />
            <div style={sx.topTitleRow}>
              <Link href="/dashboard" style={{ color: "#1F2937", textDecoration: "none", fontWeight: 800 }}>
                Dashboard
              </Link>
              <span style={{ margin: "0 6px" }}>›</span>
              <Link
                href={`/boards/${encodeURIComponent(boardKey)}`}
                style={{ color: "#1F2937", textDecoration: "none", fontWeight: 800 }}
              >
                Board
              </Link>
              <span style={{ margin: "0 6px" }}>›</span>
              <span style={{ color: "#1F2937", fontWeight: 900 }}>Notes</span>
            </div>
            <div />
          </div>

          {/* Card */}
          <div style={sx.card}>
            <div style={sx.cardHeader}>Notes</div>

            <div style={sx.notesList}>
              {filteredNotes.length === 0 ? (
                <div style={{ color: "#6B7280" }}>No notes match.</div>
              ) : (
                filteredNotes.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => setPreview(n as any)}
                    style={sx.noteRowBtn as React.CSSProperties}
                  >
                    <div style={sx.noteRow}>
                      <div style={sx.noteTitle}>{splitNote(n.text).title || "Untitled"}</div>
                      <div style={sx.notePreview}>{bodyPreview(n.text) || "—"}</div>
                    </div>
                  </button>
                ))
              )}
            </div>

            <div style={sx.addRow}>
              <Link
                href={`/boards/${encodeURIComponent(boardKey)}/subjects/${encodeURIComponent(subjectId)}/notes/new`}
                style={{ textDecoration: "none" }}
              >
                <button type="button" style={sx.addPill}>
                  <span style={{ fontWeight: 900, fontSize: 18, lineHeight: 0, marginRight: 8 }}>+</span>
                  Add Note
                </button>
              </Link>
            </div>
          </div>
        </section>

        {/* Preview modal */}
        {preview && (
          <div
            role="dialog"
            aria-modal="true"
            style={sx.modalBackdrop}
            onClick={(e) => e.target === e.currentTarget && setPreview(null)}
          >
            <div style={sx.modalCard}>
              <div style={sx.modalHeader}>
                <div style={{ fontWeight: 900, fontSize: 22, color: "#111827" }}>
                  {splitNote(preview.text).title || "Untitled"}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    style={sx.primary}
                    onClick={() =>
                      router.replace(
                        `/boards/${encodeURIComponent(boardKey)}/subjects/${encodeURIComponent(
                          subjectId
                        )}/notes/${encodeURIComponent(preview.id)}`
                      )
                    }
                  >
                    Edit
                  </button>
                  <button type="button" style={sx.ghost} onClick={() => setPreview(null)}>
                    Close
                  </button>
                </div>
              </div>

              <div style={sx.modalBody}>
                <div style={sx.modalSectionTitle}>Notat</div>
                <div style={sx.modalNoteText}>
                  {splitNote(preview.text).body || <i style={{ color: "#6B7280" }}>Empty</i>}
                </div>

                <div style={sx.modalSectionTitle}>Oppsummering</div>
                <div style={sx.summaryCard}>
                  {summarize(preview.text) ? (
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {summarize(preview.text)
                        .split("\n")
                        .map((line, i) => (
                          <li key={i} style={{ color: "#1F2937", lineHeight: 1.5 }}>
                            {line}
                          </li>
                        ))}
                    </ul>
                  ) : (
                    <div style={{ color: "#6B7280" }}>Ingen oppsummering ennå.</div>
                  )}
                </div>
              </div>

              <div style={sx.modalFooter}>
                <div style={{ color: "#6B7280", fontSize: 12 }}>
                  Sist endret: {new Date(preview.createdAt as any).toLocaleString()}
                </div>
                <button type="button" style={sx.closePill} onClick={() => setPreview(null)}>
                  Lukk
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

/* ---------------- styles ---------------- */
/* Navbar (samme palett som andre skjermer) */
const navsx: Record<string, React.CSSProperties> = {
  edge: { margin: "12px 12px 0 12px" },
  wrap: {
    background: "#E9DFCF",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#D9CEB9",
    borderRadius: 20,
    padding: 14,
    boxShadow: "0 18px 40px rgba(0,0,0,.08)",
  },
  row: { display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center", gap: 14 },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    display: "grid",
    placeItems: "center",
    background: "#DFD5C6",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#D9CEB9",
    cursor: "pointer",
    color: "#1b1b1b",
    fontWeight: 900,
    fontSize: 18,
    boxShadow: "0 10px 20px rgba(0,0,0,.06), inset 0 1px 0 rgba(255,255,255,.35)",
    transition: "transform .08s ease, box-shadow .16s ease",
  },
  search: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "#E3D8C5",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#D9CEB9",
    borderRadius: 16,
    padding: 14,
  },
  searchIcon: { color: "#6D6458", fontSize: 15 },
  searchInput: {
    border: "none",
    outline: "none",
    background: "transparent",
    color: "#1b1b1b",
    fontWeight: 800,
    width: "100%",
    fontSize: 15,
  },
  filterBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "12px 14px",
    borderRadius: 16,
    background: "#E3D8C5",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#D9CEB9",
    color: "#1b1b1b",
    cursor: "pointer",
    fontWeight: 900,
  },
  filterDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    background: "#FFFFFF",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#D9CEB9",
  },
  pop: {
    position: "absolute",
    right: 0,
    marginTop: 8,
    width: 320,
    padding: 12,
    borderRadius: 14,
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#D9CEB9",
    background: "#FFFEFB",
    boxShadow: "0 18px 36px rgba(0,0,0,.14)",
    display: "grid",
    gap: 10,
    zIndex: 50,
  },
  fGroup: { display: "grid", gap: 6 },
  fLabel: { fontSize: 12, fontWeight: 900, color: "#6B6A66" },
  fRow: { display: "flex", gap: 8, flexWrap: "wrap" as const },
  fChip: {
    padding: "6px 10px",
    borderRadius: 999,
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#D9CEB9",
    background: "#E9DFCF",
    fontWeight: 800,
    fontSize: 12,
    cursor: "pointer",
  },
  fChipOn: {
    background: "#FFFFFF",
    borderColor: "#CABDA3",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,.4)",
  },
  fCheck: { display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 800 as any, color: "#1b1b1b" },
  resetBtn: {
    padding: "8px 10px",
    borderRadius: 10,
    background: "#E3D8C5",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#D9CEB9",
    fontWeight: 900,
    cursor: "pointer",
  },
  doneBtn: {
    padding: "8px 10px",
    borderRadius: 10,
    background: "#111827",
    border: "none",
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer",
  },
};

/* Page + modal styles (samme palett) */
const BG = "#F6F1E8";
const SHELL_BG = "#F8F5EF";
const CARD = "#FFFFFF";
const TEXT = "#0F172A";
const BORDER = "#E5E7EB";
const ACCENT = "#111827";

const sx: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: BG, display: "grid", placeItems: "center", padding: 24 },
  shell: {
    width: "min(820px, 94vw)",
    background: SHELL_BG,
    borderRadius: 28,
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#EEE4D6",
    padding: 20,
    boxShadow: "0 18px 36px rgba(0,0,0,0.06)",
  },
  topbar: { display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center", marginBottom: 10 },
  crumbDot: {
    width: 10,
    height: 10,
    borderRadius: 6,
    background: "#E9DFCF",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#D9CEB9",
  },
  topTitleRow: { justifySelf: "start", marginLeft: 8, fontWeight: 800, color: "#1F2937" },

  card: {
    background: CARD,
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 24,
    padding: 18,
    boxShadow: "0 10px 18px rgba(0,0,0,0.05)",
  },
  cardHeader: { fontWeight: 900, fontSize: 24, color: TEXT, marginBottom: 10 },

  notesList: { display: "grid", gap: 10, padding: "6px 2px 12px" },
  noteRowBtn: { border: "none", padding: 0, background: "transparent", textAlign: "left", cursor: "pointer" },
  noteRow: {
    borderRadius: 18,
    padding: "12px 14px",
    background: "#FFFFFF",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#F2F2F2",
    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
    display: "grid",
    gap: 4,
  },
  noteTitle: { fontSize: 22, fontWeight: 800, color: TEXT },
  notePreview: { fontSize: 15, color: "#6B7280", lineHeight: 1.4 },

  addRow: { display: "flex", justifyContent: "flex-end", marginTop: 8 },
  addPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 14px",
    borderRadius: 999,
    background: "#FFF",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#E6E6E6",
    boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
    fontWeight: 800,
    color: TEXT,
    cursor: "pointer",
  },

  modalBackdrop: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "grid", placeItems: "center", padding: 16, zIndex: 50 },
  modalCard: {
    width: "min(820px, 96vw)",
    background: "#FFFDF7",
    borderRadius: 20,
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#E8E1D2",
    boxShadow: "0 24px 48px rgba(0,0,0,0.18)",
    display: "grid",
    gridTemplateRows: "auto 1fr auto",
    maxHeight: "86vh",
    overflow: "hidden",
  },
  modalHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 16px",
    borderBottom: `1px solid ${BORDER}`,
    background: "#FFF9EE",
  },
  modalBody: { padding: 16, overflow: "auto", display: "grid", gap: 12 },
  modalSectionTitle: { fontWeight: 900, color: TEXT },
  modalNoteText: {
    background: "#FFFFFF",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    padding: 12,
    whiteSpace: "pre-wrap",
    lineHeight: 1.6,
    color: TEXT,
  },
  summaryCard: {
    background: "#FFFFFF",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    padding: 12,
  },
  modalFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderTop: `1px solid ${BORDER}`,
    background: "#FFF9EE",
  },

  primary: { padding: "8px 12px", borderRadius: 10, background: ACCENT, color: "#fff", border: "none", fontWeight: 900, cursor: "pointer" },
  ghost: { padding: "8px 12px", borderRadius: 10, background: "#F4F4F5", color: TEXT, border: "none", fontWeight: 800, cursor: "pointer" },
  closePill: {
    padding: "8px 14px",
    borderRadius: 999,
    background: "#FFFFFF",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: BORDER,
    fontWeight: 800,
    cursor: "pointer",
  },
};
