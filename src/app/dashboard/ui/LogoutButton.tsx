"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    try {
      const res = await fetch("/api/logout", { method: "POST" });
      await res.json();
      router.replace("/auth/signup-info");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button onClick={logout} disabled={loading}
      style={{background:"#111827", color:"#fff", padding:"10px 14px", borderRadius:12, fontWeight:800, opacity:loading?0.75:1}}>
      {loading ? "Logger ut…" : "Logg ut"}
    </button>
  );
}
