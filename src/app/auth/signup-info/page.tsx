"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import { useRouter } from "next/navigation";

type Plan = "free" | "medium" | "premium";

export default function SignupInfo() {
  const router = useRouter();

  // Trygg sitekey (fallback til test-key i dev)
  const SITEKEY =
    (process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY as string | undefined)?.trim() ||
    "10000000-ffff-ffff-ffff-000000000001";

  const T = {
    BG: "#F7F3ED", CARD: "#FFFFFF", CARD_BORDER: "#F0EFEA", TEXT: "#0F172A",
    MUTED: "#6B7280", BORDER: "#E5E7EB", DIVIDER: "#E8E6E2", INPUT_BG: "#F6F7FA",
    INPUT_FOCUS: "#EEF5FF", PLACEHOLDER: "#9CA3AF", PRIMARY_BG: "#111827",
    LOGO_BG: "#CDE3F5", HINT_BG: "#FFE5DC", ERROR_BG: "#FDE2E1", ERROR_TEXT: "#8A1C1C",
    BLOB1: "rgba(235, 200, 255, 0.45)", BLOB2: "rgba(197, 232, 255, 0.55)", SHADOW: "rgba(0,0,0,0.12)",
    ACCENT: "#2563EB",
  };

  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [focus, setFocus] =
    useState<null | "first" | "last" | "email" | "password" | "confirm">(null);
  const [err, setErr] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);

  const [plan, setPlan] = useState<Plan>("medium");
  const [hoveredPlan, setHoveredPlan] = useState<Plan | null>(null);
  const prices: Record<Plan, number> = { free: 0, medium: 79, premium: 129 };

  // Passord: vis kun én gang (8 sek)
  const [showPw, setShowPw] = useState(false);
  const [pwRevealUsed, setPwRevealUsed] = useState(false);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  // hCaptcha
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaOk, setCaptchaOk] = useState(false);
  const captchaRef = useRef<HCaptcha | null>(null);

  const isEmail = (e:string)=>/[^\s@]+@[^\s@]+\.[^\s@]+/.test(e);

  const pwScore = useMemo(() => {
    let s = 0;
    if (password.length >= 6) s++;
    if (password.length >= 10) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/\d|[^A-Za-z0-9]/.test(password)) s++;
    return Math.min(s, 4);
  }, [password]);

  const totalProgress = useMemo(() => {
    const vals = [
      firstName.trim() ? 1 : 0,
      lastName.trim()  ? 1 : 0,
      isEmail(email)   ? 1 : 0,
      password.length >= 6 ? 1 : 0,
      confirm && confirm === password ? 1 : 0,
    ];
    return Math.round((vals.reduce((a,b)=>a+b,0)/vals.length)*100);
  }, [firstName,lastName,email,password,confirm]);

  useEffect(() => {
    return () => { if (hideTimerRef.current) clearTimeout(hideTimerRef.current); };
  }, []);

  function handleRevealPasswordOnce() {
    if (pwRevealUsed || !password) return;
    setShowPw(true);
    setPwRevealUsed(true);
    hideTimerRef.current = setTimeout(() => setShowPw(false), 8000);
  }

  function handleGoToLogin() {
    // URL-en til app/page.tsx er roten "/"
    router.push("/");
  }

  async function verifyCaptchaOnServer(token: string) {
    const r = await fetch("/api/captcha/verify", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ token }),
    });
    const j = await r.json();
    if (!r.ok || !j.ok) {
      setErr(j?.error || "Captcha feilet");
      return false;
    }
    return true;
  }

  async function onCaptchaVerify(token: string) {
    setErr(null);
    setCaptchaToken(token);
    const ok = await verifyCaptchaOnServer(token);
    setCaptchaOk(ok);
  }

  function onCaptchaExpire() {
    setCaptchaOk(false);
    setCaptchaToken(null);
  }

  async function next() {
    if (!firstName.trim() || !lastName.trim()) return setErr("Fyll inn fornavn og etternavn.");
    if (!isEmail(email)) return setErr("Bruk en gyldig e-postadresse.");
    if (password.length < 6) return setErr("Passord må være minst 6 tegn.");
    if (password !== confirm) return setErr("Passordene matcher ikke.");
    if (!captchaOk || !captchaToken) return setErr("Bekreft at du ikke er en robot.");

    if (plan !== "free") {
      return setErr("Medium og Premium er ikke tilgjengelig ennå. Velg Basic – Gratis for nå.");
    }

    setErr(null);
    try {
      setLoading(true);
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, password, plan, captchaToken }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json?.error || "Signup feilet");

      const r2 = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const j2 = await r2.json();
      if (!r2.ok || !j2.ok) throw new Error(j2?.error || "Innlogging feilet");

      return router.replace("/dashboard");
    } catch (e:any) {
      setErr(e?.message || "Kunne ikke opprette bruker.");
    } finally {
      setLoading(false);
      try { captchaRef.current?.resetCaptcha(); } catch {}
      setCaptchaOk(false);
      setCaptchaToken(null);
    }
  }

  const inputWrap = (k: NonNullable<typeof focus>) => ({
    border: "1px solid",
    borderColor: focus === k ? T.ACCENT : "transparent",
    background: focus === k ? T.INPUT_FOCUS : T.INPUT_BG,
    borderRadius: 14,
  } as const);

  const inputBase: React.CSSProperties = {
    width: "100%", border: "none", outline: "none", background: "transparent",
    color: T.TEXT, padding: "12px 14px", fontSize: 16, borderRadius: 14
  };

  const planCardBase: React.CSSProperties = {
    position: "relative", display: "grid", gap: 6, padding: "14px",
    borderRadius: 16, border: `1px solid ${T.BORDER}`, background: T.CARD,
    cursor: "pointer", boxShadow: `0 6px 14px ${T.SHADOW}`, transition: "transform .06s ease", textAlign: "left",
  };

  const planActive = (active: boolean): React.CSSProperties => ({
    border: `1px solid ${active ? T.ACCENT : T.BORDER}`,
    background: active ? T.INPUT_FOCUS : T.CARD,
  });

  const badgeSoon: React.CSSProperties = {
    position: "absolute", top: 10, right: 10, fontSize: 11, padding: "4px 8px",
    borderRadius: 999, background: "#FFF1F2", color: "#BE123C", border: `1px solid ${T.BORDER}`, fontWeight: 800
  };

  const tooltip: React.CSSProperties = {
    position: "absolute", bottom: -6, left: "50%", transform: "translate(-50%, 100%)",
    whiteSpace: "nowrap", fontSize: 12, padding: "6px 8px", borderRadius: 10,
    background: T.TEXT, color: "#fff", boxShadow: `0 6px 14px ${T.SHADOW}`, pointerEvents: "none"
  };

  return (
    <main style={{ minHeight: "100vh", background: T.BG }}>
      <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: -120, right: -80, width: 240, height: 240, borderRadius: 240, background: T.BLOB1, filter: "blur(2px)" }} />
        <div style={{ position: "absolute", bottom: -80, left: -60, width: 200, height: 200, borderRadius: 200, background: T.BLOB2, filter: "blur(2px)" }} />
      </div>

      <div style={{ display: "grid", placeItems: "center", padding: 20 }}>
        <div style={{ width: "100%", maxWidth: 880, background: T.CARD, border: `1px solid ${T.CARD_BORDER}`, borderRadius: 22, padding: 20, boxShadow: `0 10px 24px ${T.SHADOW}`, display: "grid", gap: 16 }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 50, height: 50, borderRadius: 16, background: T.LOGO_BG, display: "grid", placeItems: "center", boxShadow: `0 10px 20px ${T.SHADOW}` }}>
                <span style={{ fontWeight: 900, letterSpacing: 0.3, color: T.TEXT }}>SB</span>
              </div>
              <div style={{ display: "grid", gap: 2 }}>
                <span style={{ fontWeight: 900, fontSize: 20, letterSpacing: 0.3, color: T.TEXT }}>StudyBuddy</span>
                <span style={{ fontSize: 12, color: T.MUTED }}>Organiser, lær, lever.</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleGoToLogin}
              style={{ padding: "10px 12px", borderRadius: 12, border: `1px solid ${T.BORDER}`, background: T.CARD, color: T.TEXT, fontWeight: 800, cursor: "pointer", boxShadow: `0 6px 14px ${T.SHADOW}` }}
            >
              Har du konto? Logg inn
            </button>
          </div>

          {/* Tittel */}
          <div style={{ display: "grid", gap: 4 }}>
            <h1 style={{ margin: 0, color: T.TEXT, fontSize: 24, fontWeight: 900 }}>Opprett konto</h1>
            <p style={{ margin: 0, color: T.MUTED }}>Steg 1 av 2 · Din info</p>
          </div>

          {/* Grid */}
          <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1.2fr .8fr" }}>
            {/* Skjema */}
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }}>
                <div style={inputWrap("first" as any)}>
                  <input placeholder="Fornavn" value={firstName} onFocus={()=>setFocus("first")} onBlur={()=>setFocus(null)} onChange={e=>{ setFirstName(e.target.value); if (err) setErr(null); }} aria-label="Fornavn" style={inputBase} />
                </div>
                <div style={inputWrap("last" as any)}>
                  <input placeholder="Etternavn" value={lastName} onFocus={()=>setFocus("last")} onBlur={()=>setFocus(null)} onChange={e=>{ setLastName(e.target.value); if (err) setErr(null); }} aria-label="Etternavn" style={inputBase} />
                </div>
              </div>

              <div style={inputWrap("email" as any)}>
                <input placeholder="navn@skole.no" value={email} onFocus={()=>setFocus("email")} onBlur={()=>setFocus(null)} onChange={e=>{ setEmail(e.target.value); if (err) setErr(null); }} aria-label="E-postadresse" style={inputBase} type="email" />
              </div>

              <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }}>
                <div style={{ position: "relative", ...inputWrap("password" as any) }}>
                  <input placeholder="Passord" type={showPw ? "text" : "password"} value={password} onFocus={()=>setFocus("password")} onBlur={()=>setFocus(null)} onChange={e=>{ setPassword(e.target.value); if (err) setErr(null); }} aria-label="Passord" style={{ ...inputBase, paddingRight: 44 }} />
                  <button type="button" onClick={handleRevealPasswordOnce} aria-label={pwRevealUsed ? "Passordvisning brukt" : "Vis passord (én gang)"} disabled={pwRevealUsed || !password} style={{ position: "absolute", right: 10, top: 10, height: 28, width: 28, display: "grid", placeItems: "center", background: "transparent", border: "none", cursor: pwRevealUsed ? "not-allowed" : "pointer", color: T.MUTED, opacity: pwRevealUsed ? 0.5 : 1 }} title={pwRevealUsed ? "Kan kun vises én gang" : "Vis passord i 8 sekunder"}>
                    <span style={{ fontSize: 16 }}>{pwRevealUsed ? "✅" : "👁️"}</span>
                  </button>
                </div>
                <div style={inputWrap("confirm" as any)}>
                  <input placeholder="Bekreft passord" type="password" value={confirm} onFocus={()=>setFocus("confirm")} onBlur={()=>setFocus(null)} onChange={e=>{ setConfirm(e.target.value); if (err) setErr(null); }} aria-label="Bekreft passord" style={inputBase} />
                </div>
              </div>

              {/* Pw-styrke */}
              <div style={{ display: "grid", gap: 6 }}>
                <div style={{ height: 8, background: T.DIVIDER, borderRadius: 999, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(pwScore/4)*100}%`, background: pwScore >= 3 ? "#22C55E" : pwScore === 2 ? "#F59E0B" : "#EF4444", transition: "width .2s ease" }} aria-hidden />
                </div>
                <span style={{ fontSize: 12, color: T.MUTED }}>
                  Passordstyrke: {["Svært svak","Svak","OK","Bra","Sterk"][pwScore]}
                </span>
              </div>

              {/* hCaptcha */}
              <div style={{ border: `1px solid ${T.BORDER}`, background: T.CARD, borderRadius: 12, padding: "10px 12px", boxShadow: `0 6px 14px ${T.SHADOW}`, display: "grid", gap: 8 }}>
                <span style={{ color: T.TEXT, fontWeight: 700, fontSize: 14 }}>Robot-sjekk</span>
                <HCaptcha
                  ref={captchaRef as any}
                  sitekey={SITEKEY}
                  onVerify={onCaptchaVerify}
                  onExpire={onCaptchaExpire}
                  onError={()=>setErr("Kunne ikke laste robot-sjekk. Prøv igjen.")}
                  theme="light"
                />
                <span style={{ color: T.MUTED, fontSize: 12 }}>
                  Vi bruker hCaptcha for å beskytte mot misbruk.
                </span>
              </div>

              {/* Fremdrift */}
              <div style={{ display: "grid", gap: 6 }}>
                <div style={{ height: 6, background: T.DIVIDER, borderRadius: 999, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${totalProgress}%`, background: T.ACCENT, transition: "width .2s ease" }} aria-hidden />
                </div>
                <span style={{ fontSize: 12, color: T.MUTED }}>Fremdrift: {totalProgress}%</span>
              </div>
            </div>

            {/* Planvalg */}
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <strong style={{ color: T.TEXT }}>Velg plan</strong>
                <span style={{ color: T.MUTED, fontSize: 12 }}>Du kan oppgradere senere</span>
              </div>

              <div style={{ display: "grid", gap: 10 }}>
                <button type="button" onClick={()=>{ setPlan("free"); setErr(null); }} onMouseEnter={()=>setHoveredPlan("free")} onMouseLeave={()=>setHoveredPlan(null)} style={{ ...planCardBase, ...planActive(plan==="free") }} aria-pressed={plan==="free"}>
                  <div style={{ fontWeight: 900, color: T.TEXT, display: "flex", alignItems: "center", gap: 8 }}>
                    <span>✨ Basic – Gratis</span>
                  </div>
                  <span style={{ color: T.MUTED, fontSize: 13 }}>Kjernefunksjoner for å komme i gang.</span>
                  <span style={{ fontSize: 12, color: T.MUTED }}>Kr 0 / mnd</span>
                </button>

                <div onMouseEnter={()=>setHoveredPlan("medium")} onMouseLeave={()=>setHoveredPlan(null)} onClick={()=>setErr("Medium er ikke tilgjengelig ennå. Velg Basic – Gratis for nå.")} role="button" aria-disabled="true" style={{ ...planCardBase, ...planActive(plan==="medium"), opacity: 0.7, cursor: "not-allowed", filter: "grayscale(0.1)" }} title="Ikke tilgjengelig nå">
                  <div style={{ fontWeight: 900, color: T.TEXT, display: "flex", alignItems: "center", gap: 8 }}>
                    <span>📅 Medium – 79 kr/mnd</span>
                  </div>
                  <span style={{ color: T.MUTED, fontSize: 13 }}>Flere integrasjoner og planleggingsverktøy.</span>
                  <span style={badgeSoon}>Ikke tilgjengelig nå</span>
                  {hoveredPlan==="medium" && <div style={tooltip}>Kommer snart 🚧</div>}
                </div>

                <div onMouseEnter={()=>setHoveredPlan("premium")} onMouseLeave={()=>setHoveredPlan(null)} onClick={()=>setErr("Premium er ikke tilgjengelig ennå. Velg Basic – Gratis for nå.")} role="button" aria-disabled="true" style={{ ...planCardBase, ...planActive(plan==="premium"), opacity: 0.7, cursor: "not-allowed", filter: "grayscale(0.1)" }} title="Ikke tilgjengelig nå">
                  <div style={{ fontWeight: 900, color: T.TEXT, display: "flex", alignItems: "center", gap: 8 }}>
                    <span>🤖 Premium – 129 kr/mnd</span>
                  </div>
                  <span style={{ color: T.MUTED, fontSize: 13 }}>Alt i Medium + AI-assistent og avanserte innsikter.</span>
                  <span style={badgeSoon}>Ikke tilgjengelig nå</span>
                  {hoveredPlan==="premium" && <div style={tooltip}>Kommer snart 🚧</div>}
                </div>
              </div>
            </div>
          </div>

          {err ? (
            <div style={{ marginTop: 2, fontWeight: 600, padding: "8px 10px", borderRadius: 10, background: T.ERROR_BG, color: T.ERROR_TEXT }} aria-live="polite">
              {err}
            </div>
          ) : null}

          <button onClick={next} disabled={loading} style={{ marginTop: 6, padding: "14px 16px", borderRadius: 16, border: "none", background: T.PRIMARY_BG, color: "#fff", fontWeight: 900, cursor: "pointer", opacity: loading ? 0.7 : 1, boxShadow: `0 8px 20px ${T.SHADOW}` }}>
            {loading ? "Lager konto…" : "Neste"}
          </button>
        </div>
      </div>
    </main>
  );
}
