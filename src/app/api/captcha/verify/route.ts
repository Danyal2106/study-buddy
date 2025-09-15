import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    if (!token) {
      return NextResponse.json({ ok: false, error: "Mangler token" }, { status: 400 });
    }

    const secret = process.env.HCAPTCHA_SECRET;
    if (!secret) {
      return NextResponse.json({ ok: false, error: "Mangler HCAPTCHA_SECRET" }, { status: 500 });
    }

    const body = new URLSearchParams({ secret, response: token });

    const res = await fetch("https://hcaptcha.com/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const data = await res.json();

    if (!data.success) {
      return NextResponse.json({ ok: false, error: "Ugyldig captcha" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Captcha verifisering feilet" }, { status: 500 });
  }
}
