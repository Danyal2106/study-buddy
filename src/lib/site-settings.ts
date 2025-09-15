// src/lib/site-settings.ts
export const STORAGE_KEY = "app.settings.v1";

/* ---------------- Types ---------------- */
export type SessionInfo = {
  device: string;
  browser: string;
  location: string;
  lastActive: string; // ISO
};

export type Settings = {
  // Generelt
  theme: "light" | "dark";
  language: "nb" | "nn" | "en";
  timezone: string;

  // Varsler
  notifications: {
    enabled: boolean;
    email: boolean;
    push: boolean;
    sms: boolean;
    newsletter: boolean;
    productUpdates: boolean;
  };

  // Personvern
  privacy: {
    showProfilePublic: boolean;
    searchableByEmail: boolean;
    analytics: boolean;
    personalizedAds: boolean;
  };

  // Sikkerhet
  security: {
    twoFactor: boolean;
    loginAlerts: boolean;
    sessions: SessionInfo[];
  };

  // Tilgjengelighet
  accessibility: {
    reduceMotion: boolean;
    highContrast: boolean;
    textSize: "small" | "medium" | "large";
  };
};

/* ---------------- Defaults ---------------- */
export const DEFAULTS: Settings = {
  theme: "light",
  language: "nb",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Oslo",
  notifications: {
    enabled: true,
    email: true,
    push: false,
    sms: false,
    newsletter: false,
    productUpdates: true,
  },
  privacy: {
    showProfilePublic: true,
    searchableByEmail: false,
    analytics: true,
    personalizedAds: false,
  },
  security: {
    twoFactor: false,
    loginAlerts: true,
    sessions: [],
  },
  accessibility: {
    reduceMotion: false,
    highContrast: false,
    textSize: "medium",
  },
};

/* ---------------- Storage ---------------- */
export function loadSettings(): Settings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    return normalizeSettings(parsed);
  } catch {
    return DEFAULTS;
  }
}

export function saveSettings(s: Settings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

/* ---------------- Theme vars ---------------- */
type ThemeVars = {
  tokens: Record<string, string>;
  subjects: Record<string, string>;
};

/** Hent alle CSS-variabler for valgt tema. */
export function getThemeVars(theme: "light" | "dark"): ThemeVars {
  if (theme === "dark") {
    return {
      tokens: {
        // base
        bg: "#0B1220",
        card: "#0F172A",
        text: "#E5E7EB",
        muted: "#9CA3AF",
        border: "#1F2937",
        // surfaces / UI
        surface1: "#121B2E",
        surface2: "#0E1628",
        "surface2-border": "#1F2A40",
        chip: "#0E1626",
        "chip-border": "#1F2A3A",
        dot: "#6B7280",
        accent: "#3B82F6",
      },
      subjects: {
        // tilpassede “pasteller” for dark
        "subj1-bg": "#0F1D34",
        "subj1-border": "#1E2F4A",
        "subj2-bg": "#2A1C1A",
        "subj2-border": "#4A2B26",
        "subj3-bg": "#2F2A14",
        "subj3-border": "#4B431C",
        "subj4-bg": "#2E1E17",
        "subj4-border": "#4B2C22",
      },
    };
  }

  // LIGHT – matcher eksisterende design 1:1
  return {
    tokens: {
      bg: "#F8F5EF",
      card: "#FFFFFF",
      text: "#111827",
      muted: "#6B7280",
      border: "#E5E7EB",
      surface1: "#E6DFD3",
      surface2: "#E0D8C9",
      "surface2-border": "#D6CEBE",
      chip: "#DED6C7",
      "chip-border": "#D2C9B8",
      dot: "#A4B3C7",
      accent: "#111827",
    },
    subjects: {
      "subj1-bg": "#DDEAFE",
      "subj1-border": "#BFD4FA",
      "subj2-bg": "#FDE7DF",
      "subj2-border": "#F7CDBC",
      "subj3-bg": "#FBE7A1",
      "subj3-border": "#F6D985",
      "subj4-bg": "#FDE0CC",
      "subj4-border": "#F8CDAF",
    },
  };
}

/* ---------------- Apply to <html> ---------------- */
/**
 * Påfør settings til hele dokumentet (tema, kontrast, motion, tekststørrelse, språk).
 * Kall denne ved oppstart og hver gang bruker lagrer.
 */
export function applySettingsToDocument(s: Settings) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  // data-attributter (enkle å style i CSS)
  root.setAttribute("data-theme", s.theme);
  root.setAttribute("data-contrast", s.accessibility.highContrast ? "high" : "normal");
  root.setAttribute("data-motion", s.accessibility.reduceMotion ? "reduced" : "normal");
  root.setAttribute("data-text", s.accessibility.textSize);

  // Språk (skjermleser)
  const lang = s.language === "nb" ? "nb" : s.language === "nn" ? "nn" : "en";
  root.setAttribute("lang", lang);

  // CSS-variabler – **alt** appen bruker
  const vars = getThemeVars(s.theme);

  for (const [k, v] of Object.entries(vars.tokens)) {
    root.style.setProperty(`--${k}`, v);
  }
  for (const [k, v] of Object.entries(vars.subjects)) {
    root.style.setProperty(`--${k}`, v);
  }

  // Skalerbar typografi / motion (hvis du vil bruke i CSS)
  root.style.setProperty("--text-size-scale", textSizeScale(s.accessibility.textSize));
  root.style.setProperty("--motion-scale", s.accessibility.reduceMotion ? "0" : "1");

  // Fallback: sett faktisk root-fontsize så inline-styles med px/rem oppfører seg
  const htmlFont = s.accessibility.textSize === "small" ? "15px"
                   : s.accessibility.textSize === "large" ? "18px"
                   : "16px";
  root.style.fontSize = htmlFont;

  // Ekstra safeguard for redusert bevegelse
  (root.style as any).scrollBehavior = s.accessibility.reduceMotion ? "auto" : "";
}

/* ---------------- Internals ---------------- */
function normalizeSettings(input: any): Settings {
  const base = { ...DEFAULTS, ...(input || {}) };

  // dyp merge for fremtidig kompatibilitet
  base.notifications = { ...DEFAULTS.notifications, ...(input?.notifications || {}) };
  base.privacy       = { ...DEFAULTS.privacy,       ...(input?.privacy || {}) };
  base.security      = { ...DEFAULTS.security,      ...(input?.security || {}) };
  base.accessibility = { ...DEFAULTS.accessibility, ...(input?.accessibility || {}) };

  // vakthunder
  if (!["light", "dark"].includes(base.theme)) base.theme = DEFAULTS.theme;
  if (!["nb", "nn", "en"].includes(base.language)) base.language = DEFAULTS.language;
  if (!["small", "medium", "large"].includes(base.accessibility.textSize)) {
    base.accessibility.textSize = DEFAULTS.accessibility.textSize;
  }

  return base as Settings;
}

function textSizeScale(size: Settings["accessibility"]["textSize"]) {
  switch (size) {
    case "small":  return "0.95";
    case "large":  return "1.12";
    default:       return "1.00";
  }
}
