"use client";
import TopBar from "@/components/topbar";
import React from "react";

export default function CareerDaysPage() {
  return (
    <main style={sx.safe}>
      <style>{css}</style>
  <TopBar title="Events" />
      

      {/* Fullskjerm-bakgrunn */}
  
      <div className="bg grain" aria-hidden />
      <div className="bg vignette" aria-hidden />

      {/* Innhold */}
      <section className="container">
        <article className="card" aria-label="Kommer snart">
          <div className="sheen" aria-hidden />
          <div className="stack">
            <div className="accent" aria-hidden />
            <h1 className="title">Vi bygger neste kapittel</h1>
            <p className="subtitle">Vi tester detaljene. Du ser resultatet. Snart.</p>

            {/* Diskré statusrad */}
            <div className="status">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
              <span className="label">Finpussing pågår</span>
            </div>

          </div>
        </article>
      </section>
    </main>
  );
}

const sx: Record<string, React.CSSProperties> = {
  safe: {
    minHeight: "100vh",
    background: "var(--bg)",
    position: "relative",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
};

const css = `
/* ---------- Tokens ---------- */
:root{
  --bg: #0A0F18;
  --card: rgba(14, 18, 28, 0.55);
  --border: rgba(255,255,255,0.08);
  --text: #E7ECF5;
  --muted: #A7B2C5;
  --accentA: #8B5CF6; /* violet */
  --accentB: #22D3EE; /* cyan */
  --accentC: #F59E0B; /* amber */
  --shadow: 0 30px 60px rgba(0,0,0,.55);
}

@media (prefers-color-scheme: light){
  :root{
    --bg: #F7F8FB;
    --card: rgba(255,255,255,0.66);
    --border: rgba(15,23,42,0.08);
    --text: #0F172A;
    --muted: #64748B;
    --shadow: 0 24px 48px rgba(0,0,0,0.12);
  }
}

/* ---------- Bakgrunnslag ---------- */
.bg{ position:absolute; inset:0; pointer-events:none; }

.aurora{
  background:
    radial-gradient(1200px 600px at -10% 20%, color-mix(in oklab, var(--accentA) 18%, transparent), transparent 60%),
    radial-gradient(900px 700px at 110% 80%, color-mix(in oklab, var(--accentB) 18%, transparent), transparent 60%),
    linear-gradient(120deg, color-mix(in oklab, var(--accentA) 16%, transparent), transparent 30%),
    var(--bg);
  mask:
    linear-gradient(180deg, rgba(0,0,0,.95), rgba(0,0,0,.6));
  animation: auroraShift 26s ease-in-out infinite alternate;
}
@keyframes auroraShift {
  0% { filter: saturate(105%) hue-rotate(0deg); background-position: 0 0, 0 0, 0 0; }
  100%{ filter: saturate(120%) hue-rotate(10deg); background-position: 6% -3%, -4% 5%, 8% 0; }
}

.vignette{
  background: radial-gradient(120% 120% at 50% -10%, transparent 0%, rgba(0,0,0,.25) 70%, rgba(0,0,0,.55) 100%);
  mix-blend-mode: multiply;
  opacity:.35;
}

.grain{
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140' viewBox='0 0 140 140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/feTurbulence%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type='table' tableValues='0 0.022'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  opacity:.06; mix-blend-mode: overlay;
  animation: grainFlicker 1.8s steps(2) infinite;
}
@keyframes grainFlicker { 50% { opacity: .045 } }

/* ---------- Layout ---------- */
.container{
  position: relative;
  flex: 1;
  display: grid;
  place-items: center;
  padding: clamp(16px, 4vw, 48px);
}

.card{
  position: relative;
  width: min(980px, 96vw);
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 28px;
  box-shadow: var(--shadow);
  backdrop-filter: saturate(140%) blur(14px);
  -webkit-backdrop-filter: saturate(140%) blur(14px);
  overflow: hidden;

  /* “Bento”-layout: tekst venstre, luft høyre – gir premium asymmetri */
  display: grid;
  grid-template-columns: minmax(260px, 560px) 1fr;
  gap: clamp(16px, 4vw, 48px);
  padding: clamp(28px, 5vw, 56px);

  animation: cardIn .9s ease-out both;
}
@keyframes cardIn {
  from { opacity: 0; transform: translateY(18px) scale(.985); }
  to   { opacity: 1; transform: translateY(0)   scale(1); }
}

/* Subtil glans som beveger seg på skrå */
.sheen{
  position:absolute; inset:-2px; border-radius: 30px; padding:1px;
  background:
    linear-gradient(110deg, rgba(255,255,255,.14), transparent 38%) content-box,
    conic-gradient(from 140deg, var(--accentA), var(--accentB), var(--accentC), var(--accentA));
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude;
  opacity:.6;
  animation: sheenOrbit 18s linear infinite;
}
@keyframes sheenOrbit { to { transform: rotate(360deg) } }

/* Tekststakk */
.stack{
  position: relative;
  z-index: 1;
  align-self: center;
}

.accent{
  width: 64px; height: 6px; border-radius: 999px;
  background: linear-gradient(90deg, color-mix(in oklab, var(--accentA) 75%, white), color-mix(in oklab, var(--accentB) 75%, white));
  margin-bottom: clamp(14px, 2.5vw, 18px);
  position: relative; overflow: hidden;
}
.accent::after{
  content:"";
  position:absolute; inset:0; width:28%;
  background: linear-gradient(90deg, #fff, rgba(255,255,255,0));
  filter: blur(4px);
  transform: translateX(-120%);
  animation: accentSweep 2.6s ease-in-out infinite;
}
@keyframes accentSweep{
  0% { transform: translateX(-120%); opacity:.6; }
  50%{ transform: translateX(80%);   opacity:1; }
  100%{ transform: translateX(140%); opacity:.6; }
}

.title{
  margin: 0 0 10px 0;
  font-size: clamp(32px, 6vw, 68px);
  line-height: 1.02;
  font-weight: 900;
  letter-spacing: -0.015em;
  background: linear-gradient(90deg, var(--accentA), var(--accentB));
  -webkit-background-clip: text; background-clip: text; color: transparent;
  text-wrap: balance;
}
.subtitle{
  margin: 0 0 18px 0;
  font-size: clamp(16px, 2.5vw, 20px);
  color: var(--muted);
  font-weight: 600;
  text-wrap: pretty;
}

/* Statuslinje */
.status{
  display: inline-flex; align-items: center; gap: 8px;
  color: var(--muted); font-size: 14px; user-select: none;
  margin-bottom: 14px;
}
.dot{ width:6px; height:6px; border-radius:999px; background: var(--accentB); opacity:.5; }
.status .dot:nth-child(1){ animation: blink 1.6s ease-in-out infinite; }
.status .dot:nth-child(2){ animation: blink 1.6s ease-in-out .2s infinite; }
.status .dot:nth-child(3){ animation: blink 1.6s ease-in-out .4s infinite; }
@keyframes blink { 0%,100%{opacity:.3} 50%{opacity:1} }
.label{ font-weight: 600; }

/* Fremdrift */
.rail{
  position: relative; width: min(520px, 90%); height: 10px;
  border-radius: 999px; border: 1px solid var(--border);
  background: color-mix(in oklab, var(--text) 8%, transparent);
  overflow: hidden;
}
.cursor{
  position:absolute; inset:0; width: 32%;
  border-radius: 999px;
  background: linear-gradient(90deg,
    color-mix(in oklab, var(--accentA) 80%, white),
    color-mix(in oklab, var(--accentB) 80%, white));
  animation: glide 2.9s ease-in-out infinite;
  transform-origin: left center;
}
@keyframes glide {
  0%   { transform: translateX(-16%) scaleX(.4); opacity:.85; }
  50%  { transform: translateX(70%)  scaleX(.66); opacity:1; }
  100% { transform: translateX(120%) scaleX(.4); opacity:.85; }
}

/* Responsiv: stable kort i én kolonne på very small */
@media (max-width: 760px){
  .card{ grid-template-columns: 1fr; }
}

/* Tilgjengelighet */
@media (prefers-reduced-motion: reduce){
  .aurora,.grain,.sheen,.accent::after,.status .dot,.cursor{ animation: none !important; }
}
`;
