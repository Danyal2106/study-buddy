"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getBoard, listSubjects, addNote, type Subject, type Board } from "@/lib/localdb";

/* --------------- NAVBAR (gjenbrukbar for “New note”) --------------- */
function NewNoteNavbar({
  query,
  setQuery,
  onFindPrev,
  onFindNext,
  hitLabel,
  fontPx,
  setFontPx,
  focusMode,
  setFocusMode,
  onBack,
  onSave,
}: {
  query: string;
  setQuery: (v: string) => void;
  onFindPrev: () => void;
  onFindNext: () => void;
  hitLabel: string;
  fontPx: number;
  setFontPx: (px: number) => void;
  focusMode: boolean;
  setFocusMode: (v: boolean) => void;
  onBack: () => void;
  onSave: () => void;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        (document.getElementById("note-find") as HTMLInputElement | null)?.focus();
        e.preventDefault();
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div style={navsx.edge}>
      <div style={navsx.wrap as React.CSSProperties}>
        <div style={navsx.row}>
          {/* Back */}
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

          {/* Find in note */}
          <div style={navsx.search as React.CSSProperties}>
            <span style={navsx.searchIcon}>⌕</span>
            <input
              id="note-find"
              placeholder="Find in note… (Tip: ⌘/Ctrl+K)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Find in note"
              style={navsx.searchInput as React.CSSProperties}
            />
            <div style={navsx.findControls}>
              <span style={navsx.hitLabel}>{hitLabel}</span>
              <button type="button" style={navsx.stepBtn} onClick={onFindPrev} aria-label="Previous match">
                ↑
              </button>
              <button type="button" style={navsx.stepBtn} onClick={onFindNext} aria-label="Next match">
                ↓
              </button>
            </div>
          </div>

          {/* Filters */}
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
                    <div style={navsx.fLabel}>Text size</div>
                    <div style={navsx.fRow}>
                      {[14, 16, 18, 20, 22].map((px) => (
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
                    <input
                      type="checkbox"
                      checked={focusMode}
                      onChange={(e) => setFocusMode(e.target.checked)}
                    />
                    Focus mode (dim chrome)
                  </label>

                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      style={navsx.resetBtn}
                      onClick={() => {
                        setFontPx(18);
                        setFocusMode(false);
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

          {/* Save */}
          <button type="button" style={navsx.savePill} onClick={onSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NewNotePage() {
  const params = useParams<{ id: string; subjectId: string }>();
  const router = useRouter();
  const boardKey = decodeURIComponent(params.id || "untitled");
  const subjectId = decodeURIComponent(params.subjectId || "");

  const [board, setBoard] = useState<Board | null>(null);
  const [subject, setSubject] = useState<Subject | null>(null);

  const [title, setTitle] = useState("");
  const editorRef = useRef<HTMLDivElement>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [summary, setSummary] = useState<string>("");

  // Navbar state
  const [findQ, setFindQ] = useState("");
  const [hits, setHits] = useState<HTMLElement[]>([]);
  const [hitIdx, setHitIdx] = useState(0);
  const [fontPx, setFontPx] = useState(18);
  const [focusMode, setFocusMode] = useState(false);

  useEffect(() => {
    setBoard(getBoard(boardKey) ?? null);
    const subs = listSubjects(boardKey);
    setSubject(subs.find((s) => s.id === subjectId) ?? null);
  }, [boardKey, subjectId]);

  /* ---------- editor helpers ---------- */
  function focusEditor() {
    editorRef.current?.focus();
  }
  function cmd(c: "bold" | "italic" | "underline" | "justifyLeft" | "insertUnorderedList") {
    // eslint-disable-next-line deprecated/deprecation
    document.execCommand(c, false);
    focusEditor();
  }
  function applyFontSize(px: number) {
    setFontPx(px);
    // eslint-disable-next-line deprecated/deprecation
    document.execCommand("fontSize", false, "4");
    const root = editorRef.current;
    if (!root) return;
    root.querySelectorAll('font[size="4"]').forEach((node) => {
      const span = document.createElement("span");
      span.style.fontSize = `${px}px`;
      span.innerHTML = (node as HTMLElement).innerHTML;
      node.replaceWith(span);
    });
    focusEditor();
  }
  function stripFindMarks() {
    const el = editorRef.current;
    if (!el) return;
    el.querySelectorAll("mark[data-hit]").forEach((m) => {
      const t = document.createTextNode(m.textContent || "");
      m.replaceWith(t);
    });
  }
  function getEditorText(): string {
    const el = editorRef.current;
    // Stripp markeringer før lesing
    stripFindMarks();
    const text = (el?.innerText || "").replace(/\u00A0/g, " ");
    return text.replace(/\s+\n/g, "\n").trim();
  }
  function handleInput() {
    setLastSaved(new Date());
    refreshFind();
  }

  /* ---------- “find in note” ---------- */
  function escapeReg(s: string) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  function refreshFind() {
    const root = editorRef.current;
    if (!root) return;

    // fjern gamle markeringer
    root.querySelectorAll("mark[data-hit]").forEach((m) => {
      const t = document.createTextNode(m.textContent || "");
      m.replaceWith(t);
    });
    setHits([]);

    const q = findQ.trim();
    if (!q) return;

    const rx = new RegExp(escapeReg(q), "gi");
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    const toWrap: { node: Text; start: number; end: number }[] = [];
    let n: Node | null;
    while ((n = walker.nextNode())) {
      const txt = (n as Text).data;
      let m: RegExpExecArray | null;
      while ((m = rx.exec(txt))) {
        toWrap.push({ node: n as Text, start: m.index, end: m.index + m[0].length });
      }
    }
    // wrap fra slutten for å bevare indekser
    for (let i = toWrap.length - 1; i >= 0; i--) {
      const { node, start, end } = toWrap[i];
      const span = document.createElement("mark");
      span.setAttribute("data-hit", "1");
      span.style.background = "#FFF1A6";
      span.style.padding = "0 2px";
      const before = node.splitText(start);
      before.splitText(end - start);
      span.textContent = before.data;
      before.replaceWith(span);
    }

    const hs = Array.from(root.querySelectorAll("mark[data-hit]")) as HTMLElement[];
    setHits(hs);
    setHitIdx((idx) => (hs.length ? Math.min(idx, hs.length - 1) : 0));
    if (hs.length) hs[0].scrollIntoView({ block: "center", behavior: "smooth" });
  }
  useEffect(() => {
    refreshFind();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [findQ]);

  function goto(delta: number) {
    if (!hits.length) return;
    const next = (hitIdx + delta + hits.length) % hits.length;
    setHitIdx(next);
    const el = hits[next];
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    el.style.outline = "2px solid #F59E0B";
    setTimeout(() => (el.style.outline = "none"), 350);
  }

  function summarizeNow() {
    const text = getEditorText();
    const bullets = summarizeKeyPointsStrict(text, title, 4);
    setSummary(bullets.join("\n"));
    setLastSaved(new Date());
    refreshFind();
  }

  /* ---------- persist ---------- */
  function saveNote() {
    if (!subject) return;
    const t = title.trim();
    const plainBody = getEditorText();
    const storedPlain = t ? `${t}\n\n${plainBody}` : plainBody;
    addNote(boardKey, subject.id, storedPlain);
    setLastSaved(new Date());
    router.replace(
      `/boards/${encodeURIComponent(boardKey)}/subjects/${encodeURIComponent(subjectId)}/notes`
    );
  }

  function backToNotes() {
    router.replace(
      `/boards/${encodeURIComponent(boardKey)}/subjects/${encodeURIComponent(subjectId)}/notes`
    );
  }

  return (
    <>
      <NewNoteNavbar
        query={findQ}
        setQuery={setFindQ}
        onFindPrev={() => goto(-1)}
        onFindNext={() => goto(+1)}
        hitLabel={findQ ? (hits.length ? `${hitIdx + 1}/${hits.length}` : "0/0") : ""}
        fontPx={fontPx}
        setFontPx={(px) => applyFontSize(px)}
        focusMode={focusMode}
        setFocusMode={setFocusMode}
        onBack={backToNotes}
        onSave={saveNote}
      />

      <main style={{ ...sx.page, ...(focusMode ? { background: "#F3EEE6" } : null) }}>
        <section style={sx.shell}>
          {/* topbar inni kortet (breadcrumbs) */}
          <div style={sx.topbar}>
            <div style={sx.breadcrumbs}>
              <span style={{ opacity: 0.9 }}>Boards</span>
              <span style={{ opacity: 0.5, padding: "0 8px" }}>›</span>
              <span style={{ opacity: 0.9 }}>{board?.title || boardKey}</span>
              <span style={{ opacity: 0.5, padding: "0 8px" }}>›</span>
              <span style={{ opacity: 0.9 }}>{subject?.name || "Subject"}</span>
              <span style={{ opacity: 0.5, padding: "0 8px" }}>›</span>
              <span style={{ opacity: 0.9 }}>New note</span>
            </div>
            <div />
          </div>

          {/* title */}
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Tittel"
            style={sx.titleInput as React.CSSProperties}
          />

          {/* editor */}
          <div style={sx.editorWrap}>
            <div style={sx.toolbar}>
              <button type="button" style={sx.tbBtn} onClick={() => cmd("bold")} title="Bold">
                <b>B</b>
              </button>
              <button type="button" style={sx.tbBtn} onClick={() => cmd("italic")} title="Italic">
                <i>I</i>
              </button>
              <button type="button" style={sx.tbBtn} onClick={() => cmd("underline")} title="Underline">
                <u>U</u>
              </button>
              <div style={sx.sep} />
              <button type="button" style={sx.tbBtn} onClick={() => cmd("justifyLeft")} title="Align left">
                ≡
              </button>
              <div style={{ flex: 1 }} />
              <div style={{ display: "flex", gap: 6 }}>
                <button type="button" style={sx.pillGhost} onClick={() => applyFontSize(Math.max(12, fontPx - 2))}>
                  A–
                </button>
                <button type="button" style={sx.pillGhost} onClick={() => applyFontSize(18)}>
                  A
                </button>
                <button type="button" style={sx.pillGhost} onClick={() => applyFontSize(Math.min(26, fontPx + 2))}>
                  A+
                </button>
                <button
                  type="button"
                  style={{ ...sx.pillGhost, fontWeight: 800 }}
                  onClick={() => cmd("insertUnorderedList")}
                >
                  • List
                </button>
              </div>
            </div>

            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={handleInput}
              style={{ ...sx.editor, fontSize: fontPx }}
              aria-label="Notatinnhold"
            />
          </div>

          {/* actions */}
          <div style={sx.actions}>
            <button type="button" style={sx.aiBtn} onClick={summarizeNow}>
              Oppsummer
            </button>
            <button type="button" style={sx.saveBtn} onClick={saveNote}>
              Lagre
            </button>
          </div>

          {/* summary */}
          <div style={sx.summaryCard}>
            <div style={sx.summaryTitle}>Oppsummering</div>
            {summary ? (
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {summary.split("\n").map((line, i) =>
                  line.trim() ? (
                    <li key={i} style={{ color: "#1F2937", lineHeight: 1.5 }}>
                      {line}
                    </li>
                  ) : null
                )}
              </ul>
            ) : (
              <div style={{ color: "#6B7280" }}>Ingen oppsummering ennå.</div>
            )}
          </div>

          <div style={sx.savedAt}>
            {lastSaved ? `Sist lagret: kl. ${fmtTime(lastSaved)}` : "Ingen endringer lagret ennå"}
          </div>
        </section>
      </main>
    </>
  );
}

/* ---- STRICT KEY POINTS ---- */
function summarizeKeyPointsStrict(text: string, title = "", maxBullets = 4): string[] {
  const lines = (text || "").split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const bulletRaw = lines.filter((l) => /^[-*•]\s+/.test(l));
  if (bulletRaw.length) {
    const scored = bulletRaw
      .map((l) => l.replace(/^[-*•]\s+/, ""))
      .map((s) => ({ s, score: infoScore(s, title) }))
      .sort((a, b) => b.score - a.score);
    return scored.map((x) => compress(x.s)).filter((s) => tokenCount(s) >= 5).slice(0, 3);
  }

  const sentences = splitSentences(text);
  if (!sentences.length) return [];

  const stop = STOP_WORDS;
  const freq = new Map<string, number>();
  const tokAll: string[][] = [];
  for (const s of sentences) {
    const t = (s.toLowerCase().match(/[a-zæøå0-9]+/gi) || []).filter((w) => !stop.has(w));
    tokAll.push(t);
    for (const w of t) freq.set(w, (freq.get(w) || 0) + 1);
  }
  const maxF = Math.max(1, ...freq.values());

  function scoreSentence(s: string, i: number) {
    const t = tokAll[i];
    let sc = t.reduce((sum, w) => sum + (freq.get(w)! / maxF), 0);
    if (/\b(er|betyr|defineres|omhandler|kjennetegnes|består av)\b/i.test(s)) sc += 1.4;
    if (/[0-9]/.test(s)) sc += 1.0;
    if (/:|—|–|- /.test(s)) sc += 0.6;
    if (title) {
      const tset = new Set((title.toLowerCase().match(/[a-zæøå0-9]+/gi) || []).filter((w) => !stop.has(w)));
      sc += t.filter((w) => tset.has(w)).length * 0.6;
    }
    const wc = Math.max(1, t.length);
    sc = sc / Math.sqrt(wc);
    if (i === 0) sc += 0.5;
    if (wc < 6) sc *= 0.5;
    if (wc > 40) sc *= 0.7;
    return sc;
  }

  const ranked = sentences.map((s, i) => ({ s, score: scoreSentence(s, i) })).sort((a, b) => b.score - a.score);
  const target = Math.min(maxBullets, text.length > 800 ? 4 : 3);
  const out: string[] = [];
  for (const r of ranked) {
    let cand = compress(r.s);
    if (tokenCount(cand) < 6) continue;
    const dup = out.some((x) => jaccardSimilar(x, cand) > 0.65 || x.includes(cand) || cand.includes(x));
    if (!dup) out.push(cand);
    if (out.length >= target) break;
  }
  return out;
}

const STOP_WORDS = new Set<string>([
  "og","i","på","som","det","en","et","å","for","med","av","er","til","den","de","har","kan","fra","om",
  "eller","men","så","at","hva","hvor","når","vi","du","jeg","oss","dere","der","dette","disse","blir","ble","ved",
  "the","and","a","an","to","of","in","on","for","with","by","is","are","was","were","be","it","that","this","as","or","but","so","at","from","we","you","they"
]);
function splitSentences(text: string): string[] {
  return (text || "").replace(/\s+/g, " ").split(/(?<=[.!?])\s+(?=[A-ZÆØÅ])/).map((s) => s.trim()).filter(Boolean);
}
function infoScore(s: string, title = ""): number {
  const toks = (s.toLowerCase().match(/[a-zæøå0-9]+/gi) || []).filter((w) => !STOP_WORDS.has(w));
  let sc = toks.length;
  if (/[0-9]/.test(s)) sc += 2;
  if (/:|—|–|- /.test(s)) sc += 1;
  if (title) {
    const tset = new Set((title.toLowerCase().match(/[a-zæøå0-9]+/gi) || []).filter((w) => !STOP_WORDS.has(w)));
    sc += toks.filter((w) => tset.has(w)).length * 0.7;
  }
  return sc / Math.sqrt(Math.max(1, toks.length));
}
function compress(s: string): string {
  let x = s.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s*\[[^\]]*\]\s*/g, " ");
  x = x.split(/;\s+|—|–|:/)[0] || x;
  x = x.replace(/\s+/g, " ").trim();
  if (x.length > 160) x = x.slice(0, 157) + "…";
  return x;
}
function tokenCount(s: string) {
  return (s.match(/[a-zæøå0-9]+/gi) || []).length;
}
function jaccardSimilar(a: string, b: string) {
  const tok = (s: string) => new Set((s.toLowerCase().match(/[a-zæøå0-9]+/gi) || []));
  const A = tok(a), B = tok(b);
  const inter = [...A].filter((x) => B.has(x)).length;
  const union = new Set([...A, ...B]).size || 1;
  return inter / union;
}
function fmtTime(d: Date) {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

/* ---------------- styles ---------------- */
/* Navbar palette (samme som andre skjermene) */
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
  row: { display: "grid", gridTemplateColumns: "auto 1fr auto auto", alignItems: "center", gap: 14 },
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
    padding: "12px 14px",
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
  findControls: { display: "flex", alignItems: "center", gap: 6, marginLeft: "auto" },
  hitLabel: { color: "#584f44", fontWeight: 900, minWidth: 46, textAlign: "right" },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    background: "#F6F0E6",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#D9CEB9",
    cursor: "pointer",
    fontWeight: 900,
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
  fChipOn: { background: "#FFFFFF", borderColor: "#CABDA3", boxShadow: "inset 0 1px 0 rgba(255,255,255,.4)" },
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
  doneBtn: { padding: "8px 10px", borderRadius: 10, background: "#111827", border: "none", color: "#fff", fontWeight: 900, cursor: "pointer" },
  savePill: {
    padding: "12px 14px",
    borderRadius: 16,
    background: "#111827",
    color: "#fff",
    border: "none",
    fontWeight: 900,
    cursor: "pointer",
    boxShadow: "0 10px 20px rgba(0,0,0,.12)",
  },
};

/* Page + editor styles */
const BG = "#FFF7EA";
const SHELL_BORDER = "#F0E7D8";
const CARD = "#FFFFFF";
const TEXT = "#111827";
const SUB = "#6B7280";
const BORDER = "#E5E7EB";

const sx: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: BG, display: "grid", placeItems: "center", padding: 16 },
  shell: {
    width: "min(860px, 94vw)",
    background: "#FFF8EE",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: SHELL_BORDER,
    borderRadius: 18,
    padding: 16,
    boxShadow: "0 10px 22px rgba(0,0,0,0.05)",
  },
  topbar: { display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", padding: "4px 6px 10px" },
  breadcrumbs: { fontWeight: 700, color: "#3F3F46" },

  titleInput: {
    width: "100%",
    border: "none",
    background: "transparent",
    outline: "none",
    fontSize: 34,
    fontWeight: 900,
    color: TEXT,
    padding: "8px 4px",
    margin: "6px 0 10px",
  },

  editorWrap: {
    background: CARD,
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    overflow: "hidden",
  },
  toolbar: { display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderBottom: `1px solid ${BORDER}`, background: "#FAFAFA" },
  tbBtn: { width: 36, height: 30, borderRadius: 8, border: `1px solid ${BORDER}`, background: "#FFFFFF", fontWeight: 900, cursor: "pointer" },
  sep: { width: 1, height: 24, background: BORDER, margin: "0 4px" },
  pillGhost: { padding: "6px 10px", borderRadius: 999, border: `1px solid ${BORDER}`, background: "#FFFFFF", cursor: "pointer", fontWeight: 700 },
  editor: { minHeight: 200, padding: 12, outline: "none", lineHeight: 1.6, color: TEXT },

  actions: { display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 },
  aiBtn: { padding: "10px 14px", borderRadius: 8, background: "#F2EAD7", border: "1px solid #E6D9BD", fontWeight: 800, cursor: "pointer" },
  saveBtn: { padding: "10px 14px", borderRadius: 8, background: "#111827", color: "#fff", border: "none", fontWeight: 900, cursor: "pointer" },

  summaryCard: { marginTop: 12, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 14 },
  summaryTitle: { fontWeight: 900, color: TEXT, marginBottom: 6 },

  savedAt: { color: SUB, fontSize: 13, marginTop: 10 },
};
