// app/providers.tsx
"use client";

import { SessionProvider } from "next-auth/react";
import { SettingsProvider } from "./(lib)/SettingsContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SettingsProvider>
        {children}
      </SettingsProvider>
    </SessionProvider>
  );
}
