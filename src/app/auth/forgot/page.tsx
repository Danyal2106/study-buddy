"use client";

import { useState } from "react";

export default function ForgotPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null); setErr(null);
    try {
      setLoading(true);
      const res = await fetch("/api/password/forgot", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Klarte ikke å sende e-post.");
      setMsg("Vi har sendt deg en lenke for å tilbakestille passordet.");
    } catch (e: any) {
      setErr(e?.message || "Noe gikk galt.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#F7F3ED", padding: 24 }}>
      <form onSubmit={submit} style={{ width: "100%", maxWidth: 420, background: "#fff", padding: 24, borderRadius: 16, border: "1px solid #F0EFEA" }}>
        <h1 style={{ margin: 0, fontWeight: 900, color: "#0F172A" }}>Glemt passord</h1>
        <p style={{ marginTop: 4, color: "#6B7280" }}>Vi sender deg en tilbakestillingslenke.</p>

        <label htmlFor="email" style={{ display: "block", marginTop: 16, fontWeight: 700, color: "#0F172A" }}>E-post</label>
        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="navn@skole.no"
          style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid #E5E7EB", marginTop: 6 }} />

        {err && <div style={{ marginTop: 10, padding: "8px 10px", borderRadius: 10, background: "#FDE2E1", color: "#8A1C1C" }}>{err}</div>}
        {msg && <div style={{ marginTop: 10, padding: "8px 10px", borderRadius: 10, background: "#E6F4EA", color: "#166534" }}>{msg}</div>}

        <button type="submit" disabled={loading}
          style={{ marginTop: 14, width: "100%", padding: "12px 14px", borderRadius: 14, background: "#111827", color: "#fff", fontWeight: 900, opacity: loading ? 0.7 : 1 }}>
          {loading ? "Sender…" : "Send lenke"}
        </button>
      </form>
    </main>
  );
}
