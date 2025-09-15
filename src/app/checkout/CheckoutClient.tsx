"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Plan = "free" | "medium" | "premium";

export default function CheckoutClient(props: {
  plan: Plan;
  userId: number;
  price: number;
  firstName: string;
  lastName: string;
  email: string;
}) {
  const { plan, userId, price, firstName, lastName, email } = props;
  const router = useRouter();

  useEffect(()=>{
    if (plan === "free") router.replace("/dashboard");
    if (!userId) router.replace("/auth/signup-info");
  }, [plan, userId, router]);

  const [nameOnCard, setNameOnCard] = useState(`${firstName} ${lastName}`.trim());
  const [address, setAddress]       = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry]         = useState("");
  const [cvc, setCvc]               = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError]           = useState<string|null>(null);

  const planCopy = useMemo(() => {
    const title = plan === "premium" ? "Premium" : plan === "medium" ? "Medium" : "Basic";
    const icon = plan === "premium" ? "🤖" : plan === "medium" ? "📅" : "✨";
    const badge = plan === "premium" ? "Best verdi" : plan === "medium" ? "Populær" : undefined;
    const perks =
      plan === "premium"
        ? ["Alt i appen", "AI: oppsummer notater", "AI: generer flashcards", "Del & samarbeid", "Kalender + påminnelser"]
        : plan === "medium"
        ? ["Flashcards & Notater", "Kalender & planlegging", "Påminnelser"]
        : ["Flashcards & Notater (gratis)"];
    return { title, perks, icon, badge };
  }, [plan]);

  async function handlePay() {
    setError(null);
    if (!nameOnCard) return setError("Fyll inn navn på kortet.");
    if (cardNumber.replace(/\s/g,"").length < 12) return setError("Skriv inn et gyldig kortnummer.");
    if (!/^\d{2}\/\d{2}$/.test(expiry)) return setError("Utløpsdato må være MM/ÅÅ.");
    if (cvc.length < 3) return setError("Skriv inn en gyldig CVC.");

    try {
      setProcessing(true);
      const res = await fetch("/api/checkout", {
        method:"POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, plan, price, cardNumber, expiry, cvc, nameOnCard, address, email }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json?.error || "Betaling feilet");
      router.replace("/dashboard");
    } catch (e:any) {
      setError(e?.message || "Noe gikk galt under betalingen.");
      alert(e?.message || "Betaling feilet. Prøv igjen.");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <main style={{minHeight:"100vh", background:"#F7F3ED", display:"grid", placeItems:"center", padding:20}}>
      <div style={{width:"100%", maxWidth:760, background:"#fff", border:"1px solid #F0EFEA", borderRadius:22, padding:20}}>
        <h1 style={{margin:0}}>Betaling</h1>
        <p>Fullfør kjøpet for å aktivere kontoen</p>

        <div style={{background:"#F9FAFB", border:"1px solid #E5E7EB", borderRadius:16, padding:14, marginBottom:12}}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
            <div style={{display:"grid", gap:2}}>
              <strong>{planCopy.title}</strong>
              <span style={{color:"#6B7280"}}>Månedlig abonnement</span>
            </div>
            <strong>{price} kr/mnd</strong>
          </div>
          <div style={{marginTop:8}}>
            {planCopy.perks.map((p,i)=> <div key={i}>• {p}</div>)}
          </div>
        </div>

        <div style={{display:"grid", gap:10}}>
          <input placeholder="Kortnummer" value={cardNumber} onChange={e=>setCardNumber(e.target.value)} style={inp}/>
          <div style={{display:"flex", gap:10}}>
            <input placeholder="MM/ÅÅ" value={expiry} onChange={e=>setExpiry(e.target.value)} style={{...inp, flex:1}}/>
            <input placeholder="CVC" value={cvc} onChange={e=>setCvc(e.target.value)} style={{...inp, flex:1}}/>
          </div>
          <input placeholder="Navn på kort" value={nameOnCard} onChange={e=>setNameOnCard(e.target.value)} style={inp}/>
          <input placeholder="Fakturaadresse (valgfritt)" value={address} onChange={e=>setAddress(e.target.value)} style={inp}/>

          {error && <div style={{background:"#FDE2E1", color:"#8A1C1C", padding:"8px 10px", borderRadius:10}}>{error}</div>}

          <div style={{display:"flex", gap:10}}>
            <a href="/auth/signup-info" style={{background:"#E5E7EB", color:"#0F172A", fontWeight:800, padding:"14px", borderRadius:14, textDecoration:"none", textAlign:"center", flex:1}}>Tilbake</a>
            <button onClick={handlePay} disabled={processing} style={{background:"#111827", color:"#fff", padding:"14px", borderRadius:14, fontWeight:900, flex:1, opacity:processing?0.75:1}}>
              {processing ? "Behandler…" : `Betal ${price} kr/mnd`}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

const inp: React.CSSProperties = { border:"1px solid #E5E7EB", background:"#F6F7FA", borderRadius:14, padding:"12px" };
