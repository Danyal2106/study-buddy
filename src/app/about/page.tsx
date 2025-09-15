"use client";
import TopBar from "@/components/topbar";
import { motion } from "framer-motion";

export default function AboutPage() {
  return (
    <main className="page" aria-label="About noteandplan">
      <TopBar title="About us" />

      {/* Hero */}
      <section className="wrap tight">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="heroCard hoverable luxuryBorder"
          role="banner"
        >
          <div className="heroHead">
            <span className="brandDot" aria-hidden />
            <h1 className="title animatedTitle" aria-live="polite">noteandplan</h1>
          </div>

          {/* Animated divider */}
          <div className="dividerWrap">
            <span className="dividerBar" />
          </div>

          <p className="lead leadColors">
            Laget for studenter av studenter. Ett sted for
            <span className="kw kw1"> notater</span>,
            <span className="kw kw2"> korte oppsummeringer</span>,
            <span className="kw kw3"> flashcards</span>
            og <span className="kw kw4"> planlegging</span> – enkelt, rolig og effektivt.
          </p>

          <div className="chips" role="list" aria-label="Kjernefunksjoner">
            <span className="chip" role="listitem">Fokusert arbeidsflyt</span>
            <span className="chip" role="listitem">Bygd av studenter</span>
            <span className="chip" role="listitem">Rask & lett</span>
          </div>
        </motion.div>
      </section>

      {/* Tilgjengelig nå */}
      <section id="now" className="wrap tighter">
        <motion.h2 
          initial={{ opacity: 0, y: 8 }} 
          whileInView={{ opacity: 1, y: 0 }} 
          viewport={{ once: true }} 
          transition={{ duration: 0.4 }}
          className="sectionTitle fancyTitle"
        >
          Tilgjengelig nå
        </motion.h2>
        <div className="grid">
          <Card title="Notater" desc="Lag og organiser notater med klar struktur." />
          <Card title="Oppsummering" desc="Få essensen på sekunder." />
          <Card title="Flashcards" desc="Bygg kort og lær med smart repetisjon." />
          <Card title="Plan" desc="Oppgaver og kalender i samme oversikt." />
        </div>
      </section>

      {/* Lanseres senere */}
      <section id="later" className="wrap tighter">
        <motion.h2 
          initial={{ opacity: 0, y: 8 }} 
          whileInView={{ opacity: 1, y: 0 }} 
          viewport={{ once: true }} 
          transition={{ duration: 0.4 }}
          className="sectionTitle fancyTitle"
        >
          Lanseres senere
        </motion.h2>
        <div className="grid">
          <Card title="AI‑notater" desc="Automatisk fra forelesning, PDF og slides." />
          <Card title="AI‑flashcards" desc="Generer kort og bli testet i temaer." />
          <Card title="Studentressurser" desc="Nyttige lenker, steder og karrieredager." />
        </div>
      </section>

      {/* Om appen + motivasjon */}
      <section className="wrap tighter">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="motivationCard elegant luxuryBorder"
        >
          <div className="circleDeco" aria-hidden />
          <h2 className="sectionTitle fancy">Kort om appen</h2>
          <p className="lead">
            Vi bygger <span className="hl hl1">noteandplan</span> fordi studenter trenger ett rolig sted å jobbe.
            Mindre hopping mellom verktøy, mer <span className="hl hl2">flyt</span> – så du kan
            <span className="hl hl3"> lære</span>,<span className="hl hl4"> samarbeide</span> og <span className="hl hl5">levere</span>.
          </p>
        </motion.div>
      </section>

      <footer className="footer">© {new Date().getFullYear()} noteandplan</footer>

      {/* Global */}
      <style jsx global>{`
        :root{
          --panel:rgba(255,255,255,0.05);
          --panel-2:rgba(255,255,255,0.035);
          --border:rgba(0,0,0,0.1);
          --text:#0F172A;
          --muted:#475569;
          --accent:#22D3EE;
          --accent2:#34D399;
          --gold:#F4D24A;
          --radius:18px;
          --shadow-sm:0 8px 24px rgba(0,0,0,0.08);
          --shadow-md:0 16px 36px rgba(0,0,0,0.12);
          --shadow-lg:0 28px 64px rgba(0,0,0,0.16);
        }
        body{ margin:0; color:var(--text); font-family:Inter, ui-sans-serif, system-ui; -webkit-font-smoothing:antialiased; text-rendering:optimizeLegibility; background:none !important; }
      `}</style>

      {/* Lokal */}
      <style jsx>{`
        .page{ min-height:100svh; position:relative; overflow:hidden; }
        .wrap{ max-width:980px; margin:0 auto; padding:48px 18px; position:relative; z-index:1; }
        .wrap.tight{ padding:36px 18px; }
        .wrap.tighter{ padding:28px 18px; }

        .luxuryBorder{ position:relative; }

        .heroCard, .motivationCard{
          border:1px solid var(--border);
          background: linear-gradient(180deg, var(--panel) 0%, var(--panel-2) 100%);
          border-radius: var(--radius);
          padding:28px;
          box-shadow: var(--shadow-md);
          transition: transform .3s ease, box-shadow .3s ease;
        }
        .hoverable:hover{ transform: translateY(-6px) scale(1.015); box-shadow: var(--shadow-lg); }

        .heroHead{ display:flex; align-items:center; justify-content:center; gap:12px; }
        .brandDot{ height:22px; width:22px; border-radius:999px; background:linear-gradient(135deg, var(--accent), var(--accent2)); animation:pulse 2.8s ease-in-out infinite; box-shadow:0 0 0 6px rgba(34,211,238,0.12); }
        .title{ font-size:32px; font-weight:900; margin:0; letter-spacing:-0.02em; }
        .animatedTitle{ position:relative; }

        .dividerWrap{ display:flex; justify-content:center; margin-top:14px; }
        .dividerBar{ display:block; height:2px; width:92px; border-radius:2px; background: linear-gradient(90deg, var(--accent), var(--accent2), var(--gold)); }

        .lead{ margin-top:14px; color:var(--muted); line-height:1.65; font-size:16px; text-align:center; }

        .leadColors .kw{ font-weight:650; background-clip:text; -webkit-background-clip:text; color:transparent; }
        .kw1{ background-image: linear-gradient(90deg, #22D3EE, #38BDF8); }
        .kw2{ background-image: linear-gradient(90deg, #34D399, #86EFAC); }
        .kw3{ background-image: linear-gradient(90deg, #F59E0B, #FBBF24); }
        .kw4{ background-image: linear-gradient(90deg, #8B5CF6, #A78BFA); }

        .chips{ display:flex; gap:10px; justify-content:center; margin-top:18px; flex-wrap:wrap; }
        .chip{ padding:8px 12px; border-radius:999px; font-weight:600; font-size:12.5px; letter-spacing:.01em; color:var(--text); background:linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.05)); border:1px solid var(--border); box-shadow:0 6px 18px rgba(0,0,0,.08); }

        .fancyTitle{ background:linear-gradient(90deg, var(--accent), var(--accent2)); -webkit-background-clip:text; color:transparent; }
        .sectionTitle{ font-size:20px; font-weight:800; margin-bottom:18px; text-align:center; }

        .grid{ display:grid; gap:14px; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); }
        .card{ border:1px solid var(--border); background:linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03)); border-radius:16px; padding:16px; box-shadow: var(--shadow-sm); text-align:center; transition: transform .28s ease, box-shadow .28s ease; }
        .card:hover{ transform:translateY(-4px) scale(1.01); box-shadow: var(--shadow-md); }
        .card h3{ margin:0; font-size:16px; font-weight:800; color:var(--text); }
        .card p{ margin-top:7px; font-size:14px; color:var(--muted); }

        .motivationCard.elegant{ text-align:center; position:relative; overflow:hidden; padding:34px; }
        .motivationCard.elegant h2{ font-size:22px; font-weight:800; margin-bottom:14px; background:linear-gradient(90deg,var(--accent),var(--accent2)); -webkit-background-clip:text; color:transparent; }
        .motivationCard.elegant p{ font-size:16px; line-height:1.7; color:var(--muted); max-width:660px; margin:0 auto; }
        .hl{ font-weight:700; }
        .hl1{ color:#22D3EE; }
        .hl2{ color:#34D399; }
        .hl3{ color:#F59E0B; }
        .hl4{ color:#8B5CF6; }
        .hl5{ color:#EC4899; }

        .footer{ border-top:1px solid var(--border); text-align:center; color:rgba(100,116,139,0.9); font-size:12.5px; padding:18px; margin-top:14px; }
      `}</style>
    </main>
  );
}

function Card({ title, desc }: { title: string; desc: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.38 }}
      className="card"
      role="article"
      aria-label={title}
    >
      <h3>{title}</h3>
      <p>{desc}</p>
    </motion.div>
  );
}
