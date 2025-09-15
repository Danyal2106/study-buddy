import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import db from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const email = "test@gmail.com";
    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email) as { id: number } | undefined;
    if (!existing) {
      const hash = await bcrypt.hash("123456", 10);
      db.prepare(`
        INSERT INTO users (firstName, lastName, email, passwordHash, plan, status, createdAt, activatedAt)
        VALUES (?,?,?,?,?,?,?,?)
      `).run(
        "Test",
        "Bruker",
        email,
        hash,
        "free",          // plan
        "active",        // status
        new Date().toISOString(),
        new Date().toISOString()
      );
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Seeding feilet" }, { status: 500 });
  }
}
