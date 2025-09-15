import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { firstName, lastName, email, password, plan, captchaToken } = await req.json();

    // 1) Captcha kreves
    if (!captchaToken) {
      return NextResponse.json({ ok: false, error: "Mangler captcha" }, { status: 400 });
    }

    const secret = process.env.HCAPTCHA_SECRET;
    if (!secret) {
      return NextResponse.json({ ok: false, error: "Mangler HCAPTCHA_SECRET" }, { status: 500 });
    }

    // 2) Verifiser captcha hos hCaptcha
    const verifyBody = new URLSearchParams({ secret, response: captchaToken });
    const vres = await fetch("https://hcaptcha.com/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: verifyBody,
    });
    const vjson = await vres.json();
    if (!vjson.success) {
      return NextResponse.json({ ok: false, error: "Captcha verifisering feilet" }, { status: 400 });
    }

    // 3) Din validering og oppretting (pseudo)
    if (!firstName?.trim() || !lastName?.trim()) {
      return NextResponse.json({ ok: false, error: "Fornavn/etternavn mangler" }, { status: 400 });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ ok: false, error: "Ugyldig e-post" }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ ok: false, error: "Passord for kort" }, { status: 400 });
    }

    // TODO: opprett bruker i DB, håndter plan osv.
    const userId = 123; // <- bytt til faktisk ID fra DB

    return NextResponse.json({ ok: true, userId });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Signup feilet" }, { status: 500 });
  }
}
