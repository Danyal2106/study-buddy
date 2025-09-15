import { NextResponse } from "next/server";

import { clearSessionCookie, deleteSession, readSessionFromCookies } from "@/lib/session";

export const runtime = "nodejs";

// POST: API-klienter / fetch
export async function POST() {
  const sess = await readSessionFromCookies();
  if (sess) deleteSession(sess.token);
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}

// GET: gjør det lett å logge ut via <a href="/api/logout">
export async function GET(req: Request) {
  const sess = await readSessionFromCookies();
  if (sess) deleteSession(sess.token);
  await clearSessionCookie();
  return NextResponse.redirect(new URL("/", req.url));
}
