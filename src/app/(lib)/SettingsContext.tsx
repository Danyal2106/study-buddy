"use client";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Theme = "light" | "dark";
export interface Settings {
  theme: Theme;
  language: "nb" | "nn" | "en";
  timezone: string;
  notifications: {
    enabled: boolean; email: boolean; push: boolean; sms: boolean; newsletter: boolean; productUpdates: boolean;
  };
  privacy: { showProfilePublic: boolean; searchableByEmail: boolean; analytics: boolean; personalizedAds: boolean; };
  security: { twoFactor: boolean; loginAlerts: boolean; sessions: Array<{ device: string; browser: string; location: string; lastActive: string }> };
  accessibility: { reduceMotion: boolean; highContrast: boolean; textSize: "small"|"medium"|"large" };
}

const STORAGE_KEY = "app.settings.v1";

const defaultSettings: Settings = {
  theme: "light",
  language: "nb",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Oslo",
  notifications: { enabled: true, email: true, push: false, sms: false, newsletter: false, productUpdates: true },
  privacy: { showProfilePublic: true, searchableByEmail: false, analytics: true, personalizedAds: false },
  security: { twoFactor: false, loginAlerts: true, sessions: [] },
  accessibility: { reduceMotion: false, highContrast: false, textSize: "medium" },
};

interface Ctx {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  saveSettings: (next: Settings) => Promise<void>;
}

const SettingsContext = createContext<Ctx | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  // Hydrer fra localStorage + hold flere faner i sync
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Settings;
        setSettings(parsed);
        applyTheme(parsed);
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultSettings));
        applyTheme(defaultSettings);
      }
    } catch {}

    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        const next = JSON.parse(e.newValue) as Settings;
        setSettings(next);
        applyTheme(next);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const saveSettings = async (next: Settings) => {
    // TODO (valgfritt): POST /api/settings
    setSettings(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    applyTheme(next);
  };

  const value = useMemo(() => ({ settings, setSettings, saveSettings }), [settings]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside <SettingsProvider>");
  return ctx;
}

// Sett globale CSS-variabler på <html> – påvirker hele siden
function applyTheme(s: Settings) {
  const root = document.documentElement; // <html>
  root.setAttribute("data-theme", s.theme);

  const isDark = s.theme === "dark";
  const BG = isDark ? "#0B1220" : "#F8F5EF";
  const CARD = isDark ? "#0F172A" : "#FFFFFF";
  const TEXT = isDark ? "#E5E7EB" : "#111827";
  const INPUT_BG = isDark ? "#111827" : "#FFFFFF";
  const BORDER = isDark ? "#243449" : "#E5E7EB";

  root.style.setProperty("--bg", BG);
  root.style.setProperty("--card", CARD);
  root.style.setProperty("--text", TEXT);
  root.style.setProperty("--input", INPUT_BG);
  root.style.setProperty("--border", BORDER);
}
