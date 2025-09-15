"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

/* ---------------- Local types ---------------- */
type Note = { id: string; text: string; createdAt: string | number };
type Card = { id: string; q: string; a: string; createdAt: string | number };
type Task = {
  id: string;
  title: string;
  description?: string;
  dueAt?: string; // ISO
  createdAt: string; // ISO
  completedAt?: string; // ISO
  important?: boolean;
};
type SubjectBlob = {
  id: string;
  name: string;
  createdAt: string | number;
  notes?: Note[];
  cards?: Card[];
  tasks?: Task[];
};
type BoardBlob = {
  key?: string;
  title: string;
  createdAt?: string;
  subjects: SubjectBlob[];
};
type Store = { boards: Record<string, BoardBlob> };

type BoardSnap = {
  key: string;
  title: string;
  subjectCount: number;
  noteCount: number;
  cardCount: number;
};
type SubjectSnap = {
  boardKey: string;
  subjectId: string;
  name: string;
  noteCount: number;
  cardCount: number;
};

type Upcoming = { id: string; title: string; meta: string; dueAt?: string; important?: boolean };
type PlannerChip = { id: string; title: string; weekday: string; color: string };
type LatestCard = { q: string; a: string };

/* ------------ Search index ------------ */
type SearchHitKind = "board" | "subject" | "note" | "card" | "task";
type SearchHit = {
  kind: SearchHitKind;
  boardKey: string;
  subjectId?: string;
  title: string;
  text: string;
  dueAt?: string;
  important?: boolean;
};

/* -------- User -------- */
type Me = { email: string; firstName?: string; name?: string };
function initialFrom(s: string) {
  return (s?.trim()?.[0] ?? "A").toUpperCase();
}

/* ---------------- helpers ---------------- */
function parseMs(v: string | number | undefined | null): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return v;
  const ms = Date.parse(v);
  return Number.isNaN(ms) ? null : ms;
}
function fmtDue(iso?: string) {
  const ms = parseMs(iso || "");
  if (ms === null) return "No due";
  const d = new Date(ms);
  const dd = d.toLocaleDateString();
  const tt = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return `${dd} • ${tt}`;
}
function weekdayFor(iso?: string) {
  const ms = parseMs(iso || "");
  if (ms === null) return "—";
  const d = new Date(ms);
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
}
function isCard(x: any): x is Card {
  return x && typeof x.q === "string" && typeof x.a === "string";
}

/* subject-farger via CSS-variabler (dette gir fine mørke varianter) */
function subjectColors(i: number) {
  const bgVars = ["var(--subj1-bg)", "var(--subj2-bg)", "var(--subj3-bg)", "var(--subj4-bg)"];
  const brVars = ["var(--subj1-border)", "var(--subj2-border)", "var(--subj3-border)", "var(--subj4-border)"];
  return { bg: bgVars[i % 4], border: brVars[i % 4] };
}

/* ---------- Flashcards preview ---------- */
function FlashcardsPreview({
  card,
  showAnswer,
  onToggle,
}: {
  card: LatestCard | null;
  showAnswer: boolean;
  onToggle: () => void;
}) {
  const qText = card?.q ?? "—";
  const aText = card?.a ?? "—";
  return (
    <section style={sx.card} className="elev">
      <h2 style={sx.cardTitle}>Flashcards</h2>
      {card ? (
        <div style={sx.flashInner as React.CSSProperties}>
          <div style={sx.flashQuestion}>{showAnswer ? <>Answer: {aText}</> : <>Question: {qText}</>}</div>
          <button type="button" style={sx.flashBtn} onClick={onToggle}>
            <span style={sx.flashBtnText}>{showAnswer ? "Hide Answer" : "Show Answer"}</span>
          </button>
        </div>
      ) : (
        <div style={sx.empty}>Ingen flashcard. LAG FLASHCARD NÅ</div>
      )}
    </section>
  );
}

/* ---------------- Dashboard ---------------- */
export default function Dashboard() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [twoCols, setTwoCols] = useState(false);

  // ekte bruker
  const [me, setMe] = useState<Me | null>(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/me", { credentials: "include" });
        if (alive && res.ok) {
          const data = (await res.json()) as Me;
          setMe(data);
          return;
        }
      } catch {}
      try {
        const raw = localStorage.getItem("sb_user");
        if (alive && raw) setMe(JSON.parse(raw) as Me);
      } catch {}
    })();
    return () => {
      alive = false;
    };
  }, []);

  const displayName = useMemo(() => {
    if (!me) return "Student";
    return me.firstName?.trim() || me.name?.trim() || me.email?.split("@")[0] || "Student";
  }, [me]);
  const email = me?.email ?? "—";
  const avatarInitial = useMemo(() => initialFrom(displayName), [displayName]);

  // responsive columns
  useEffect(() => {
    const applyCols = () => setTwoCols(window.innerWidth >= 980);
    applyCols();
    window.addEventListener("resize", applyCols);
    return () => window.removeEventListener("resize", applyCols);
  }, []);

  function handleNewBoard() {
    setCreating(true);
    router.push("/boards/new");
  }
  function handleLogout() {
    fetch("/api/logout", { method: "POST" }).finally(() => router.replace("/auth"));
  }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawerOpen(false);
    if (drawerOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  // ------------ DATA ------------
  const [boards, setBoards] = useState<BoardSnap[]>([]);
  const [subjects, setSubjects] = useState<SubjectSnap[]>([]);
  const [latestCard, setLatestCard] = useState<LatestCard | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  // search / filters
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  type Scope = "all" | "boards" | "subjects" | "tasks" | "cards";
  type Due = "any" | "overdue" | "today" | "week" | "later";
  const [scope, setScope] = useState<Scope>("all");
  const [due, setDue] = useState<Due>("any");
  const [importantOnly, setImportantOnly] = useState(false);
  const [hasNotes, setHasNotes] = useState(false);
  const [hasCards, setHasCards] = useState(false);

  // TS-safe scope flags
  const {
    isAllScope,
    isBoardsScope,
    isSubjectsScope,
    isTasksScope,
    isCardsScope,
  } = useMemo(() => {
    switch (scope) {
      case "boards":
        return { isAllScope: false, isBoardsScope: true, isSubjectsScope: false, isTasksScope: false, isCardsScope: false };
      case "subjects":
        return { isAllScope: false, isBoardsScope: false, isSubjectsScope: true, isTasksScope: false, isCardsScope: false };
      case "tasks":
        return { isAllScope: false, isBoardsScope: false, isSubjectsScope: false, isTasksScope: true, isCardsScope: false };
      case "cards":
        return { isAllScope: false, isBoardsScope: false, isSubjectsScope: false, isTasksScope: false, isCardsScope: true };
      case "all":
      default:
        return { isAllScope: true, isBoardsScope: false, isSubjectsScope: false, isTasksScope: false, isCardsScope: false };
    }
  }, [scope]);

  // search index and upcoming/planner source
  const [index, setIndex] = useState<SearchHit[]>([]);
  const [allUpcoming, setAllUpcoming] = useState<Upcoming[]>([]);
  const [plannerBase, setPlannerBase] = useState<PlannerChip[]>([]);

  // subjects per board
  const subjectsByBoard = useMemo(() => {
    const m: Record<string, SubjectSnap[]> = {};
    for (const s of subjects) {
      if (!m[s.boardKey]) m[s.boardKey] = [];
      m[s.boardKey].push(s);
    }
    Object.values(m).forEach((arr) => arr.sort((a, b) => a.name.localeCompare(b.name)));
    return m;
  }, [subjects]);

  // load + index
  useEffect(() => {
    function loadFromStoreObj(store: Store | null) {
      const snaps: BoardSnap[] = [];
      const subjectSnaps: SubjectSnap[] = [];
      const upcomingTasks: Task[] = [];
      const hits: SearchHit[] = [];

      let latestQ = "";
      let latestA = "";
      let latestTs = -1;

      const boardsMap = store?.boards || {};
      Object.entries(boardsMap).forEach(([key, blob]) => {
        const subjectsArr: SubjectBlob[] = Array.isArray(blob.subjects) ? blob.subjects : [];
        let noteCount = 0;
        let cardCount = 0;

        hits.push({ kind: "board", boardKey: key, title: blob.title || key, text: (blob.title || key) });

        subjectsArr.forEach((s) => {
          const notes: Note[] = Array.isArray(s.notes) ? s.notes : [];
          const cardsArr: any[] = Array.isArray(s.cards) ? s.cards : [];
          const tasksArr: Task[] = Array.isArray(s.tasks) ? s.tasks : [];

          noteCount += notes.length;
          cardCount += cardsArr.length;

          const sName = (s.name || "Untitled Subject").trim();
          subjectSnaps.push({
            boardKey: key,
            subjectId: s.id,
            name: sName,
            noteCount: notes.length,
            cardCount: cardsArr.length,
          });
          hits.push({ kind: "subject", boardKey: key, subjectId: s.id, title: sName, text: sName });

          for (const n of notes) {
            if (!n?.text) continue;
            hits.push({ kind: "note", boardKey: key, subjectId: s.id, title: sName, text: n.text });
          }

          for (const c of cardsArr) {
            if (!isCard(c)) continue;
            const t = parseMs((c as any).createdAt) ?? -1;
            if (t > latestTs) {
              latestQ = c.q || "";
              latestA = c.a || "";
              latestTs = t;
            }
            hits.push({ kind: "card", boardKey: key, subjectId: s.id, title: sName, text: `${c.q || ""} ${c.a || ""}` });
          }

          for (const t of tasksArr) {
            if (t.completedAt) continue;
            const due = parseMs(t.dueAt);
            if (due !== null) upcomingTasks.push(t);
            hits.push({
              kind: "task",
              boardKey: key,
              subjectId: s.id,
              title: t.title || "Untitled",
              text: `${t.title || ""} ${t.description || ""}`,
              dueAt: t.dueAt,
              important: !!t.important,
            });
          }
        });

        snaps.push({ key, title: blob.title || key, subjectCount: subjectsArr.length, noteCount, cardCount });
      });

      snaps.sort((a, b) => a.title.localeCompare(b.title));
      setBoards(snaps);

      subjectSnaps.sort((a, b) => a.name.localeCompare(b.name));
      setSubjects(subjectSnaps);

      setLatestCard(latestTs >= 0 ? { q: latestQ, a: latestA } : null);
      setShowAnswer(false);

      upcomingTasks.sort((a, b) => (parseMs(a.dueAt) ?? Infinity) - (parseMs(b.dueAt) ?? Infinity));
      const ups = upcomingTasks.map((t) => ({
        id: t.id,
        title: t.title || "Untitled",
        meta: fmtDue(t.dueAt),
        dueAt: t.dueAt,
        important: !!t.important,
      }));
      setAllUpcoming(ups);

      const colors = ["#D7E8FB", "#FAD8C9", "#F7E4B0"];
      const plannerItems: PlannerChip[] = [];
      for (let i = 0; i < Math.min(3, upcomingTasks.length); i++) {
        const t = upcomingTasks[i];
        plannerItems.push({ id: t.id, title: t.title || "Untitled", weekday: weekdayFor(t.dueAt), color: colors[i % colors.length] });
      }
      setPlannerBase(plannerItems);

      setIndex(hits);
    }

    function load() {
      try {
        const raw = localStorage.getItem("sb_local_v1");
        if (raw) {
          const parsed = JSON.parse(raw) as Store;
          loadFromStoreObj(parsed);
          return;
        }
        const store: Store = { boards: {} };
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i) || "";
          if (!k.startsWith("board:")) continue;
          const bRaw = localStorage.getItem(k);
          if (!bRaw) continue;
          try {
            const blob = JSON.parse(bRaw) as BoardBlob;
            store.boards[k.replace(/^board:/, "")] = blob;
          } catch {}
        }
        loadFromStoreObj(store);
      } catch {
        setBoards([]);
        setSubjects([]);
        setLatestCard(null);
        setAllUpcoming([]);
        setPlannerBase([]);
        setIndex([]);
      }
    }

    load();
    const onStorage = (ev: StorageEvent) => {
      if (ev.key === "sb_local_v1" || (ev.key && ev.key.startsWith("board:"))) load();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // ----------- filtering & search -----------
  const norm = (s: string) => s.toLowerCase().normalize("NFKD");
  const tokens = useMemo(() => norm(query).split(/\s+/).filter(Boolean), [query]);
  const matchesTokens = (hay: string) => tokens.every((t) => hay.includes(t));

  function matchScope(kind: SearchHitKind): boolean {
    if (isAllScope) return true;
    if (isBoardsScope) return kind === "board";
    if (isSubjectsScope) return kind === "subject";
    if (isTasksScope) return kind === "task";
    if (isCardsScope) return kind === "card";
    return true;
  }
  function matchDue(iso?: string): boolean {
    if (due === "any" || !iso) return due === "any";
    const ms = parseMs(iso);
    if (ms === null) return false;
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfDay = startOfDay + 24 * 3600 * 1000 - 1;
    const endOfWeek = new Date(now);
    endOfWeek.setDate(now.getDate() + (7 - now.getDay()));
    endOfWeek.setHours(23, 59, 59, 999);
    if (due === "overdue") return ms < Date.now();
    if (due === "today") return ms >= startOfDay && ms <= endOfDay;
    if (due === "week") return ms > endOfDay && ms <= endOfWeek.getTime();
    if (due === "later") return ms > endOfWeek.getTime();
    return true;
  }

  // matches (for valgfri ordering), ikke for å skjule når scope = all
  const filteredBoardKeysBySearch = useMemo(() => {
    const matched = new Set<string>();
    for (const h of index) {
      if (!matchScope(h.kind)) continue;
      if (tokens.length) {
        const hay = norm(`${h.title} ${h.text}`);
        if (!matchesTokens(hay)) continue;
      }
      matched.add(h.boardKey);
    }
    return matched;
  }, [index, tokens, scope]);

  const filteredSubjectIdsBySearch = useMemo(() => {
    const matched = new Set<string>();
    for (const h of index) {
      if (!matchScope(h.kind)) continue;
      if (!h.subjectId) continue;
      if (tokens.length) {
        const hay = norm(`${h.title} ${h.text}`);
        if (!matchesTokens(hay)) continue;
      }
      matched.add(`${h.boardKey}::${h.subjectId}`);
    }
    return matched;
  }, [index, tokens, scope]);

  // FILTERS bestemmer synlighet; SØK skjuler kun når scope spesifikt ber om det
  const filteredBoards = useMemo(() => {
    let list = boards.slice();

    // filter chips
    if (hasNotes) list = list.filter((b) => b.noteCount > 0);
    if (hasCards) list = list.filter((b) => b.cardCount > 0);

    // Hvis eksplisitt boards-scope + query, begrens til boards med treff
    if (isBoardsScope && tokens.length) {
      list = list.filter((b) => filteredBoardKeysBySearch.has(b.key));
    }

    // valgfri ordering: treff først ved søk (ellers ren alfabetisk)
    if (tokens.length) {
      const hasMatch = (b: BoardSnap) => filteredBoardKeysBySearch.has(b.key);
      list.sort((a, b) => Number(hasMatch(b)) - Number(hasMatch(a)) || a.title.localeCompare(b.title));
    } else {
      list.sort((a, b) => a.title.localeCompare(b.title));
    }

    return list;
  }, [boards, hasNotes, hasCards, filteredBoardKeysBySearch, isBoardsScope, tokens]);

  const filteredSubjectsByBoard = useMemo(() => {
    const m: Record<string, SubjectSnap[]> = {};
    for (const b of filteredBoards) {
      const subs = (subjectsByBoard[b.key] ?? []).slice();

      let result = subs;

      // filter chips
      if (hasNotes) result = result.filter((s) => s.noteCount > 0);
      if (hasCards) result = result.filter((s) => s.cardCount > 0);

      // Hvis eksplisitt subjects-scope + query, begrens til subjects med treff
      if (isSubjectsScope && tokens.length) {
        result = result.filter((s) => filteredSubjectIdsBySearch.has(`${b.key}::${s.subjectId}`));
      }

      // Ellers sorter treff først når man søker
      if (tokens.length) {
        const key = `${b.key}::`;
        const isHit = (s: SubjectSnap) => filteredSubjectIdsBySearch.has(key + s.subjectId);
        result.sort((a, b) => Number(isHit(b)) - Number(isHit(a)) || a.name.localeCompare(b.name));
      } else {
        result.sort((a, b) => a.name.localeCompare(b.name));
      }

      m[b.key] = result;
    }
    return m;
  }, [filteredBoards, subjectsByBoard, hasNotes, hasCards, filteredSubjectIdsBySearch, tokens, isSubjectsScope]);

  const filteredUpcoming = useMemo(() => {
    let list = allUpcoming.slice();

    // chips
    if (importantOnly) list = list.filter((u) => u.important);
    if (due !== "any") list = list.filter((u) => matchDue(u.dueAt));

    // Hvis eksplisitt tasks-scope + query, begrens til treff
    if (isTasksScope && tokens.length) {
      list = list.filter((u) => matchesTokens(norm(`${u.title} ${u.meta}`)));
    }

    // cap til 3 med mindre man faktisk filtrerer eller er i tasks-scope
    const hasFilter = importantOnly || due !== "any" || isTasksScope;
    return hasFilter ? list : list.slice(0, 3);
  }, [allUpcoming, tokens, importantOnly, due, isTasksScope]);

  const filteredPlanner = useMemo(() => {
    const ids = new Set(filteredUpcoming.map((u) => u.id));
    return plannerBase.filter((p) => ids.has(p.id));
  }, [plannerBase, filteredUpcoming]);

  // VISIBILITY
  const allowBoards = isAllScope || isBoardsScope || isSubjectsScope || isCardsScope;
  const allowTasks = isAllScope || isTasksScope;
  const allowFlash = isAllScope || isCardsScope;

  const showBoardsSection = allowBoards && filteredBoards.length > 0;
  const showTasksSection = allowTasks && filteredUpcoming.length > 0;
  const showPlannerSection = allowTasks && filteredPlanner.length > 0;
  const showFlashcardsSection = allowFlash && !!latestCard;

  // keyboard shortcut to focus search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        const el = document.getElementById("dash-search") as HTMLInputElement | null;
        el?.focus();
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <main style={sx.safe}>
      {/* HEADER */}
      <div style={sx.headerEdge}>
        <div style={sx.headerWrap} className="elev">
          <div style={sx.topRow}>
            <button
              type="button"
              style={sx.iconBtn}
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
            >
              <span style={sx.iconGlyph}>≡</span>
            </button>

            <div style={sx.topActions}>
              <button
                type="button"
                style={sx.iconBtn}
                onClick={() => alert("Notifications (todo)")}
                aria-label="Notifications"
              />
              <button
                type="button"
                style={sx.avatarBtn}
                onClick={() => router.push("/profile")}
                aria-label="Profile"
                title={email}
              >
                <span style={sx.avatarText}>{avatarInitial}</span>
              </button>
            </div>
          </div>

          <div style={sx.searchRow}>
            <div style={sx.searchBox}>
              <span style={sx.searchIcon}>⌕</span>
              <input
                id="dash-search"
                placeholder='Search… '
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={sx.searchInput as React.CSSProperties}
                aria-label="Search"
              />
            </div>

            <div style={{ position: "relative" }}>
              <button
                type="button"
                style={sx.filterPill}
                onClick={() => setFiltersOpen((v) => !v)}
                aria-expanded={filtersOpen}
                aria-haspopup="dialog"
              >
                <span style={sx.filterFunnel}>⎚</span>
                <span style={sx.filterText}>Filters</span>
              </button>

              {/* Popover */}
              <div
                role="dialog"
                aria-label="Filters"
                style={{
                  position: "absolute",
                  right: 0,
                  marginTop: 8,
                  width: 320,
                  padding: 12,
                  borderRadius: 14,
                  border: "1px solid var(--surface2-border)",
                  background: "var(--card)",
                  boxShadow: "0 10px 24px rgba(0,0,0,.14)",
                  display: filtersOpen ? "grid" : "none",
                  gap: 10,
                  zIndex: 50,
                }}
              >
                <div style={{ display: "grid", gap: 8 }}>
                  <label style={sx.fLabel}>Scope</label>
                  <div style={sx.fRow}>
                    {(["all","boards","subjects","tasks","cards"] as Scope[]).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setScope(s)}
                        style={{ ...sx.fChip, ...(scope === s ? sx.fChipOn : null) }}
                      >
                        {s[0].toUpperCase() + s.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: "grid", gap: 8 }}>
                  <label style={sx.fLabel}>Due</label>
                  <div style={sx.fRow}>
                    {(["any","overdue","today","week","later"] as Due[]).map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDue(d)}
                        style={{ ...sx.fChip, ...(due === d ? sx.fChipOn : null) }}
                      >
                        {d === "any" ? "Any" : d === "week" ? "This Week" : d[0].toUpperCase() + d.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={sx.fChecks}>
                  <label style={sx.fCheck}>
                    <input type="checkbox" checked={importantOnly} onChange={(e) => setImportantOnly(e.target.checked)} />
                    Important only
                  </label>
                  <label style={sx.fCheck}>
                    <input type="checkbox" checked={hasNotes} onChange={(e) => setHasNotes(e.target.checked)} />
                    Has notes
                  </label>
                  <label style={sx.fCheck}>
                    <input type="checkbox" checked={hasCards} onChange={(e) => setHasCards(e.target.checked)} />
                    Has flashcards
                  </label>
                </div>

                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    style={sx.fReset}
                    onClick={() => {
                      setScope("all");
                      setDue("any");
                      setImportantOnly(false);
                      setHasNotes(false);
                      setHasCards(false);
                    }}
                  >
                    Reset
                  </button>
                  <button type="button" style={sx.topAddBtn} onClick={() => setFiltersOpen(false)}>
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div style={sx.chipsRow}>
            {[
              { label: "Dashboard", active: true, emoji: "🏠" },
              { label: "Flashcards", active: false, emoji: "🧠" },
              { label: "Planner", active: false, emoji: "🗓" },
            ].map((t) => (
              <div key={t.label} style={{ ...sx.chip, ...(t.active ? sx.chipActive : null) }}>
                <span style={{ ...sx.chipText, ...(t.active ? sx.chipTextActive : null) }}>
                  {t.emoji} {t.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={sx.pagePad}>
        <div style={sx.welcomeWrap}>
          <h1 style={sx.h1}>Welcome back, {displayName}!</h1>
          <p style={sx.subtle}>Signed in as {email}</p>
        </div>

        {/* GRID */}
        <div style={{ ...sx.grid, gridTemplateColumns: twoCols ? "1fr 1fr" : "1fr" }}>
          {/* Left column */}
          <div style={sx.col}>
            {/* My Boards — med SUBJECT-BOKSER under hvert board */}
            {showBoardsSection && (
              <section style={sx.card} className="elev">
                <div style={sx.boardsHeaderRow}>
                  <h2 style={sx.bigTitle}>My Boards</h2>
                  <button type="button" style={sx.topAddBtn} onClick={handleNewBoard} disabled={creating}>
                    + New Board
                  </button>
                </div>

                <div style={sx.boardsGrid}>
                  {filteredBoards.length === 0 ? (
                    <div style={sx.empty}>Ingen emner funnet</div>
                  ) : (
                    filteredBoards.map((b) => {
                      const subs = filteredSubjectsByBoard[b.key] ?? [];
                      return (
                        <div key={b.key} style={sx.boardTile}>
                          {/* Board heading */}
                          <div
                            style={sx.boardTileHeader}
                            onClick={() => router.push(`/boards/${encodeURIComponent(b.key)}`)}
                            role="button"
                            title={b.title}
                          >
                            <div style={sx.tileTitle}>{b.title}</div>
                           
                          </div>

                          {/* SUBJECT CARDS */}
                          {!isBoardsScope && (
                            <div style={sx.subjectGrid}>
                              {subs.length === 0 ? (
                                <span style={sx.emptySmall}>No subjects match</span>
                              ) : (
                                subs.map((s, i) => {
                                  const { bg, border } = subjectColors(i);
                                  return (
                                    <button
                                      key={s.subjectId}
                                      type="button"
                                      onClick={() =>
                                        router.push(
                                          `/boards/${encodeURIComponent(b.key)}/subjects/${encodeURIComponent(s.subjectId)}`
                                        )
                                      }
                                      style={{
                                        ...sx.subjectCard,
                                        background: bg,
                                        border: `1px solid ${border}`,
                                      }}
                                      title={`${s.name} • ${s.noteCount} Notes • ${s.cardCount} Flashcards`}
                                    >
                                      <div style={sx.subjectName}>{s.name}</div>
                                      <div style={sx.subjectMeta}>
                                        {s.noteCount} {s.noteCount === 1 ? "Note" : "Notes"}
                                      </div>
                                      <div style={sx.subjectMeta}>
                                        {s.cardCount} {s.cardCount === 1 ? "Flashcard" : "Flashcards"}
                                      </div>
                                    </button>
                                  );
                                })
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                <button type="button" style={sx.pillLarge} onClick={handleNewBoard} disabled={creating}>
                  + New Board
                </button>
              </section>
            )}

            {/* Flashcards preview */}
            {showFlashcardsSection && (
              <FlashcardsPreview card={latestCard} showAnswer={showAnswer} onToggle={() => setShowAnswer((v) => !v)} />
            )}
          </div>

          {/* Right column */}
          <div style={sx.col}>
            {/* Upcoming Tasks */}
            {showTasksSection && (
              <section style={sx.card} className="elev">
                <h2 style={sx.cardTitle}>Kommende Oppgaver</h2>
                {filteredUpcoming.length === 0 ? (
                  <div style={sx.empty}>Ingen oppgaver foreløpig</div>
                ) : (
                  filteredUpcoming.map((item) => (
                    <div key={item.id} style={sx.task} title={item.title}>
                      <div style={{ ...sx.bullet, ...(item.important ? { opacity: 1 } : { opacity: 0.4 }) }} />
                      <div style={sx.taskTextWrap}>
                        <div style={sx.taskTitle}>{item.title}</div>
                        <div style={sx.taskMeta}>{item.meta}</div>
                      </div>
                    </div>
                  ))
                )}
              </section>
            )}

            {/* Study Planner */}
            {showPlannerSection && (
              <section style={sx.card} className="elev">
                <h2 style={sx.cardTitle}>Study Planner</h2>
                <div style={sx.weekRow}>
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                    <span key={d} style={sx.weekDay}>
                      {d}
                    </span>
                  ))}
                </div>
                {filteredPlanner.length === 0 ? (
                  <div style={{ ...sx.empty, marginTop: 8 }}>Ingen ting planlagt</div>
                ) : (
                  <div style={sx.plannerBoard}>
                    {filteredPlanner.map((p) => (
                      <div key={p.id} style={sx.planChipWrap}>
                        <div style={{ ...sx.planChip, background: "#D7E8FB" }}>
                          <span style={sx.planChipText}>{p.title}</span>
                        </div>
                        <span style={sx.planMeta}>{p.weekday}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
        </div>
      </div>

      {/* Drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        email={email}
        name={displayName}
        avatarInitial={avatarInitial}
        onDashboard={() => {
          setDrawerOpen(false);
          router.push("/dashboard");
        }}
        onProfile={() => {
          setDrawerOpen(false);
          router.push("/profile");
        }}
        onSettings={() => {
          setDrawerOpen(false);
          router.push("/settings");
        }}
        onAbout={() => {
          setDrawerOpen(false);
          router.push("/about");
        }}
        onFAQ={() => {
          setDrawerOpen(false);
          router.push("/faq");
        }}
        onEvents={() => {
          setDrawerOpen(false);
          router.push("/events");
        }}
        onCareer={() => {
          setDrawerOpen(false);
          router.push("/career-days");
        }}
        onResources={() => {
          setDrawerOpen(false);
          router.push("/resources");
        }}
        onLogout={() => {
          setDrawerOpen(false);
          handleLogout();
        }}
        onResetPassword={() => {
          setDrawerOpen(false);
          router.push("/auth/forgot");
        }}
      />
    </main>
  );
}
/* ------------- Drawer (lux, student vibe) ------------- */
function Drawer({
  open,
  onClose,
  email,
  name,
  avatarInitial,
  onDashboard,
  onProfile,
  onSettings,
  onAbout,
  onFAQ,
  onEvents,
  onCareer,
  onResources,
  onLogout,
  onResetPassword,
}: {
  open: boolean;
  onClose: () => void;
  email: string;
  name: string;
  avatarInitial: string;
  onDashboard: () => void;
  onProfile: () => void;
  onSettings: () => void;
  onAbout: () => void;
  onFAQ: () => void;
  onEvents: () => void;
  onCareer: () => void;
  onResources: () => void;
  onLogout: () => void | Promise<void>;
  onResetPassword: () => void;
}) {
  const [signingOut, setSigningOut] = React.useState(false);

  return (
    <>
      {/* Dim/overlay med subtil vignette */}
      <div
        onClick={onClose}
        aria-hidden={!open}
        style={{
          position: "fixed",
          inset: 0,
          background:
            "radial-gradient(1200px 800px at 20% 10%, rgba(0,0,0,.55), rgba(0,0,0,.35) 40%, rgba(0,0,0,.28))",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 180ms ease",
          zIndex: 80,
        }}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Meny"
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        style={{
          position: "fixed",
          top: 0,
          bottom: 0,
          left: 0,
          width: 340,
          transform: open ? "translateX(0)" : "translateX(-104%)",
          transition: "transform 220ms cubic-bezier(.2,.8,.2,1)",
          zIndex: 81,
          display: "grid",
          gridTemplateRows: "auto 1fr auto",
          borderRight: "1px solid var(--border)",
          borderTopRightRadius: 22,
          borderBottomRightRadius: 22,
          overflow: "hidden",

          /* Glass + tema */
          background:
            "linear-gradient(180deg, rgba(255,255,255,.78), rgba(255,255,255,.55))",
          backdropFilter: "blur(16px)",
          color: "var(--text)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: 18,
            borderBottom: "1px solid var(--border)",
            background:
              "linear-gradient(180deg, rgba(255,255,255,.65), rgba(255,255,255,.4))",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                display: "grid",
                placeItems: "center",
                fontWeight: 900,
                fontSize: 18,
                color: "var(--text)",
                background:
                  "linear-gradient(145deg, var(--surface2) 0%, rgba(255,255,255,.10) 100%)",
                border: "1px solid var(--surface2-border)",
                boxShadow:
                  "0 10px 24px rgba(0,0,0,.10), inset 0 1px 0 rgba(255,255,255,.6)",
              }}
            >
              {avatarInitial}
            </div>
            <div style={{ display: "grid", lineHeight: 1.15 }}>
              <div style={{ fontWeight: 900, fontSize: 20 }}>{name}</div>
              <div style={{ color: "var(--muted)", fontSize: 12 }}>{email}</div>
            </div>
          </div>

          {/* Små “studie-chips” */}
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <Chip emoji="📚" text="Study" />
            <Chip emoji="🧠" text="Focus" />
            <Chip emoji="🗓️" text="Planner" />
          </div>
        </div>

        {/* Links */}
        <nav style={{ padding: 12, display: "grid", gap: 10, overflow: "auto" }}>
          <SectionLabel text="Workspace" />
          <DrawerItem icon="🏠" label="Dashboard" onClick={onDashboard} />
          <DrawerItem icon="👤" label="Profile" onClick={onProfile} />
          <DrawerItem icon="⚙️" label="Settings" onClick={onSettings} />

          <SectionLabel text="Support" />
          <DrawerItem icon="ℹ️" label="About" onClick={onAbout} />
          <DrawerItem icon="❓" label="FAQ" onClick={onFAQ} />
          <DrawerItem icon="🎉" label="Events" onClick={onEvents} />
          <DrawerItem icon="🎓" label="Career Days" onClick={onCareer} />
          <DrawerItem icon="🔗" label="Useful Links" onClick={onResources} />

          <SectionLabel text="Security" />
          <DrawerItem icon="🔑" label="Reset password" onClick={onResetPassword} />
        </nav>

        {/* Footer */}
        <div
          style={{
            padding: 14,
            borderTop: "1px solid var(--border)",
            display: "grid",
            gap: 8,
            background:
              "linear-gradient(180deg, rgba(255,255,255,.42), rgba(255,255,255,.28))",
          }}
        >
          <button
            type="button"
            disabled={signingOut}
            onClick={async () => {
              try {
                setSigningOut(true);
                await Promise.resolve(onLogout());
              } finally {
                setSigningOut(false);
              }
            }}
            style={{
              padding: "12px 14px",
              borderRadius: 14,
              border: "none",
              color: "#fff",
              fontWeight: 900,
              letterSpacing: .2,
              background:
                "linear-gradient(135deg, #0F172A 0%, color-mix(in srgb, var(--accent) 80%, #0F172A 20%) 100%)",
              boxShadow:
                "0 12px 28px rgba(0,0,0,.22), inset 0 1px 0 rgba(255,255,255,.10)",
              opacity: signingOut ? 0.75 : 1,
              cursor: signingOut ? "wait" : "pointer",
            }}
          >
            {signingOut ? "Logger ut…" : "Logg ut"}
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid var(--border)",
              color: "var(--text)",
              background: "var(--card)",
              fontWeight: 800,
            }}
          >
            Lukk
          </button>
        </div>
      </aside>
    </>
  );
}

/* Små byggeklosser */
function SectionLabel({ text }: { text: string }) {
  return (
    <div
      style={{
        userSelect: "none",
        fontSize: 11,
        letterSpacing: 0.7,
        textTransform: "uppercase",
        color: "var(--muted)",
        padding: "2px 10px",
      }}
    >
      {text}
    </div>
  );
}

function Chip({ emoji, text }: { emoji: string; text: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 10px",
        borderRadius: 999,
        fontWeight: 800,
        fontSize: 12,
        color: "var(--text)",
        background:
          "linear-gradient(180deg, rgba(255,255,255,.70), rgba(255,255,255,.40))",
        border: "1px solid var(--border)",
        boxShadow: "0 2px 8px rgba(0,0,0,.06)",
      }}
    >
      <span aria-hidden>{emoji}</span>
      {text}
    </span>
  );
}

/* DrawerItem med ikon-pill, glass og chevron */
function DrawerItem({
  icon,
  label,
  onClick,
}: {
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "grid",
        gridTemplateColumns: "auto 1fr auto",
        alignItems: "center",
        gap: 12,
        padding: "12px 14px",
        borderRadius: 18,
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: "var(--border)",
        background:
          "linear-gradient(180deg, var(--card), color-mix(in srgb, var(--card) 86%, #000 14%))",
        color: "var(--text)",
        fontWeight: 900,
        textAlign: "left",
        cursor: "pointer",
        transition:
          "transform .08s ease, box-shadow .16s ease, background .16s ease, border-color .16s ease",
        boxShadow:
          "0 6px 16px rgba(0,0,0,.08), inset 0 1px 0 rgba(255,255,255,.65)",
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(.99)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      <span
        aria-hidden
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          display: "grid",
          placeItems: "center",
          fontSize: 16,
          background:
            "linear-gradient(145deg, var(--surface2) 0%, rgba(255,255,255,.10) 100%)",
          border: "1px solid var(--surface2-border)",
          boxShadow:
            "0 4px 10px rgba(0,0,0,.10), inset 0 1px 0 rgba(255,255,255,.5)",
        }}
      >
        {icon}
      </span>
      <span>{label}</span>
      <span aria-hidden style={{ opacity: 0.35, fontSize: 16 }}>
        ›
      </span>
    </button>
  );
}

/* ---------------- styles ---------------- */
const sx: Record<string, React.CSSProperties> = {
  safe: { minHeight: "100vh", background: "var(--bg)", padding: 16, color: "var(--text)" },
  pagePad: { display: "grid", gap: 16 },
  headerEdge: { marginLeft: -16, marginRight: -16 },
  headerWrap: {
    background: "var(--surface1)",
    padding: "8px 16px 16px",
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    borderBottom: "1px solid var(--border)",
  },
  topRow: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  topActions: { display: "flex", alignItems: "center", gap: 8 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    display: "grid",
    placeItems: "center",
    background: "var(--surface2)",
    border: "1px solid var(--surface2-border)",
    color: "var(--text)",
    cursor: "pointer",
  },
  avatarBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    background: "var(--surface2)",
    border: "1px solid var(--surface2-border)",
    display: "grid",
    placeItems: "center",
    color: "var(--text)",
    cursor: "pointer",
  },
  avatarText: { fontWeight: 700 as any },

  iconGlyph: { fontSize: 16, fontWeight: 700 as any },
  searchRow: { display: "flex", alignItems: "center", gap: 12, marginTop: 12 },
  searchBox: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "12px 12px",
    borderRadius: 14,
    background: "var(--surface2)",
    border: "1px solid var(--surface2-border)",
  },
  searchIcon: { color: "var(--muted)", fontSize: 30 },
  searchInput: {
    flex: 1,
    width: "100%",
    border: "none",
    outline: "none",
    background: "transparent",
    color: "var(--text)",
    fontWeight: 600 as any,
  },
  filterPill: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "12px 14px",
    borderRadius: 16,
    background: "var(--surface2)",
    border: "1px solid var(--surface2-border)",
    color: "var(--text)",
    cursor: "pointer",
  },
  filterFunnel: { fontSize: 12 },
  filterText: { fontWeight: 700 as any },
  chipsRow: { display: "flex", gap: 12, marginTop: 8, overflowX: "auto", paddingBottom: 2 },
  chip: {
    padding: "10px 14px",
    borderRadius: 999,
    background: "var(--chip)",
    border: "1px solid var(--chip-border)",
    whiteSpace: "nowrap",
    color: "var(--text)",
  },
  chipActive: { background: "var(--card)" },
  chipText: { fontWeight: 700 as any },
  chipTextActive: {},

  welcomeWrap: { display: "grid", gap: 6, padding: "0 4px" },
  h1: { fontSize: 24, fontWeight: 800 as any, margin: 0, color: "var(--text)" },
  subtle: { color: "var(--muted)", fontSize: 14, margin: 0 },

  grid: { display: "grid", gap: 16, gridTemplateColumns: "1fr" },
  col: { display: "grid", gap: 16 },

  card: { background: "var(--card)", borderRadius: 16, padding: 16, display: "grid", gap: 12, border: "1px solid var(--border)" },
  empty: { color: "var(--muted)", fontStyle: "italic" },
  emptySmall: { color: "var(--muted)", fontSize: 12 },

  boardsHeaderRow: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, color: "var(--text)" },
  bigTitle: { margin: 0, fontSize: 32, fontWeight: 900, color: "var(--text)" },
  topAddBtn: {
    padding: "8px 12px",
    borderRadius: 12,
    background: "var(--card)",
    border: "1px solid var(--border)",
    fontWeight: 900,
    color: "var(--text)",
    cursor: "pointer",
  },
  boardsGrid: { display: "grid", gap: 16, gridTemplateColumns: "1fr" },
  boardTile: {
    borderRadius: 18,
    padding: 14,
    background: "var(--bg)",
    border: "1px solid var(--border)",
    display: "grid",
    gap: 12,
  },
  boardTileHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", color: "var(--text)" },
  tileTitle: { fontSize: 22, fontWeight: 900 },

  subjectGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 },
  subjectCard: {
    textAlign: "left" as const,
    borderRadius: 20,
    padding: "18px 20px",
    cursor: "pointer",
    transition: "transform .08s ease, box-shadow .12s ease",
    boxShadow: "0 4px 10px rgba(0,0,0,0.06)",
    background: "var(--card)", /* overskrives per element */
    border: "1px solid var(--border)", /* overskrives per element */
    color: "var(--text)",
  },
  subjectName: { fontSize: 20, fontWeight: 900, marginBottom: 6, color: "var(--text)" },
  subjectMeta: { fontSize: 14, fontWeight: 700 as any, color: "var(--text)" },

  pillLarge: {
    marginTop: 10,
    padding: "12px 14px",
    borderRadius: 14,
    background: "var(--card)",
    border: "1px solid var(--border)",
    fontWeight: 900,
    color: "var(--text)",
    cursor: "pointer",
    alignSelf: "flex-start",
  },

  cardTitle: { fontSize: 16, fontWeight: 700 as any, margin: 0, color: "var(--text)" },
  task: { display: "flex", alignItems: "center", gap: 10 },
  bullet: { width: 8, height: 8, borderRadius: 4, background: "var(--dot)" },
  taskTextWrap: { flexShrink: 1 as any },
  taskTitle: { fontSize: 14, fontWeight: 600 as any, color: "var(--text)" },
  taskMeta: { fontSize: 12, color: "var(--muted)" },

  flashInner: { background: "var(--bg)", borderRadius: 16, padding: 16, display: "grid", gap: 12, border: "1px solid var(--border)" },
  flashQuestion: { fontSize: 16, fontWeight: 700 as any, color: "var(--text)" },
  flashBtn: { alignSelf: "flex-start", padding: "10px 14px", borderRadius: 12, background: "var(--accent)", border: "none", cursor: "pointer" },
  flashBtnText: { color: "#fff", fontWeight: 700 as any },

  weekRow: { display: "flex", gap: 12, borderBottom: "1px solid var(--border)", paddingBottom: 8 },
  weekDay: { color: "var(--muted)", fontSize: 12, fontWeight: 700 as any },
  plannerBoard: { display: "grid", gap: 12, paddingTop: 8 },
  planChipWrap: { display: "grid", gap: 4 },
  planChip: { alignSelf: "flex-start", padding: "10px 12px", borderRadius: 12 },
  planChipText: { fontWeight: 700 as any, color: "var(--text)" },
  planMeta: { fontSize: 12, color: "var(--muted)" },

  /* Filters UI */
  fLabel: { fontSize: 12, fontWeight: 800 as any, color: "var(--muted)" },
  fRow: { display: "flex", gap: 8, flexWrap: "wrap" as const },
  fChip: {
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid var(--surface2-border)",
    background: "var(--surface2)",
    fontWeight: 800,
    fontSize: 12,
    cursor: "pointer",
  },
  fChipOn: {
    background: "var(--card)",
    border: "1px solid var(--border)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,.4)",
  },
  fChecks: { display: "grid", gap: 6, marginTop: 2 },
  fCheck: { display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700 as any },
  fReset: {
    padding: "8px 10px",
    borderRadius: 10,
    background: "var(--surface2)",
    border: "1px solid var(--surface2-border)",
    fontWeight: 800,
    cursor: "pointer",
  },

  resultMeta: { color: "var(--muted)", fontSize: 12, margin: "4px 2px" },
};
