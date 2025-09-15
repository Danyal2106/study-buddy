import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { createSession, setSessionCookie } from "@/lib/session";
import db from "@/lib/db";

export const runtime = "nodejs";

type Plan = "free" | "medium" | "premium";
type Status = "pending" | "active";
type UserRow = {
  id: number;
  firstName: string | null;
  lastName: string | null;
  email: string;
  passwordHash: string;
  plan: Plan;
  status: Status;
  createdAt: string;
  activatedAt?: string | null;
};

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  try {
    const { email, password } = schema.parse(await req.json());

    const user = db
      .prepare(`SELECT * FROM users WHERE email = ?`)
      .get(email) as UserRow | undefined;

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Feil brukernavn eller passord." },
        { status: 401 }
      );
    }

    if (user.status !== "active") {
      return NextResponse.json(
        { ok: false, error: "Kontoen er ikke aktivert." },
        { status: 403 }
      );
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json(
        { ok: false, error: "Feil brukernavn eller passord." },
        { status: 401 }
      );
    }

    const { token, expiresAt } = createSession(user.id);
    const res = NextResponse.json({ ok: true });
    await setSessionCookie(token, expiresAt); // viktig: await
    return res;
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Innlogging feilet" },
      { status: 400 }
    );
  }
}
