// src/components/LogoutButton.tsx
"use client";

import { useState } from "react";

export default function LogoutButton() {
  const [pending, setPending] = useState(false);

  async function handleLogout() {
    try {
      setPending(true);
      await fetch("/api/logout", { method: "POST" });
    } catch {
      // ignorer – vi sender uansett brukeren ut
    } finally {
      window.location.href = "/auth";
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={pending}
      style={{
        padding: "8px 12px",
        borderRadius: 999,
        background: "#F4F4F5",
        color: "#1F2937",
        fontSize: 13,
        fontWeight: 700,
        border: "none",
        opacity: pending ? 0.7 : 1,
        cursor: "pointer",
      }}
    >
      {pending ? "Logger ut…" : "Logg ut"}
    </button>
  );
}
