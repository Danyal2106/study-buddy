// src/lib/localdb.ts
// Enkel lokal "DB" med localStorage. KUN i klientkomponenter.

export type Note = { id: string; text: string; createdAt: string };
export type Card = { id: string; q: string; a: string; createdAt: string };
export type Task = {
  id: string;
  title: string;
  description?: string;
  dueAt?: string;       // ISO eller ""
  createdAt: string;    // ISO
  completedAt?: string; // ISO
  important?: boolean;
};

export type Subject = {
  id: string;
  name: string;
  createdAt: string;
  notes: Note[];
  cards: Card[];
  tasks?: Task[];       // optional for bakoverkomp
};

export type Board = {
  key: string;
  title: string;
  createdAt: string;
  subjects: Subject[];
};

type Store = { boards: Record<string, Board> };

const KEY = "sb_local_v1";

/* ---------------- utils ---------------- */
function nowISO() {
  return new Date().toISOString();
}
function rid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/* ---------------- I/O ---------------- */
function safeRead(): Store {
  if (typeof window === "undefined") return { boards: {} };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { boards: {} };
    const parsed = JSON.parse(raw);
    const boards = (parsed && typeof parsed === "object" && parsed.boards) || {};
    // Normaliser alt ved lesing
    const fixed: Record<string, Board> = {};
    for (const [k, b] of Object.entries<Board>(boards as any)) {
      fixed[k] = normalizeBoard(b);
    }
    return { boards: fixed };
  } catch {
    return { boards: {} };
  }
}

function notifyWrite() {
  try {
    // Trigge lyttere i andre faner
    window.dispatchEvent(new StorageEvent("storage", { key: KEY, newValue: "updated" }));
  } catch {}
}

/** Speil hvert board til `board:{key}` for kompatibilitet med dashboard som scanner disse. */
function mirrorBoardsToLegacy(store: Store) {
  if (typeof window === "undefined") return;
  try {
    // Slett gamle speil først (unngå foreldreløse)
    const toRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i) || "";
      if (k.startsWith("board:")) toRemove.push(k);
    }
    for (const k of toRemove) window.localStorage.removeItem(k);

    // Skriv nye speil
    for (const b of Object.values(store.boards)) {
      const legacy = {
        key: b.key,
        title: b.title,
        subjects: b.subjects.map(normalizeSubject),
      };
      window.localStorage.setItem(`board:${b.key}`, JSON.stringify(legacy));
    }
  } catch {}
}

function write(store: Store) {
  if (typeof window === "undefined") return;
  // Først normaliser (sikkerhet)
  const normalized: Store = { boards: {} };
  for (const [k, b] of Object.entries(store.boards)) {
    normalized.boards[k] = normalizeBoard(b);
  }
  window.localStorage.setItem(KEY, JSON.stringify(normalized));
  // Speil for dashboard-kompat
  mirrorBoardsToLegacy(normalized);
  notifyWrite();
}

/* ---------------- normalisering ---------------- */
function normalizeSubject(s: Subject): Subject {
  const notes = Array.isArray(s.notes) ? s.notes : [];
  const cards = Array.isArray(s.cards) ? s.cards : [];
  const tasks = Array.isArray(s.tasks) ? s.tasks : [];
  return {
    id: s.id,
    name: s.name ?? "Untitled Subject",
    createdAt: s.createdAt ?? nowISO(),
    notes,
    cards,
    tasks,
  };
}

function normalizeBoard(b: Board): Board {
  const subjects = Array.isArray(b.subjects) ? b.subjects.map(normalizeSubject) : [];
  return {
    key: b.key,
    title: b.title ?? b.key ?? "Untitled Board",
    createdAt: b.createdAt ?? nowISO(),
    subjects,
  };
}

/* ---------------- intern helpers ---------------- */
function getOrCreateBoard(store: Store, boardKey: string, title?: string): Board {
  let b = store.boards[boardKey];
  if (!b) {
    b = {
      key: boardKey,
      title: title?.trim() || "Untitled Board",
      createdAt: nowISO(),
      subjects: [],
    };
    store.boards[boardKey] = b;
  }
  return store.boards[boardKey]!;
}

function findSubject(store: Store, boardKey: string, subjectId: string): Subject | null {
  const b = store.boards[boardKey];
  if (!b) return null;
  const s = b.subjects.find((x) => x.id === subjectId) || null;
  return s ? normalizeSubject(s) : null;
}

/* ---------------- Boards API ---------------- */
export function ensureBoard(boardKey: string, title?: string): Board {
  const store = safeRead();
  const b = getOrCreateBoard(store, boardKey, title);
  write(store);
  return b;
}

export function getBoard(boardKey: string): Board | null {
  const store = safeRead();
  const b = store.boards[boardKey] ?? null;
  return b ? normalizeBoard(b) : null;
}

export function setBoardTitle(boardKey: string, title: string) {
  const store = safeRead();
  const b = store.boards[boardKey];
  if (!b) return;
  b.title = title?.trim() || b.title;
  write(store);
}

/** Liste av fag for et board (garantert normalisert). */
export function listSubjects(boardKey: string): Subject[] {
  const b = getBoard(boardKey) ?? ensureBoard(boardKey);
  return Array.isArray(b.subjects) ? b.subjects.map(normalizeSubject) : [];
}

export function addSubject(boardKey: string, name: string) {
  const store = safeRead();
  const b = getOrCreateBoard(store, boardKey);
  const subject: Subject = {
    id: rid(),
    name: name?.trim() || "Untitled Subject",
    createdAt: nowISO(),
    notes: [],
    cards: [],
    tasks: [],
  };
  b.subjects.unshift(subject);
  write(store);
  return subject;
}

export function removeSubject(boardKey: string, subjectId: string) {
  const store = safeRead();
  const b = store.boards[boardKey];
  if (!b) return;
  const before = b.subjects.length;
  b.subjects = b.subjects.filter((s) => s.id !== subjectId);
  if (b.subjects.length !== before) {
    write(store);
  }
}

/* ---------------- Notes & Cards ---------------- */
export function addNote(boardKey: string, subjectId: string, text: string) {
  const store = safeRead();
  const b = getOrCreateBoard(store, boardKey);
  const sIdx = b.subjects.findIndex((x) => x.id === subjectId);
  if (sIdx === -1) throw new Error("Subject not found");
  const s = normalizeSubject(b.subjects[sIdx]);
  const note: Note = { id: rid(), text: text ?? "", createdAt: nowISO() };
  s.notes.unshift(note);
  b.subjects[sIdx] = s;
  write(store);
  return note;
}

export function addCard(boardKey: string, subjectId: string, q: string, a: string) {
  const store = safeRead();
  const b = getOrCreateBoard(store, boardKey);
  const sIdx = b.subjects.findIndex((x) => x.id === subjectId);
  if (sIdx === -1) throw new Error("Subject not found");
  const s = normalizeSubject(b.subjects[sIdx]);
  const card: Card = { id: rid(), q: q ?? "", a: a ?? "", createdAt: nowISO() };
  s.cards.unshift(card);
  b.subjects[sIdx] = s;
  write(store);
  return card;
}

/* ---------------- Tasks ---------------- */
export function listTasks(boardKey: string, subjectId: string): Task[] {
  const store = safeRead();
  const s = findSubject(store, boardKey, subjectId);
  return s ? [...(s.tasks || [])] : [];
}

export function addTask(
  boardKey: string,
  subjectId: string,
  payload: { title: string; description?: string; dueAt?: string; important?: boolean }
): Task {
  const store = safeRead();
  const b = getOrCreateBoard(store, boardKey);
  const sIdx = b.subjects.findIndex((x) => x.id === subjectId);
  if (sIdx === -1) throw new Error("Subject not found");

  const s = normalizeSubject(b.subjects[sIdx]);
  const t: Task = {
    id: rid(),
    title: payload.title?.trim() || "Untitled",
    description: payload.description?.trim() || "",
    dueAt: payload.dueAt || "",
    createdAt: nowISO(),
    important: !!payload.important,
  };
  s.tasks!.unshift(t);
  b.subjects[sIdx] = s;
  write(store);
  return t;
}

export function updateTask(
  boardKey: string,
  subjectId: string,
  taskId: string,
  patch: Partial<Task>
): Task | null {
  const store = safeRead();
  const b = getOrCreateBoard(store, boardKey);
  const sIdx = b.subjects.findIndex((x) => x.id === subjectId);
  if (sIdx === -1) return null;

  const s = normalizeSubject(b.subjects[sIdx]);
  const t = (s.tasks || []).find((x) => x.id === taskId) || null;
  if (!t) return null;
  Object.assign(t, patch);
  b.subjects[sIdx] = s;
  write(store);
  return t;
}

export function toggleTaskCompleted(boardKey: string, subjectId: string, taskId: string): Task | null {
  const store = safeRead();
  const b = getOrCreateBoard(store, boardKey);
  const sIdx = b.subjects.findIndex((x) => x.id === subjectId);
  if (sIdx === -1) return null;

  const s = normalizeSubject(b.subjects[sIdx]);
  const t = (s.tasks || []).find((x) => x.id === taskId) || null;
  if (!t) return null;
  t.completedAt = t.completedAt ? undefined : nowISO();
  b.subjects[sIdx] = s;
  write(store);
  return t;
}

export function toggleTaskImportant(boardKey: string, subjectId: string, taskId: string): Task | null {
  const store = safeRead();
  const b = getOrCreateBoard(store, boardKey);
  const sIdx = b.subjects.findIndex((x) => x.id === subjectId);
  if (sIdx === -1) return null;

  const s = normalizeSubject(b.subjects[sIdx]);
  const t = (s.tasks || []).find((x) => x.id === taskId) || null;
  if (!t) return null;
  t.important = !t.important;
  b.subjects[sIdx] = s;
  write(store);
  return t;
}

export function deleteTask(boardKey: string, subjectId: string, taskId: string): boolean {
  const store = safeRead();
  const b = getOrCreateBoard(store, boardKey);
  const sIdx = b.subjects.findIndex((x) => x.id === subjectId);
  if (sIdx === -1) return false;

  const s = normalizeSubject(b.subjects[sIdx]);
  const before = s.tasks!.length;
  s.tasks = (s.tasks || []).filter((x) => x.id !== taskId);
  b.subjects[sIdx] = s;
  if (s.tasks.length !== before) {
    write(store);
    return true;
  }
  return false;
}

/* ---------------- ekstra helpers (valgfritt) ---------------- */
/** Returnerer alle boards som liste (nyttig for dashboards som vil bruke dette direkte). */
export function listBoards(): Board[] {
  const store = safeRead();
  return Object.values(store.boards).map(normalizeBoard);
}
