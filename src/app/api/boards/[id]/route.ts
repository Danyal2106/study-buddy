import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

type Params = { id: string };
type Ctx = { params: Promise<Params> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  // placeholder OK response so it compiles
  return NextResponse.json({ ok: true, data: [{ example: 'subjects for ' + id }] });
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  return NextResponse.json({ ok: true, data: { createdFor: id, body } }, { status: 201 });
}
