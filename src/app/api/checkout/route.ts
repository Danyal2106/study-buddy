import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { createSession, setSessionCookie } from "@/lib/session";
import db from "@/lib/db";

export const runtime = "nodejs";

type Plan = "free" | "medium" | "premium";

const schema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  plan: z.enum(["free", "medium", "premium"]),
  price: z.number().int().min(0).optional(),
  // evt. kort-detaljer felt her, men vi simulerer betaling
});

export async function POST(req: Request) {
  try {
    const payload = schema.parse(await req.json());
    const { firstName, lastName, email, password, plan, price = 0 } = payload;

    // Finn eksisterende bruker
    const existing = db
      .prepare(`SELECT id, status FROM users WHERE email = ?`)
      .get(email) as { id: number; status: "pending" | "active" } | undefined;

    if (existing?.status === "active") {
      return NextResponse.json(
        { ok: false, error: "Bruker finnes allerede og er aktiv." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const nowISO = new Date().toISOString();

    let userId: number;

    if (!existing) {
      const info = db
        .prepare(
          `INSERT INTO users (firstName, lastName, email, passwordHash, plan, status, createdAt, activatedAt)
           VALUES (?,?,?,?,?,?,?,?)`
        )
        .run(
          firstName,
          lastName,
          email,
          passwordHash,
          plan,
          "pending",
          nowISO,
          null
        );
      userId = Number(info.lastInsertRowid);
    } else {
      // Oppdater passord og plan hvis bruker ligger som pending
      db.prepare(
        `UPDATE users SET passwordHash = ?, plan = ?, firstName = ?, lastName = ? WHERE id = ?`
      ).run(passwordHash, plan, firstName, lastName, existing.id);
      userId = existing.id;
    }

    // Simuler betaling -> lagre i payments
    const brand = "visa";
    const last4 = "4242";
    db.prepare(
      `INSERT INTO payments (userId, amount, status, brand, last4, createdAt)
       VALUES (?,?,?,?,?,?)`
    ).run(userId, price, "succeeded", brand, last4, nowISO);

    // Aktiver bruker
    db.prepare(
      `UPDATE users SET status = 'active', activatedAt = ? WHERE id = ?`
    ).run(nowISO, userId);

    // Lag sesjon + cookie
    const { token, expiresAt } = createSession(userId);
    const res = NextResponse.json({ ok: true, activated: true });
    await setSessionCookie(token, expiresAt);
    return res;
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Checkout feilet" },
      { status: 400 }
    );
  }
}
