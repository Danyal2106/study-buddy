"use client";

import { useRouter } from "next/navigation";
import React from "react";

type Props = {
  title: string;
  showBack?: boolean;
  rightSlot?: React.ReactNode; // valgfritt: plasser noe til høyre (f.eks. meny)
};

export default function TopBar({ title, showBack = true, rightSlot }: Props) {
  const router = useRouter();

  function goBack() {
    // Enkelt og stabilt: prøv å gå tilbake
    router.back();
  }

  return (
    <header style={styles.edge}>
      <div style={styles.wrap}>
        <div style={styles.row}>
          <div style={styles.left}>
            {showBack ? (
              <button
                type="button"
                onClick={goBack}
                aria-label="Tilbake"
                style={styles.iconBtn}
              >
                <span style={styles.iconGlyph}>←</span>
              </button>
            ) : (
              <div style={{ width: 36 }} />
            )}
          </div>

          <h1 style={styles.title} aria-live="polite">{title}</h1>

          <div style={styles.right}>
            {rightSlot ?? <div style={{ width: 36 }} />}
          </div>
        </div>
      </div>
    </header>
  );
}

/* ---- theme styles (samme palett) ---- */
const BG = "#F8F5EF";
const TEXT = "#1F2937";

const styles: Record<string, React.CSSProperties> = {
  edge: { marginLeft: -16, marginRight: -16 },
  wrap: {
    background: "#E6DFD3",
    padding: "10px 16px 14px",
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    borderBottom: "1px solid #DDD4C4",
    boxShadow: "0 6px 12px rgba(0,0,0,0.06)",

  },
  row: {
    display: "grid",
    gridTemplateColumns: "auto 1fr auto",
    alignItems: "center",
    gap: 8,
  },
  left: { display: "flex", alignItems: "center",   paddingLeft: 8, },
  right: { display: "flex", alignItems: "center", justifyContent: "flex-end" },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    display: "grid",
    placeItems: "center",
    background: "#E0D8C9",
    border: "1px solid #D6CEBE",
    cursor: "pointer",
  },
  iconGlyph: { color: TEXT as any, fontSize: 16, fontWeight: 700 as any },
  title: {
    margin: 0,
    textAlign: "center",
    color: TEXT,
    fontWeight: 900 as any,
    fontSize: 18,
    letterSpacing: 0.2,
  },
};
