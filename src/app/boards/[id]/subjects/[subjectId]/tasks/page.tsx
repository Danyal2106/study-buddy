"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { listSubjects, type Subject } from "@/lib/localdb";

/** Lokal Task-type – lagres sammen med subject i localStorage (sb_local_v1) */
type Task = {
  id: string;
  title: string;
  description?: string;
  dueAt?: string;         // ISO-dato eller "" (ingen tid)
  createdAt: string;      // ISO
  completedAt?: string;   // ISO eller undefined
  important?: boolean;
};

const LS_KEY = "sb_local_v1";

/* -------------------- NAVBAR (samme palett + lokal søk/filtre) -------------------- */
function TasksNavbar({
  query,
  setQuery,
  filter,
  setFilter,
  importantOnly,
  setImportantOnly,
  onBack,
}: {
  query: string;
  setQuery: (v: string) => void;
  filter: "all" | "active" | "done";
  setFilter: (v: "all" | "active" | "done") => void;
  importantOnly: boolean;
  setImportantOnly: (v: boolean) => void;
  onBack: () => void;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        (document.getElementById("tasks-search") as HTMLInputElement | null)?.focus();
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
          {/* Tilbake */}
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

          {/* Søk – lokalt til Tasks */}
          <div style={navsx.search as React.CSSProperties}>
            <span style={navsx.searchIcon}>⌕</span>
            <input
              id="tasks-search"
              placeholder="Search tasks… (Tip: ⌘/Ctrl+K)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search tasks"
              style={navsx.searchInput as React.CSSProperties}
            />
          </div>

          {/* Filters-knapp */}
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

            {/* Popover (lokal for Tasks) */}
            {open && (
              <div role="dialog" aria-label="Filters" style={navsx.pop}>
                <div style={{ display: "grid", gap: 10 }}>
                  <div style={navsx.fGroup}>
                    <div style={navsx.fLabel}>Status</div>
                    <div style={navsx.fRow}>
                      {(["all", "active", "done"] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setFilter(s)}
                          style={{ ...navsx.fChip, ...(filter === s ? navsx.fChipOn : {}) }}
                        >
                          {s[0].toUpperCase() + s.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label style={navsx.fCheck}>
                    <input
                      type="checkbox"
                      checked={importantOnly}
                      onChange={(e) => setImportantOnly(e.target.checked)}
                    />
                    Important only
                  </label>

                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      style={navsx.resetBtn}
                      onClick={() => {
                        setFilter("all");
                        setImportantOnly(false);
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

/* -------------------- Side -------------------- */
export default function TasksPage() {
  const params = useParams<{ id: string; subjectId: string }>();
  const router = useRouter();
  const boardKey = decodeURIComponent(params.id || "untitled");
  const subjectId = decodeURIComponent(params.subjectId || "");

  const [mounted, setMounted] = useState(false);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [modal, setModal] = useState<{ mode: "new" | "edit"; task?: Task | null } | null>(null);

  // navbar state
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "done">("all");
  const [importantOnly, setImportantOnly] = useState(false);

  /** Når klienten er mountet kan vi trygt lese localStorage */
  useEffect(() => {
    setMounted(true);
  }, []);

  /** Hent subject + tasks */
  function refresh() {
    const subs = listSubjects(boardKey);
    const s = subs.find((x) => x.id === subjectId) ?? null;
    if (s && !Array.isArray((s as any).tasks)) (s as any).tasks = [];
    setSubject(s);
  }
  useEffect(() => {
    if (!mounted) return;
    refresh();
    // også reagér på storage-endringer (andre faner)
    const onStorage = (ev: StorageEvent) => {
      if (ev.key === LS_KEY) refresh();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [mounted, boardKey, subjectId]);

  /** Les/skriv i samme localStorage-objekt som notes/flashcards (sb_local_v1) */
  function updateStore(mutator: (subj: any) => void) {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    const board = data?.boards?.[boardKey];
    if (!board) return;
    const subj = (board.subjects || []).find((s: any) => s.id === subjectId);
    if (!subj) return;
    if (!Array.isArray(subj.tasks)) subj.tasks = [];
    mutator(subj);
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  }

  function addTask(input: { title: string; description?: string; dueAt?: string; important?: boolean }) {
    updateStore((subj) => {
      const t: Task = {
        id: cryptoRandomId(),
        title: input.title.trim(),
        description: input.description?.trim() || "",
        dueAt: input.dueAt || "",
        createdAt: new Date().toISOString(),
        important: !!input.important,
      };
      subj.tasks.unshift(t);
    });
    refresh();
  }
  function updateTask(taskId: string, patch: Partial<Task>) {
    updateStore((subj) => {
      const t: Task | undefined = (subj.tasks as Task[]).find((x) => x.id === taskId);
      if (!t) return;
      Object.assign(t, patch);
    });
    refresh();
  }
  function toggleDone(taskId: string) {
    updateStore((subj) => {
      const t: Task | undefined = (subj.tasks as Task[]).find((x) => x.id === taskId);
      if (!t) return;
      t.completedAt = t.completedAt ? undefined : new Date().toISOString();
    });
    refresh();
  }
  function toggleImportant(taskId: string) {
    updateStore((subj) => {
      const t: Task | undefined = (subj.tasks as Task[]).find((x) => x.id === taskId);
      if (!t) return;
      t.important = !t.important;
    });
    refresh();
  }
  function deleteTask(taskId: string) {
    updateStore((subj) => {
      subj.tasks = (subj.tasks as Task[]).filter((t: Task) => t.id !== taskId);
    });
    refresh();
  }

  /** Avledet liste */
  const tasks: Task[] = useMemo(() => (subject?.tasks as Task[]) || [], [subject]);

  const tokens = useMemo(() => query.toLowerCase().normalize("NFKD").split(/\s+/).filter(Boolean), [query]);

  const filtered = useMemo(() => {
    let arr = tasks;

    // statusfilter
    if (filter === "active") arr = arr.filter((t) => !t.completedAt);
    if (filter === "done") arr = arr.filter((t) => !!t.completedAt);

    // important-only
    if (importantOnly) arr = arr.filter((t) => t.important);

    // søk på tittel/desc
    if (tokens.length) {
      arr = arr.filter((t) =>
        tokens.every((tok) => `${t.title} ${t.description || ""}`.toLowerCase().includes(tok))
      );
    }

    // Sortering:
    // 1) Ferdige nederst
    // 2) Blant aktive: viktige først
    // 3) Stigende forfallsdato
    // 4) Opprettet
    const score = (t: Task) => {
      const isDone = !!t.completedAt;
      const doneWeight = isDone ? 1e14 : 0;
      const importantBoost = !isDone && t.important ? -1e12 : 0;
      const due = safeParseMs(t.dueAt) ?? Number.MAX_SAFE_INTEGER / 2;
      const created = safeParseMs(t.createdAt) ?? 0;
      return doneWeight + importantBoost + due + created / 1e7;
    };
    return [...arr].sort((a, b) => score(a) - score(b));
  }, [tasks, filter, importantOnly, tokens]);

  /* ---------- Render ---------- */
  return (
    <>
      <TasksNavbar
        query={query}
        setQuery={setQuery}
        filter={filter}
        setFilter={setFilter}
        importantOnly={importantOnly}
        setImportantOnly={setImportantOnly}
        onBack={() =>
          router.replace(
            `/boards/${encodeURIComponent(boardKey)}/subjects/${encodeURIComponent(subjectId)}`
          )
        }
      />

      <main style={sx.page}>
        <section style={sx.shell}>
          {/* Topcrumb inni kortet for konsistens */}
          <div style={sx.topbar}>
            <div style={sx.crumbDot} />
            <div style={sx.topCrumb}>
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
            </div>
            <div />
          </div>

          <h1 style={sx.subjectTitle}>Tasks</h1>
          <h2 style={sx.h2}>Set up tasks and deadlines</h2>

          {/* Tabs + Add (beholdes, siden Filters ligger i navbar) */}
          <div style={sx.toolsRow}>
            <div style={sx.tabs}>
              <button
                type="button"
                style={{ ...sx.tabBtn, ...(filter === "all" ? sx.tabActive : {}) }}
                onClick={() => setFilter("all")}
              >
                All
              </button>
              <button
                type="button"
                style={{ ...sx.tabBtn, ...(filter === "active" ? sx.tabActive : {}) }}
                onClick={() => setFilter("active")}
              >
                Active
              </button>
              <button
                type="button"
                style={{ ...sx.tabBtn, ...(filter === "done" ? sx.tabActive : {}) }}
                onClick={() => setFilter("done")}
              >
                Done
              </button>
            </div>
            <button type="button" style={sx.addPill} onClick={() => setModal({ mode: "new" })}>
              <span style={{ fontWeight: 900, fontSize: 18, lineHeight: 0, marginRight: 8 }}>+</span>
              Add Task
            </button>
          </div>

          {/* List card */}
          <div style={sx.listCard}>
            {!mounted ? (
              <div style={{ color: "#9CA3AF", fontStyle: "italic" }}>Loading…</div>
            ) : !filtered.length ? (
              <div style={{ color: "#6B7280" }}>No tasks yet.</div>
            ) : (
              <div style={sx.tasksList}>
                {filtered.map((t) => (
                  <div
                    key={t.id}
                    style={{
                      ...sx.taskRow,
                      ...(t.important && !t.completedAt ? sx.rowImportant : {}),
                      ...(t.completedAt ? sx.rowDone : {}),
                    }}
                  >
                    {/* Fullført */}
                    <label style={sx.chkWrap}>
                      <input type="checkbox" checked={!!t.completedAt} onChange={() => toggleDone(t.id)} />
                    </label>

                    {/* Innhold + meta + knapper */}
                    <button
                      type="button"
                      onClick={() => setModal({ mode: "edit", task: t })}
                      style={sx.rowBtn as React.CSSProperties}
                    >
                      <div style={sx.rowMain}>
                        <div
                          style={{
                            ...sx.taskTitle,
                            ...(t.completedAt ? { textDecoration: "line-through", opacity: 0.65 } : {}),
                          }}
                        >
                          {t.title || "Untitled"}
                        </div>
                        {t.description ? <div style={sx.taskDesc}>{t.description}</div> : null}
                        {t.important && !t.completedAt ? (
                          <div style={sx.tagImportant}>
                            <span style={{ marginRight: 6 }}>⚑</span> Important
                          </div>
                        ) : null}
                      </div>

                      <div style={sx.rowMeta}>
                        {t.dueAt && isValidDateString(t.dueAt) ? (
                          <span style={dueStyle(t)}>{fmtDue(t.dueAt)}</span>
                        ) : (
                          <span style={{ color: "#9CA3AF" }}>No due</span>
                        )}
                      </div>
                    </button>

                    {/* Hurtig-flag toggle */}
                    <button
                      type="button"
                      onClick={() => toggleImportant(t.id)}
                      title={t.important ? "Remove important" : "Mark important"}
                      style={sx.flagBtn}
                      aria-label="Toggle important"
                    >
                      {t.important ? "★" : "☆"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Modal (New/Edit) */}
      {mounted && modal && (
        <TaskModal
          mode={modal.mode}
          task={modal.task || undefined}
          onClose={() => setModal(null)}
          onCreate={(payload) => {
            addTask(payload);
            setModal(null);
          }}
          onUpdate={(id, patch) => {
            updateTask(id, patch);
            setModal(null);
          }}
          onDelete={(id) => {
            deleteTask(id);
            setModal(null);
          }}
        />
      )}
    </>
  );
}

/* ---------------- Modal component ---------------- */
function TaskModal(props: {
  mode: "new" | "edit";
  task?: Task;
  onClose: () => void;
  onCreate: (p: { title: string; description?: string; dueAt?: string; important?: boolean }) => void;
  onUpdate: (id: string, p: Partial<Task>) => void;
  onDelete: (id: string) => void;
}) {
  const [title, setTitle] = useState(props.task?.title ?? "");
  const [description, setDescription] = useState(props.task?.description ?? "");
  // KUN dato – ingen tid
  const [date, setDate] = useState<string>(() => (props.task?.dueAt ? toLocalDateInput(props.task.dueAt) : ""));
  const [important, setImportant] = useState<boolean>(!!props.task?.important);
  const canSave = title.trim().length > 0;

  function submit() {
    const dueAt = buildISODateOnly(date); // validerer / returnerer "" hvis ugyldig
    if (props.mode === "new") {
      props.onCreate({ title: title.trim(), description: description.trim(), dueAt, important });
    } else if (props.task) {
      props.onUpdate(props.task.id, { title: title.trim(), description: description.trim(), dueAt, important });
    }
  }

  return (
    <div role="dialog" aria-modal="true" style={sx.modalBackdrop} onClick={(e) => e.target === e.currentTarget && props.onClose()}>
      <div style={sx.modalCard}>
        <div style={sx.modalHeader}>
          <div style={{ fontWeight: 900, fontSize: 18 }}>{props.mode === "new" ? "Add Task" : "Edit Task"}</div>
          <button type="button" style={sx.ghost} onClick={props.onClose}>Close</button>
        </div>

        <div style={sx.modalBody}>
          <label style={sx.label}>Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Write a clear task title…"
            style={sx.input as React.CSSProperties}
            autoFocus
          />

        <label style={sx.label}>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional details…"
            style={sx.textarea as React.CSSProperties}
          />

          <div>
            <label style={sx.label}>Due date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={sx.input as React.CSSProperties} />
          </div>

          {important ? (
            <div style={sx.importantHint}>
              <span style={{ marginRight: 6 }}>⚑</span>
              This task will be highlighted and shown at the top.
            </div>
          ) : null}

          <label style={{ ...sx.label, display: "flex", alignItems: "center", gap: 8 }}>
            <input type="checkbox" checked={important} onChange={(e) => setImportant(e.target.checked)} />
            Mark as Important
          </label>
        </div>

        <div style={sx.modalFooter}>
          {props.mode === "edit" && props.task ? (
            <button type="button" style={sx.danger} onClick={() => props.onDelete(props.task!.id)}>
              Delete
            </button>
          ) : (
            <span />
          )}

          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" style={sx.ghost} onClick={props.onClose}>
              Cancel
            </button>
            <button type="button" style={sx.primary} disabled={!canSave} onClick={submit}>
              {props.mode === "new" ? "Create" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- helpers ---------------- */
function cryptoRandomId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    // @ts-ignore
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

/** Kun dato. Returnerer ISO ved gyldig YYYY-MM-DD, ellers "" */
function buildISODateOnly(date: string) {
  if (!date) return "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return "";
  const ms = Date.parse(`${date}T00:00:00`);
  if (Number.isNaN(ms)) return "";
  return new Date(ms).toISOString();
}

function safeParseMs(iso?: string): number | null {
  if (!iso) return null;
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? null : ms;
}
function isValidDateString(iso?: string) {
  return safeParseMs(iso) !== null;
}
function fmtDue(iso?: string) {
  const ms = safeParseMs(iso);
  if (ms === null) return "No due";
  const d = new Date(ms);
  return d.toLocaleDateString();
}
function isPast(iso?: string) {
  const ms = safeParseMs(iso);
  if (ms === null) return false;
  const today = new Date();
  const todayMs = Date.parse(new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString());
  const that = new Date(ms);
  const thatMs = Date.parse(new Date(that.getFullYear(), that.getMonth(), that.getDate()).toISOString());
  return thatMs < todayMs;
}
function dueStyle(t: Task): React.CSSProperties {
  if (t.completedAt) return { color: "#6B7280" };
  if (!t.dueAt || !isValidDateString(t.dueAt)) return { color: "#1F2937", fontWeight: 800 };
  if (isPast(t.dueAt)) return { color: "#B91C1C", fontWeight: 900 };
  return { color: "#1F2937", fontWeight: 800 };
}
/** ISO → "YYYY-MM-DD" for <input type="date"> */
function toLocalDateInput(iso: string): string {
  const ms = safeParseMs(iso);
  if (ms === null) return "";
  const d = new Date(ms);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/* ---------------- styles ---------------- */
/* Fargepalett matcher de andre sidene */
const BG = "linear-gradient(180deg,#F7F4ED 0%, #FAF7F0 100%)";
const SHELL_BG = "linear-gradient(180deg,#FFFEFB 0%, #FCFAF6 100%)";
const TEXT = "#0F172A";
const SUB = "#6B7280";
const BORDER = "#E6E1D7";
const ACCENT = "#111827";
const IMPORTANT_BG = "#FEF2F2";
const IMPORTANT_BORDER = "#FECACA";
const IMPORTANT_TEXT = "#B91C1C";

/* Navbar styles */
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
  row: {
    display: "grid",
    gridTemplateColumns: "auto 1fr auto",
    alignItems: "center",
    gap: 14,
  },
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

/* Page styles */
const sx: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: BG, display: "grid", placeItems: "center", padding: 20 },
  shell: {
    width: "min(760px, 94vw)",
    background: SHELL_BG,
    borderRadius: 24,
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: BORDER,
    boxShadow: "0 18px 36px rgba(0,0,0,0.06)",
    padding: 20,
  },
  topbar: { display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center" },
  crumbDot: {
    width: 10,
    height: 10,
    borderRadius: 6,
    background: "#E9DFCF",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#D9CEB9",
  },
  topCrumb: { justifySelf: "start", marginLeft: 8, fontWeight: 800, color: "#1F2937" },

  subjectTitle: { textAlign: "center", fontSize: 32, fontWeight: 900, color: "#0F172A", margin: "18px 0 4px" },
  h2: { textAlign: "center", fontSize: 20, fontWeight: 900, color: TEXT, margin: "0 0 16px" },

  toolsRow: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  tabs: { display: "flex", gap: 6 },
  tabBtn: {
    padding: "8px 12px",
    borderRadius: 999,
    background: "#FFFFFF",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#E6E6E6",
    cursor: "pointer",
    fontWeight: 800,
  },
  tabActive: {
    background: "#F6F8FF",
    borderColor: "#E0E7FF",
    color: "#3B4C9A",
  },

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

  listCard: {
    background: "#FFFFFF",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#ECECEC",
    borderRadius: 18,
    padding: 14,
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
  },
  tasksList: { display: "grid", gap: 8 },

  taskRow: {
    display: "grid",
    gridTemplateColumns: "auto 1fr auto",
    gap: 8,
    alignItems: "center",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#F2F2F2",
    background: "#FFFFFF",
    borderRadius: 14,
    padding: 10,
    boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
  },
  rowImportant: {
    background: IMPORTANT_BG,
    borderColor: IMPORTANT_BORDER,
  },
  rowDone: {},

  chkWrap: { width: 28, display: "grid", placeItems: "center" } as React.CSSProperties,
  rowBtn: { display: "grid", gridTemplateColumns: "1fr auto", gap: 10, border: "none", background: "transparent", textAlign: "left", padding: 0, cursor: "pointer" },
  rowMain: { display: "grid", gap: 4 },
  rowMeta: { alignSelf: "center" },
  taskTitle: { fontWeight: 900, color: TEXT },
  taskDesc: { color: SUB, fontSize: 14 },

  tagImportant: {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 8px",
    borderRadius: 999,
    fontWeight: 900,
    background: "#FEE2E2",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: IMPORTANT_BORDER,
    color: IMPORTANT_TEXT,
    width: "fit-content",
  },
  flagBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#E6E6E6",
    background: "#FFFFFF",
    cursor: "pointer",
    fontSize: 18,
  },

  /* Modal */
  modalBackdrop: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "grid", placeItems: "center", padding: 16, zIndex: 50 },
  modalCard: {
    width: "min(640px, 94vw)",
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
  modalHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: 12, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderBottom: `1px solid ${BORDER}`, background: "#FFF9EE" },
  modalBody: { padding: 14, display: "grid", gap: 8, overflow: "auto" },
  modalFooter: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: 12, borderTop: `1px solid ${BORDER}`, background: "#FFF9EE" },

  label: { fontWeight: 900, color: TEXT },
  input: { borderStyle: "solid", borderWidth: 1, borderColor: "#E5E7EB", background: "#FFFFFF", borderRadius: 12, padding: "10px 12px", outline: "none", color: TEXT, width: "100%" },
  textarea: { borderStyle: "solid", borderWidth: 1, borderColor: "#E5E7EB", background: "#FFFFFF", borderRadius: 12, padding: "10px 12px", outline: "none", color: TEXT, minHeight: 90, resize: "vertical", width: "100%" },

  importantHint: {
    background: "#FFF1F2",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: IMPORTANT_BORDER,
    color: IMPORTANT_TEXT,
    borderRadius: 12,
    padding: 10,
    fontWeight: 800,
  },

  primary: { padding: "10px 14px", borderRadius: 12, background: ACCENT, color: "#fff", border: "none", fontWeight: 900, cursor: "pointer" },
  ghost: { padding: "10px 14px", borderRadius: 12, background: "#F4F4F5", color: TEXT, border: "none", fontWeight: 800, cursor: "pointer" },
  danger: { padding: "10px 14px", borderRadius: 12, background: "#B91C1C", color: "#fff", border: "none", fontWeight: 900, cursor: "pointer" },
};
