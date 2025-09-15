"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ResetClient({ token }: { token: string }) {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setMsg(null);
    if (password.length < 6) return setErr("Passord må være minst 6 tegn.");
    if (password !== confirm) return setErr("Passordene matcher ikke.");
    try {
      setLoading(true);
      const res = await fetch("/api/password/reset", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Kunne ikke sette nytt passord.");
      setMsg("Passordet er oppdatert. Logger deg inn…");
      setTimeout(() => router.replace("/dashboard"), 800);
    } catch (e: any) {
      setErr(e?.message || "Noe gikk galt.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#F7F3ED", padding: 24 }}>
      <form onSubmit={submit} style={{ width: "100%", maxWidth: 420, background: "#fff", padding: 24, borderRadius: 16, border: "1px solid #F0EFEA" }}>
        <h1 style={{ margin: 0, fontWeight: 900, color: "#0F172A" }}>Tilbakestill passord</h1>
        <p style={{ marginTop: 4, color: "#6B7280" }}>Velg et nytt passord for kontoen din.</p>

        <label htmlFor="pw" style={{ display: "block", marginTop: 16, fontWeight: 700, color: "#0F172A" }}>Nytt passord</label>
        <input id="pw" type="password" value={password} onChange={(e)=>setPassword(e.target.value)}
          placeholder="••••••••" style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid #E5E7EB", marginTop: 6 }} />

        <label htmlFor="c" style={{ display: "block", marginTop: 12, fontWeight: 700, color: "#0F172A" }}>Bekreft passord</label>
        <input id="c" type="password" value={confirm} onChange={(e)=>setConfirm(e.target.value)}
          placeholder="••••••••" style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid #E5E7EB", marginTop: 6 }} />

        {err && <div style={{ marginTop: 10, padding: "8px 10px", borderRadius: 10, background: "#FDE2E1", color: "#8A1C1C" }}>{err}</div>}
        {msg && <div style={{ marginTop: 10, padding: "8px 10px", borderRadius: 10, background: "#E6F4EA", color: "#166534" }}>{msg}</div>}

        <button type="submit" disabled={loading}
          style={{ marginTop: 14, width: "100%", padding: "12px 14px", borderRadius: 14, background: "#111827", color: "#fff", fontWeight: 900, opacity: loading ? 0.7 : 1 }}>
          {loading ? "Lagrer…" : "Lagre nytt passord"}
        </button>
      </form>
    </main>
  );
}
