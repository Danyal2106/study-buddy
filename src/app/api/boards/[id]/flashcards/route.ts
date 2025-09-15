// src/app/api/boards/[id]/flashcards/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { readSessionFromCookies } from "@/lib/session";
import db from "@/lib/db";

export const runtime = "nodejs";

const createSchema = z.object({
  question: z.string().trim().min(1, "Spørsmål kan ikke være tomt").max(300),
  answer: z.string().trim().min(1, "Svar kan ikke være tomt"),
});

function parseBoardId(param: string) {
  const idNum = Number(param);
  if (!Number.isInteger(idNum) || idNum <= 0) throw new Error("Ugyldig board-id");
  return idNum;
}

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
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
    .prepare(`SELECT id, question, answer, createdAt FROM flashcards WHERE boardId = ? ORDER BY id DESC`)
    .all(boardId) as Array<{ id: number; question: string; answer: string; createdAt: string }>;

  return NextResponse.json({ ok: true, data: rows });
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  const sess = await readSessionFromCookies();
  if (!sess) return NextResponse.json({ ok: false, error: "Ikke innlogget" }, { status: 401 });

  let boardId: number;
  try {
    boardId = parseBoardId(id);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const { question, answer } = createSchema.parse(body);

  const owns = db
    .prepare(`SELECT id FROM boards WHERE id = ? AND userId = ?`)
    .get(boardId, sess.userId) as { id: number } | undefined;
  if (!owns) return NextResponse.json({ ok: false, error: "Board ikke funnet" }, { status: 404 });

  const createdAt = new Date().toISOString();
  const info = db
    .prepare(`INSERT INTO flashcards (boardId, question, answer, createdAt) VALUES (?,?,?,?)`)
    .run(boardId, question, answer, createdAt);

  const row = db
    .prepare(`SELECT id, question, answer, createdAt FROM flashcards WHERE id = ?`)
    .get(info.lastInsertRowid as number) as { id: number; question: string; answer: string; createdAt: string };

  return NextResponse.json({ ok: true, data: row }, { status: 201 });
}
