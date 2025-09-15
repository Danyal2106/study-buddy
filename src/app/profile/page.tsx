"use client";
import { useMemo, useState, useEffect } from "react";
import TopBar from "@/components/topbar";

export default function ProfilePage() {
  const email = "alex@example.com";
  const firstName = useMemo(() => email.split("@")[0], [email]);
  const STORAGE_KEY = "profile.saved.v1";

  // Defaultdata (fallback dersom ingenting er lagret ennå)
  const defaultProfile: ProfileData = {
    firstName: capitalize(firstName),
    lastName: "Andersen",
    email,
    fieldOfStudy: "Informatikk",
    username: firstName,
    bio: "Elsker kaffe, klatring og sideprosjekter.",
    location: "Oslo, Norge",
    website: "https://alex.example",
    linkedIn: "https://linkedin.com/in/alex",
    github: "https://github.com/alex",
    twitter: "https://twitter.com/alex",
    avatarUrl: `https://api.dicebear.com/7.x/thumbs/svg?seed=${firstName}`,
    joinedAt: new Date("2023-04-12").toISOString(),
  };

  // "Lagret" profil (hentes fra localStorage ved mount)
  const [savedProfile, setSavedProfile] = useState<ProfileData>(defaultProfile);
  const [form, setForm] = useState<ProfileData>(defaultProfile);
  const isDirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(savedProfile), [form, savedProfile]);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Les fra localStorage når komponenten monteres
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: ProfileData = JSON.parse(raw);
        setSavedProfile(parsed);
        setForm(parsed);
      } else {
        // ingen lagring – bruk default og skriv det første gang for konsistens
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultProfile));
      }
    } catch (e) {
      console.warn("Kunne ikke lese profil fra localStorage", e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onChange<K extends keyof ProfileData>(key: K, value: ProfileData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!isDirty) return;
    setSaving(true);
    setError(null);

    try {
      // TODO: POST /api/profile om du har backend. Ved suksess: setSavedProfile(res.json())
      await wait(300);
      setSavedProfile(form);
      // Persistér i localStorage så endringene huskes ved neste besøk
      localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
      setSavedAt(new Date());
    } catch (err: any) {
      setError(err?.message ?? "Kunne ikke lagre profilen.");
    } finally {
      setSaving(false);
    }
  }

  const bioCount = form.bio?.length ?? 0;
  const bioMax = 200;

  return (
    <main style={sx.safe}>
      <TopBar title="Min profil" />
      <div style={sx.page}>
        <div style={sx.columns}>
          {/* Redigeringskort */}
          <section style={sx.card}>
            <header style={sx.cardHeader}>
              <h2 style={sx.h2}>Rediger profil</h2>
              <p style={sx.muted}>Innlogget som <strong>{savedProfile.email}</strong></p>
            </header>

            {error && <div style={{ ...sx.alert, ...sx.alertError }}>⚠️ {error}</div>}
            {savedAt && !saving && !error && <div style={{ ...sx.alert, ...sx.alertOk }}>✅ Endringer lagret {formatTime(savedAt)}.</div>}

            <form onSubmit={saveProfile} style={sx.formGrid}>
              {/* Avatar */}
              <label style={sx.label}>Profilbilde</label>
              <div style={sx.avatarRow}>
                <img src={form.avatarUrl} alt="Avatar" style={sx.avatar} />
                <div style={{ display: "grid", gap: 8 }}>
                  <input
                    style={sx.input}
                    placeholder="Lim inn URL til bilde"
                    value={form.avatarUrl}
                    onChange={(e) => onChange("avatarUrl", e.target.value)}
                  />
                  <p style={sx.help}>Tips: Bruk et kvadratisk bilde for best resultat.</p>
                </div>
              </div>

              <label style={sx.label}>Fornavn</label>
              <input value={form.firstName} onChange={(e) => onChange("firstName", e.target.value)} style={sx.input} />

              <label style={sx.label}>Etternavn</label>
              <input value={form.lastName} onChange={(e) => onChange("lastName", e.target.value)} style={sx.input} />

              <label style={sx.label}>E-post</label>
              <input value={form.email} disabled style={{ ...sx.input, background: "#f9fafb" }} />

              <label style={sx.label}>Studieretning</label>
              <input value={form.fieldOfStudy} onChange={(e) => onChange("fieldOfStudy", e.target.value)} style={sx.input} />

              <label style={sx.label}>Brukernavn</label>
              <input value={form.username} onChange={(e) => onChange("username", slugify(e.target.value))} style={sx.input} />

              <label style={sx.label}>Bio</label>
              <textarea
                value={form.bio}
                onChange={(e) => onChange("bio", e.target.value.slice(0, bioMax))}
                rows={4}
                style={sx.textarea}
                placeholder="Si litt om deg selv …"
              />
              <div style={sx.counter}>{bioCount}/{bioMax}</div>

              <label style={sx.label}>Lokasjon</label>
              <input value={form.location} onChange={(e) => onChange("location", e.target.value)} style={sx.input} />

              <label style={sx.label}>Nettside</label>
              <input value={form.website} onChange={(e) => onChange("website", e.target.value)} style={sx.input} />

              <label style={sx.label}>LinkedIn</label>
              <input value={form.linkedIn} onChange={(e) => onChange("linkedIn", e.target.value)} style={sx.input} />

              <label style={sx.label}>GitHub</label>
              <input value={form.github} onChange={(e) => onChange("github", e.target.value)} style={sx.input} />

              <label style={sx.label}>Twitter</label>
              <input value={form.twitter} onChange={(e) => onChange("twitter", e.target.value)} style={sx.input} />

              <div style={sx.actions}>
                <button type="submit" style={{ ...sx.primary, opacity: isDirty && !saving ? 1 : 0.7 }} disabled={!isDirty || saving}>
                  {saving ? "Lagrer …" : isDirty ? "Lagre endringer" : "Lagret"}
                </button>
                {isDirty && !saving && (
                  <button type="button" style={sx.ghost} onClick={() => setForm(savedProfile)}>
                    Forkast endringer
                  </button>
                )}
              </div>
            </form>
          </section>

          {/* Min profil (forhåndsvisning) */}
          <aside style={sx.previewCard}>
            <header style={sx.previewHeader}>Min profil</header>
            <div style={sx.previewBody}>
              <div style={sx.profileHeader}>
                <img src={savedProfile.avatarUrl} alt="Avatar" style={{ ...sx.avatar, width: 96, height: 96 }} />
                <div>
                  <h3 style={sx.previewName}>{savedProfile.firstName} {savedProfile.lastName}</h3>
                  <p style={sx.previewUser}>@{savedProfile.username}</p>
                  <p style={sx.previewUser}>{savedProfile.email}</p>
                  <p style={sx.previewUser}>Studieretning: {savedProfile.fieldOfStudy}</p>
                </div>
              </div>

              {savedProfile.bio && <p style={sx.previewBio}>{savedProfile.bio}</p>}

              <div style={sx.previewMeta}>
                {savedProfile.location && <span>📍 {savedProfile.location}</span>}
                {savedProfile.website && <a href={normalizeUrl(savedProfile.website)} target="_blank">🌐 Nettside</a>}
                {savedProfile.linkedIn && <a href={normalizeUrl(savedProfile.linkedIn)} target="_blank">💼 LinkedIn</a>}
                {savedProfile.github && <a href={normalizeUrl(savedProfile.github)} target="_blank">💻 GitHub</a>}
                {savedProfile.twitter && <a href={normalizeUrl(savedProfile.twitter)} target="_blank">🐦 Twitter</a>}
                <span>🗓️ Medlem siden {formatDate(savedProfile.joinedAt)}</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  fieldOfStudy: string;
  username: string;
  bio: string;
  location: string;
  website: string;
  linkedIn: string;
  github: string;
  twitter: string;
  avatarUrl: string;
  joinedAt: string;
}

function wait(ms: number) { return new Promise((res) => setTimeout(res, ms)); }
function slugify(v: string) { return v.toLowerCase().replace(/[^a-z0-9_\-]+/g, "-").replace(/^-+|-+$/g, ""); }
function capitalize(v: string) { return v ? v.charAt(0).toUpperCase() + v.slice(1) : v; }
function formatTime(d: Date) { return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }); }
function formatDate(iso: string) { const d = new Date(iso); return d.toLocaleDateString(undefined, { year: "numeric", month: "short" }); }
function normalizeUrl(v: string) { if (!/^https?:\/\//i.test(v)) return `https://${v}`; return v; }

const BG = "#F8F5EF", CARD = "#FFFFFF", TEXT = "#111827", MUTED = "#6B7280", BORDER = "#E5E7EB";
const sx: Record<string, React.CSSProperties> = {
  safe: { minHeight: "100vh", background: BG, padding: 16 },
  page: { display: "grid", placeItems: "start center", paddingTop: 12 },
  columns: { width: "100%", maxWidth: 1080, display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 },
  card: { background: CARD, borderRadius: 16, padding: 16, display: "grid", gap: 12, boxShadow: "0 6px 12px rgba(0,0,0,0.06)", border: `1px solid ${BORDER}` },
  cardHeader: { display: "grid", gap: 4 },
  h2: { margin: 0, fontSize: 20, fontWeight: 800 as any, color: TEXT },
  muted: { margin: 0, color: MUTED },
  formGrid: { display: "grid", gap: 12, marginTop: 4 },
  label: { fontWeight: 700 as any, color: TEXT },
  input: { padding: "12px 14px", borderRadius: 12, border: `1px solid ${BORDER}`, outline: "none" },
  textarea: { padding: "12px 14px", borderRadius: 12, border: `1px solid ${BORDER}`, resize: "vertical", outline: "none" },
  avatarRow: { display: "grid", gridTemplateColumns: "auto 1fr", gap: 12, alignItems: "center" },
  avatar: { width: 72, height: 72, borderRadius: 16, border: `1px solid ${BORDER}`, objectFit: "cover", background: "#fafafa" },
  help: { margin: 0, color: MUTED, fontSize: 12 },
  counter: { textAlign: "right", color: MUTED, fontSize: 12 },
  actions: { display: "flex", gap: 8, alignItems: "center", marginTop: 4 },
  primary: { padding: "12px 14px", borderRadius: 14, background: "#111827", color: "#fff", fontWeight: 900 as any, border: "none", cursor: "pointer" },
  ghost: { padding: "10px 12px", borderRadius: 12, background: "transparent", color: TEXT, fontWeight: 700 as any, border: `1px solid ${BORDER}`, cursor: "pointer" },
  alert: { padding: "10px 12px", borderRadius: 12, border: `1px solid ${BORDER}`, fontSize: 14 },
  alertOk: { background: "#ECFDF5", borderColor: "#A7F3D0", color: "#065F46" },
  alertError: { background: "#FEF2F2", borderColor: "#FECACA", color: "#991B1B" },
  previewCard: { background: CARD, borderRadius: 16, border: `1px solid ${BORDER}`, boxShadow: "0 6px 12px rgba(0,0,0,0.06)", overflow: "hidden", alignSelf: "start" },
  previewHeader: { padding: 12, borderBottom: `1px solid ${BORDER}`, fontWeight: 800 as any, color: TEXT, background: "#FAFAFA" },
  previewBody: { display: "grid", gap: 16, padding: 16 },
  profileHeader: { display: "flex", alignItems: "center", gap: 16 },
  previewName: { margin: 0, fontSize: 22, color: TEXT },
  previewUser: { margin: 0, color: MUTED },
  previewBio: { margin: 0, color: TEXT },
  previewMeta: { display: "flex", flexDirection: "column", gap: 6, color: MUTED },
};
