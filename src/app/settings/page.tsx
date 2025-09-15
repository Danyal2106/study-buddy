// src/app/settings/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import TopBar from "@/components/topbar";
import {
  DEFAULTS,
  STORAGE_KEY,
  type Settings,
  loadSettings,
  saveSettings,
  applySettingsToDocument,
} from "@/lib/site-settings";
import { useRouter } from "next/navigation";
import type React from "react"; // ← (NY) for React.ReactNode-typen i ComingSoon

/** -------- Feature flags -------- */
const FEATURES = {
  sections: {
    notifications: false,
    privacy: false,
    accessibility: false,
    security: false, // ← lagt til: Sikkerhet kommer snart
  },
};

/** Wrapper som viser "Kommer snart" og blokkerer interaksjon når enabled=false */
function ComingSoon({
  enabled,
  children,
  label = "Kommer snart",
}: {
  enabled: boolean;
  children: React.ReactNode;
  label?: string;
}) {
  if (enabled) return <>{children}</>;
  return (
    <div
      style={{
        position: "relative",
        isolation: "isolate", // hindrer at overlay påvirker nabo-seksjoner
      }}
    >
      {/* Innholdet beholdes, men tones ned og kan ikke klikkes */}
      <div style={{ opacity: 0.55, pointerEvents: "none" }}>{children}</div>

      {/* Overlegg / badge – tar ikke imot klikk */}
      <div
        aria-label={label}
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "flex-end",
          pointerEvents: "none",
          padding: 10,
          zIndex: 1,
        }}
      >
        <span
          style={{
            background: "#fff",
            border: `1px solid ${tokens.BORDER}`,
            borderRadius: 9999,
            padding: "4px 10px",
            fontSize: 12,
            color: tokens.MUTED,
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter(); // ← (FIKSET) kall hooken
  const [saved, setSaved] = useState<Settings>(DEFAULTS);
  const [form, setForm] = useState<Settings>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  // Last fra localStorage ved mount
  useEffect(() => {
    const s = loadSettings();
    setSaved(s);
    setForm(s);
    applySettingsToDocument(s);
  }, []);

  const isDirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(saved),
    [form, saved]
  );

  function set<K extends keyof Settings>(key: K, value: Settings[K]) {
    setForm((p) => ({ ...p, [key]: value }));
  }
  function setIn(path: string[], value: any) {
    setForm((prev) => {
      const copy: any = JSON.parse(JSON.stringify(prev));
      let obj: any = copy;
      for (let i = 0; i < path.length - 1; i++) obj = obj[path[i]];
      obj[path[path.length - 1]] = value;
      return copy;
    });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!isDirty) return;
    setSaving(true);
    try {
      await wait(250);
      setSaved(form);
      saveSettings(form);
      applySettingsToDocument(form);
      setSavedAt(new Date());
    } finally {
      setSaving(false);
    }
  }

  /** Bekreft → slett all data → nullstill → alert → redirect("/") */
  function handleDeleteAccount() {
    const ok = confirm(
      "Er du sikker på at du vil slette kontoen? All lokal data (boards, fag, notater, flashcards og innstillinger) vil bli fjernet."
    );
    if (!ok) return;

    wipeAllAppData();

    setSaved(DEFAULTS);
    setForm(DEFAULTS);
    saveSettings(DEFAULTS);
    applySettingsToDocument(DEFAULTS);

    alert("Kontoen og all lokal data er slettet.");
    router.replace("/"); // ← (FIKSET) redirect til forsiden
  }

  const themeVars =
    form.theme === "dark"
      ? { BG: "#0B1220", CARD: "#0F172A", TEXT: "#E5E7EB", INPUT_BG: "#111827" }
      : { BG: "#F8F5EF", CARD: "#FFFFFF", TEXT: "#111827", INPUT_BG: "#FFFFFF" };

  return (
    <main style={{ ...sx.safe, background: themeVars.BG, color: themeVars.TEXT }}>
      <TopBar title="Innstillinger" />
      <div style={sx.page}>
        <form onSubmit={save} style={sx.columns}>
          {/* Generelt */}
          <section style={{ ...sx.card, background: themeVars.CARD }}>
            <header style={sx.cardHeader}>
              <h2 style={sx.h2}>Generelt</h2>
              <p style={sx.muted}>Grunnleggende preferanser for utseende og språk.</p>
            </header>
            <div style={sx.field}>
              <label style={sx.label}>Tema</label>
              <select
                value={form.theme}
                onChange={(e) => set("theme", e.target.value as Settings["theme"])}
                style={{ ...sx.input, background: themeVars.INPUT_BG, color: themeVars.TEXT }}
              >
                <option value="light">Lyst</option>
                <option value="dark">Mørkt</option>
              </select>
            </div>
            <div style={sx.row2}>
              <div style={sx.field}>
                <label style={sx.label}>Språk</label>
                <select
                  value={form.language}
                  onChange={(e) => set("language", e.target.value as Settings["language"])}
                  style={{ ...sx.input, background: themeVars.INPUT_BG, color: themeVars.TEXT }}
                >
                  <option value="nn">Ikke tilgjengelig </option>
                  {/** Aktiver flere senere:
                   * <option value="nb">Norsk (Bokmål)</option>
                   * <option value="nn">Norsk (Nynorsk)</option>
                   * <option value="en">English</option>
                   */}
                </select>
              </div>
              <div style={sx.field}>
                <label style={sx.label}>Tidssone</label>
                <input
                  value={form.timezone}
                  onChange={(e) => set("timezone", e.target.value)}
                  style={{ ...sx.input, background: themeVars.INPUT_BG }}
                />
              </div>
            </div>
          </section>

          {/* Varsler */}
          <ComingSoon enabled={FEATURES.sections.notifications} label="Varsler kommer snart">
            <section style={{ ...sx.card, background: themeVars.CARD }}>
              <header style={sx.cardHeader}>
                <h2 style={sx.h2}>Varsler</h2>
                <p style={sx.muted}>Velg hvordan og når vi skal kontakte deg.</p>
              </header>
              <Toggle
                checked={form.notifications.enabled}
                onChange={(v) => setIn(["notifications", "enabled"], v)}
                label="Aktiver varsler"
              />
              <div style={sx.row3}>
                <Checkbox
                  label="E-post"
                  checked={form.notifications.email}
                  onChange={(v) => setIn(["notifications", "email"], v)}
                />
                <Checkbox
                  label="Push"
                  checked={form.notifications.push}
                  onChange={(v) => setIn(["notifications", "push"], v)}
                />
                <Checkbox
                  label="SMS"
                  checked={form.notifications.sms}
                  onChange={(v) => setIn(["notifications", "sms"], v)}
                />
              </div>
              <div style={sx.row2}>
                <Checkbox
                  label="Nyhetsbrev"
                  checked={form.notifications.newsletter}
                  onChange={(v) => setIn(["notifications", "newsletter"], v)}
                />
                <Checkbox
                  label="Produktoppdateringer"
                  checked={form.notifications.productUpdates}
                  onChange={(v) => setIn(["notifications", "productUpdates"], v)}
                />
              </div>
            </section>
          </ComingSoon>

          {/* Personvern */}
          <ComingSoon enabled={FEATURES.sections.privacy} label="Personvern kommer snart">
            <section style={{ ...sx.card, background: themeVars.CARD }}>
              <header style={sx.cardHeader}>
                <h2 style={sx.h2}>Personvern</h2>
                <p style={sx.muted}>Kontroller synlighet og datainnsamling.</p>
              </header>
              <Toggle
                checked={form.privacy.showProfilePublic}
                onChange={(v) => setIn(["privacy", "showProfilePublic"], v)}
                label="Gjør profilen min synlig offentlig"
              />
              <Toggle
                checked={form.privacy.searchableByEmail}
                onChange={(v) => setIn(["privacy", "searchableByEmail"], v)}
                label="Tillat at andre finner meg via e-post"
              />
              <Toggle
                checked={form.privacy.analytics}
                onChange={(v) => setIn(["privacy", "analytics"], v)}
                label="Del anonyme bruksdata (analyse)"
              />
              <Toggle
                checked={form.privacy.personalizedAds}
                onChange={(v) => setIn(["privacy", "personalizedAds"], v)}
                label="Personlige annonser"
              />
            </section>
          </ComingSoon>

          {/* Sikkerhet — nå også ComingSoon */}
          <ComingSoon enabled={FEATURES.sections.security} label="Sikkerhet kommer snart">
            <section style={{ ...sx.card, background: themeVars.CARD }}>
              <header style={sx.cardHeader}>
                <h2 style={sx.h2}>Sikkerhet</h2>
                <p style={sx.muted}>Totrinnsbekreftelse, påloggingsvarsler og aktive økter.</p>
              </header>
              <Toggle
                checked={form.security.twoFactor}
                onChange={(v) => setIn(["security", "twoFactor"], v)}
                label="Totrinnsbekreftelse (2FA)"
              />
              <Toggle
                checked={form.security.loginAlerts}
                onChange={(v) => setIn(["security", "loginAlerts"], v)}
                label="Varsle ved ny pålogging"
              />
              <div style={sx.sessionsBox}>
                <div style={sx.sessionsHeader}>Aktive økter</div>
                {form.security.sessions.length === 0 ? (
                  <p style={sx.muted}>Ingen aktive økter registrert.</p>
                ) : (
                  <ul style={sx.sessionList}>
                    {form.security.sessions.map((s, i) => (
                      <li key={i} style={sx.sessionItem}>
                        <div>
                          <div style={{ fontWeight: 700 }}>
                            {s.device} · {s.browser}
                          </div>
                          <div style={{ color: tokens.MUTED, fontSize: 12 }}>
                            {s.location} · sist aktiv {new Date(s.lastActive).toLocaleString()}
                          </div>
                        </div>
                        <button type="button" style={sx.ghost} onClick={() => revokeSession(i)}>
                          Logg ut
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="button" style={sx.ghost} onClick={addMockSession}>
                    Legg til testøkt
                  </button>
                  <button type="button" style={sx.danger} onClick={revokeAll}>
                    Logg ut av alle
                  </button>
                </div>
              </div>
            </section>
          </ComingSoon>

          {/* Tilgjengelighet */}
          <ComingSoon enabled={FEATURES.sections.accessibility} label="Tilgjengelighet kommer snart">
            <section style={{ ...sx.card, background: themeVars.CARD }}>
              <header style={sx.cardHeader}>
                <h2 style={sx.h2}>Tilgjengelighet</h2>
                <p style={sx.muted}>Gjør appen lettere å bruke.</p>
              </header>
              <div style={sx.row3}>
                <Toggle
                  checked={form.accessibility.reduceMotion}
                  onChange={(v) => setIn(["accessibility", "reduceMotion"], v)}
                  label="Reduser animasjoner"
                />
                <Toggle
                  checked={form.accessibility.highContrast}
                  onChange={(v) => setIn(["accessibility", "highContrast"], v)}
                  label="Høykontrast"
                />
              </div>
              <div style={sx.field}>
                <label style={sx.label}>Tekststørrelse</label>
                <select
                  value={form.accessibility.textSize}
                  onChange={(e) => setIn(["accessibility", "textSize"], e.target.value)}
                  style={{ ...sx.input, background: themeVars.INPUT_BG, color: themeVars.TEXT }}
                >
                  <option value="small">Liten</option>
                  <option value="medium">Mellomstor</option>
                  <option value="large">Stor</option>
                </select>
              </div>
            </section>
          </ComingSoon>

          {/* Handlingslinje */}
          <div
            style={{
              gridColumn: "1 / -1",
              display: "flex",
              gap: 8,
              justifyContent: "flex-end",
              alignItems: "center",
            }}
          >
            {savedAt && !saving && (
              <span style={{ ...sx.muted, fontSize: 12 }}>
                Lagret {formatTime(savedAt)}.
              </span>
            )}
            <button
              type="submit"
              disabled={!isDirty || saving}
              style={{ ...sx.primary, opacity: isDirty && !saving ? 1 : 0.7 }}
            >
              {saving ? "Lagrer …" : isDirty ? "Lagre endringer" : "Lagret"}
            </button>
            <button
              type="button"
              disabled={!isDirty || saving}
              style={sx.ghost}
              onClick={() => setForm(saved)}
            >
              Forkast
            </button>
          </div>

          {/* Farlig sone – alltid live og KLKKBAR */}
          <section style={{ ...sx.card, background: themeVars.CARD, borderColor: tokens.RED_SOFT }}>
            <header style={sx.cardHeader}>
              <h2 style={{ ...sx.h2, color: tokens.RED }}>Farlig sone</h2>
              <p style={sx.muted}>Handlinger som ikke kan angres.</p>
            </header>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 700 }}>Slett konto</div>
                <div style={{ color: tokens.MUTED, fontSize: 12 }}>
                  Fjerner alle data permanent.
                </div>
              </div>
              <button type="button" style={sx.danger} onClick={handleDeleteAccount}>
                Slett konto
              </button>
            </div>
          </section>
        </form>
      </div>
    </main>
  );

  // ---- lokale hjelpere for økter ----
  function revokeSession(index: number) {
    const next = {
      ...form,
      security: {
        ...form.security,
        sessions: form.security.sessions.filter((_, i) => i !== index),
      },
    };
    setForm(next);
  }
  function revokeAll() {
    const next = { ...form, security: { ...form.security, sessions: [] } };
    setForm(next);
  }
  function addMockSession() {
    const next = {
      ...form,
      security: {
        ...form.security,
        sessions: [
          ...form.security.sessions,
          {
            device: "MacBook Pro",
            browser: "Chrome",
            location: "Oslo, NO",
            lastActive: new Date().toISOString(),
          },
        ],
      },
    };
    setForm(next);
  }
}

/* ---- Slett all lokal app-data (ny og legacy) ---- */
function wipeAllAppData() {
  try {
    localStorage.removeItem("sb_local_v1"); // boards/subjects/notes/flashcards
    localStorage.removeItem(STORAGE_KEY);   // app.settings.v1
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i) || "";
      if (k.startsWith("board:") || k.startsWith("sb_") || k.startsWith("studybuddy:")) {
        localStorage.removeItem(k);
      }
    }
    try { sessionStorage.clear(); } catch {}
  } catch {}
}

/* Utils */
function wait(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}
function formatTime(d: Date) {
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

/* UI helpers */
function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label style={{ ...sx.label, display: "flex", alignItems: "center", gap: 8 }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}
function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label style={{ ...sx.label, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <span>{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        aria-pressed={checked}
        style={{ ...sx.switch, background: checked ? tokens.SWITCH_ON : tokens.SWITCH_OFF }}
      >
        <span style={{ ...sx.knob, transform: checked ? "translateX(22px)" : "translateX(0)" }} />
      </button>
    </label>
  );
}

/* Tokens og styles */
const tokens = {
  BORDER: "#E5E7EB",
  MUTED: "#6B7280",
  RED: "#B91C1C",
  RED_SOFT: "#FECACA",
  SWITCH_ON: "#111827",
  SWITCH_OFF: "#D1D5DB",
};

const sx: Record<string, React.CSSProperties> = {
  safe: { minHeight: "100vh", padding: 16 },
  page: { display: "grid", placeItems: "start center", paddingTop: 12 },
  columns: { width: "100%", maxWidth: 1080, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },

  card: {
    borderRadius: 16,
    padding: 16,
    display: "grid",
    gap: 12,
    boxShadow: "0 6px 12px rgba(0,0,0,0.06)",
    border: `1px solid ${tokens.BORDER}`,
    position: "relative",
  },
  cardHeader: { display: "grid", gap: 4 },
  h2: { margin: 0, fontSize: 20, fontWeight: 800 as any },
  muted: { margin: 0, color: tokens.MUTED },

  field: { display: "grid", gap: 6 },
  label: { fontWeight: 700 as any },
  input: { padding: "12px 14px", borderRadius: 12, border: `1px solid ${tokens.BORDER}`, outline: "none" },
  row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  row3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 },

  primary: { padding: "12px 14px", borderRadius: 14, background: "#111827", color: "#fff", fontWeight: 900 as any, border: "none", cursor: "pointer" },
  ghost: { padding: "10px 12px", borderRadius: 12, background: "transparent", fontWeight: 700 as any, border: `1px solid ${tokens.BORDER}`, cursor: "pointer" },
  danger: { padding: "10px 12px", borderRadius: 12, background: "#ef4444", color: "#fff", fontWeight: 800 as any, border: "none", cursor: "pointer" },

  switch: { width: 44, height: 26, borderRadius: 9999, position: "relative", border: `1px solid ${tokens.BORDER}` },
  knob: { width: 22, height: 22, borderRadius: 9999, background: "#fff", position: "absolute", top: 1.5, left: 2 },

  sessionsBox: { display: "grid", gap: 12, padding: 12, border: `1px dashed ${tokens.BORDER}`, borderRadius: 12 },
  sessionsHeader: { fontWeight: 800 as any },
  sessionList: { listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 },
  sessionItem: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", borderRadius: 12, border: `1px solid ${tokens.BORDER}` },

  /* Responsiv */
  "@media(max-width: 980px) columns": { gridTemplateColumns: "1fr" },
};
