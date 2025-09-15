import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { createSession, setSessionCookie } from "@/lib/session";
import db from "@/lib/db";

export const runtime = "nodejs";

const schema = z.object({
  userId: z.number().int(),
  code: z.string().min(6).max(6),
});

export async function POST(req: Request) {
  try {
    const { userId, code } = schema.parse(await req.json());

    const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(userId) as any;
    if (!user) return NextResponse.json({ ok: false, error: "Ugyldig bruker." }, { status: 404 });

    const otp = db.prepare(`
      SELECT * FROM otps
      WHERE userId = ? AND purpose = 'signup' AND consumed = 0
      ORDER BY id DESC LIMIT 1
    `).get(userId) as any;

    if (!otp) return NextResponse.json({ ok: false, error: "Fant ingen aktiv kode." }, { status: 400 });

    if (new Date(otp.expiresAt).getTime() <= Date.now()) {
      return NextResponse.json({ ok: false, error: "Koden er utløpt." }, { status: 400 });
    }

    const ok = await bcrypt.compare(code, otp.codeHash);
    if (!ok) return NextResponse.json({ ok: false, error: "Feil kode." }, { status: 400 });

    db.prepare(`UPDATE otps SET consumed = 1 WHERE id = ?`).run(otp.id);
    db.prepare(`UPDATE users SET status = 'active', activatedAt = datetime('now') WHERE id = ?`).run(userId);

    const { token, expiresAt } = createSession(userId);
    setSessionCookie(token, expiresAt);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Verifisering feilet." }, { status: 400 });
  }
}
