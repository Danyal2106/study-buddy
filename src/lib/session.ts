import { cookies } from "next/headers";
import crypto from "crypto";

import db from "@/lib/db";

const COOKIE_NAME = "sb_sess";
const MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7 dager

export type SessionRow = {
  token: string;
  userId: number;
  expiresAt: string; // ISO-8601
};

function nowPlusSeconds(sec: number) {
  return new Date(Date.now() + sec * 1000);
}

export function createSession(userId: number) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = nowPlusSeconds(MAX_AGE_SEC).toISOString();

  db.prepare(
    `INSERT INTO sessions (token, userId, expiresAt) VALUES (?,?,?)`
  ).run(token, userId, expiresAt);

  return { token, expiresAt };
}

export async function setSessionCookie(token: string, expiresAtISO: string) {
  const c = await cookies(); // Next 15: cookies() er Promise
  c.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(expiresAtISO),
  });
}

export async function clearSessionCookie() {
  const c = await cookies();
  c.set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(0),
  });
}

export async function readSessionFromCookies(): Promise<SessionRow | null> {
  const c = await cookies();
  const token = c.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const row = db
    .prepare(
      `SELECT token, userId, expiresAt FROM sessions WHERE token = ?`
    )
    .get(token) as SessionRow | undefined;

  if (!row) return null;

  // Slett utløpte sesjoner
  if (new Date(row.expiresAt).getTime() <= Date.now()) {
    db.prepare(`DELETE FROM sessions WHERE token = ?`).run(token);
    // Fjern også cookie i nettleseren
    await clearSessionCookie();
    return null;
  }

  return row;
}

export function deleteSession(token: string) {
  db.prepare(`DELETE FROM sessions WHERE token = ?`).run(token);
}
