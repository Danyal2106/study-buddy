"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [focusField, setFocusField] = useState<"email" | "password" | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const T = {
    BG: "#F7F3ED",
    CARD: "#FFFFFF",
    CARD_BORDER: "#F0EFEA",
    TEXT: "#0F172A",
    MUTED: "#6B7280",
    BORDER: "#E5E7EB",
    DIVIDER: "#E8E6E2",
    INPUT_BG: "#F6F7FA",
    INPUT_FOCUS: "#EEF5FF",
    PLACEHOLDER: "#9CA3AF",
    PRIMARY_BG: "#111827",
    LOGO_BG: "#CDE3F5",
    HINT_BG: "#FFE5DC",
    ERROR_BG: "#FDE2E1",
    ERROR_TEXT: "#8A1C1C",
    BLOB1: "rgba(235, 200, 255, 0.45)",
    BLOB2: "rgba(197, 232, 255, 0.55)",
    SHADOW: "rgba(0,0,0,0.12)",
    ACCENT: "#2563EB",
  };

  function isValidEmail(e: string) {
    return /[^\s@]+@[^\s@]+\.[^\s@]+/.test(e);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!isValidEmail(email)) return setErr("Skriv inn en gyldig e-postadresse.");
    if (password.length < 6) return setErr("Passord må være minst 6 tegn.");

    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Feil brukernavn eller passord.");
      router.replace("/dashboard");
    } catch (e: any) {
      setErr(e?.message || "Innlogging feilet");
    } finally {
      setLoading(false);
    }
  }

  function handleForgot() {
    router.push("/auth/forgot");
  }

  function handleSignupInfo() {
    // RIKTIG route til første steg i onboarding
      router.push("/auth/signup-info");
  }

  function handleGoogle() {
    const cb = encodeURIComponent("/dashboard");
    window.location.href = `/api/auth/signin/google?callbackUrl=${cb}`;
  }

  async function seedDemo() {
    try {
      setSeeding(true);
      const res = await fetch("/api/dev/seed-demo");
      const data = await res.json();
      if (!data.ok) throw new Error("Seeding feilet");
      alert("Demo-bruker opprettet: test@gmail.com / 123456");
    } catch (e: any) {
      alert(e?.message || "Klarte ikke å opprette demo-bruker");
    } finally {
      setSeeding(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: T.BG }}>
      {/* Bakgrunnsblobs */}
      <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: -120, right: -80, width: 240, height: 240, borderRadius: 240, background: T.BLOB1, filter: "blur(2px)" }} />
        <div style={{ position: "absolute", bottom: -80, left: -60, width: 200, height: 200, borderRadius: 200, background: T.BLOB2, filter: "blur(2px)" }} />
      </div>

      {/* Innhold */}
      <div style={{ display: "grid", placeItems: "center", padding: 20 }}>
        <form
          onSubmit={handleLogin}
          style={{
            width: "100%", maxWidth: 480, background: T.CARD, border: `1px solid ${T.CARD_BORDER}`,
            borderRadius: 22, padding: 20, boxShadow: `0 10px 24px ${T.SHADOW}`, display: "grid", gap: 14,
          }}
        >
          {/* Logo/brand */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "center", marginBottom: 4 }}>
            <div style={{ width: 50, height: 50, borderRadius: 16, background: T.LOGO_BG, display: "grid", placeItems: "center", boxShadow: `0 10px 20px ${T.SHADOW}` }}>
              <span style={{ fontWeight: 900, letterSpacing: 0.3, color: T.TEXT }}>SB</span>
            </div>
            <div style={{ display: "grid", gap: 2 }}>
              <span style={{ fontWeight: 900, fontSize: 20, letterSpacing: 0.3, color: T.TEXT }}>StudyBuddy</span>
              <span style={{ fontSize: 12, color: T.MUTED }}>Organiser, lær, lever.</span>
            </div>
          </div>

          {/* Tittel */}
          <div style={{ display: "grid", gap: 4 }}>
            <h1 style={{ margin: 0, color: T.TEXT, fontSize: 24, fontWeight: 900 }}>Logg inn</h1>
            <p style={{ margin: 0, color: T.MUTED }}>Hyggelig å se deg igjen 👋</p>
          </div>

          {/* E-post */}
          <div style={{ display: "grid", gap: 8, marginTop: 6 }}>
            <label style={{ fontWeight: 700, color: T.TEXT }} htmlFor="email">E-post</label>
            <div
              style={{
                border: "1px solid",
                borderColor: focusField === "email" ? T.ACCENT : "transparent",
                background: focusField === "email" ? T.INPUT_FOCUS : T.INPUT_BG,
                borderRadius: 14,
              }}
            >
              <input
                id="email"
                type="email"
                value={email}
                onFocus={() => setFocusField("email")}
                onBlur={() => setFocusField(null)}
                onChange={(e) => { setEmail(e.target.value); if (err) setErr(null); }}
                placeholder="navn@skole.no"
                aria-label="E-postadresse"
                style={{ width: "100%", border: "none", outline: "none", background: "transparent", color: T.TEXT, padding: "14px 14px", fontSize: 16, borderRadius: 14 }}
              />
            </div>
          </div>

          {/* Passord */}
          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <label style={{ fontWeight: 700, color: T.TEXT }} htmlFor="password">Passord</label>
              <button type="button" onClick={handleForgot} style={{ background: "none", border: "none", color: T.TEXT, fontWeight: 800, cursor: "pointer" }}>
                Glemt?
              </button>
            </div>

            <div
              style={{
                position: "relative",
                border: "1px solid",
                borderColor: focusField === "password" ? T.ACCENT : "transparent",
                background: focusField === "password" ? T.INPUT_FOCUS : T.INPUT_BG,
                borderRadius: 14,
              }}
            >
              <input
                id="password"
                type={showPw ? "text" : "password"}
                value={password}
                onFocus={() => setFocusField("password")}
                onBlur={() => setFocusField(null)}
                onChange={(e) => { setPassword(e.target.value); if (err) setErr(null); }}
                placeholder="••••••••"
                aria-label="Passord"
                style={{ width: "100%", border: "none", outline: "none", background: "transparent", color: T.TEXT, padding: "14px 44px 14px 14px", fontSize: 16, borderRadius: 14 }}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? "Skjul passord" : "Vis passord"}
                style={{ position: "absolute", right: 10, top: 10, height: 28, width: 28, display: "grid", placeItems: "center", background: "transparent", border: "none", cursor: "pointer", color: T.MUTED }}
              >
                <span style={{ fontSize: 16 }}>{showPw ? "🙈" : "👁️"}</span>
              </button>
            </div>
          </div>

          {/* Feil */}
          {err ? (
            <div style={{ marginTop: 2, fontWeight: 600, padding: "8px 10px", borderRadius: 10, background: T.ERROR_BG, color: T.ERROR_TEXT }} aria-live="polite">
              {err}
            </div>
          ) : null}

          {/* CTA: Logg inn */}
          <button
            type="submit"
            disabled={loading}
            style={{ marginTop: 6, padding: "14px 16px", borderRadius: 16, border: "none", background: T.PRIMARY_BG, color: "#fff", fontWeight: 900, cursor: "pointer", opacity: loading ? 0.7 : 1, boxShadow: `0 8px 20px ${T.SHADOW}` }}
          >
            {loading ? "Logger inn…" : "Logg inn"}
          </button>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "10px 0" }}>
            <div style={{ flex: 1, height: 1, background: T.DIVIDER }} />
            <span style={{ color: T.MUTED, fontSize: 12 }}>eller</span>
            <div style={{ flex: 1, height: 1, background: T.DIVIDER }} />
          </div>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogle}
            style={{ border: `1px solid ${T.BORDER}`, borderRadius: 16, padding: "12px 14px", background: T.CARD, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer" }}
          >
            <span style={{ width: 22, height: 22, borderRadius: 6, border: `1px solid ${T.BORDER}`, display: "grid", placeItems: "center", background: T.CARD, fontWeight: 900, color: T.TEXT }}>
              G
            </span>
            <span style={{ color: T.TEXT }}>Fortsett med Google</span>
          </button>

          {/* Bunn-lenker */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6 }}>
            <span style={{ color: T.MUTED, fontSize: 12 }}>Ny her?</span>
            <button type="button" onClick={handleSignupInfo} style={{ background: "none", border: "none", color: T.TEXT, fontWeight: 800, cursor: "pointer" }}>
              Opprett konto
            </button>
          </div>

          {/* Demo-hint + seeding-knapp */}
          <div style={{ fontSize: 11, textAlign: "center", marginTop: 6, padding: "6px 8px", background: T.HINT_BG, color: T.MUTED, borderRadius: 10 }}>
            Demo: <b>test@gmail.com</b> / <b>123456</b>
            <div style={{ marginTop: 6 }}>
              <button
                type="button"
                onClick={seedDemo}
                disabled={seeding}
                style={{ border: "none", background: "transparent", textDecoration: "underline", cursor: "pointer", color: T.TEXT, fontWeight: 700 }}
              >
                {seeding ? "Oppretter demo…" : "Opprett demo-bruker"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
