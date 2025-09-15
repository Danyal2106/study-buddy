// src/app/api/boards/[id]/notes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { readSessionFromCookies } from "@/lib/session";
import db from "@/lib/db";

export const runtime = "nodejs";

const createSchema = z.object({
  title: z.string().trim().min(1, "Tittel kan ikke være tom").max(200),
  content: z.string().trim().min(1, "Innhold kan ikke være tomt"),
});

function parseBoardId(param: string) {
  const idNum = Number(param);
  if (!Number.isInteger(idNum) || idNum <= 0) throw new Error("Ugyldig board-id");
  return idNum;
}

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, context: Ctx) {
  const { id } = await context.params;

  const sess = await readSessionFromCookies();
  if (!sess) return NextResponse.json({ ok: false, error: "Ikke innlogget" }, { status: 401 });

  let boardId: number;
  try {
    boardId = parseBoardId(id);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
  }

  const owns = db
    .prepare(`SELECT id FROM boards WHERE id = ? AND userId = ?`)
    .get(boardId, sess.userId) as { id: number } | undefined;
  if (!owns) return NextResponse.json({ ok: false, error: "Board ikke funnet" }, { status: 404 });

  const rows = db
    .prepare(`SELECT id, title, content, createdAt FROM notes WHERE boardId = ? ORDER BY id DESC`)
    .all(boardId) as Array<{ id: number; title: string; content: string; createdAt: string }>;

  return NextResponse.json({ ok: true, data: rows });
}

export async function POST(req: NextRequest, context: Ctx) {
  const { id } = await context.params;

  const sess = await readSessionFromCookies();
  if (!sess) return NextResponse.json({ ok: false, error: "Ikke innlogget" }, { status: 401 });

  let boardId: number;
  try {
    boardId = parseBoardId(id);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
  }

  const owns = db
    .prepare(`SELECT id FROM boards WHERE id = ? AND userId = ?`)
    .get(boardId, sess.userId) as { id: number } | undefined;
  if (!owns) return NextResponse.json({ ok: false, error: "Board ikke funnet" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const { title, content } = createSchema.parse(body);

  const createdAt = new Date().toISOString();
  const info = db
    .prepare(`INSERT INTO notes (boardId, title, content, createdAt) VALUES (?,?,?,?)`)
    .run(boardId, title, content, createdAt);

  const row = db
    .prepare(`SELECT id, title, content, createdAt FROM notes WHERE id = ?`)
    .get(info.lastInsertRowid as number) as { id: number; title: string; content: string; createdAt: string };

  return NextResponse.json({ ok: true, data: row }, { status: 201 });
}
