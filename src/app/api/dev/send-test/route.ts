import { NextResponse } from "next/server";

import { sendMail } from "@/lib/email";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const to = url.searchParams.get("to");
  if (!to) {
    return NextResponse.json({ ok: false, error: "Mangler ?to=email" }, { status: 400 });
  }
  const id = await sendMail({
    to,
    subject: "StudyBuddy testmail",
    html: "<p>Dette er en testmail fra StudyBuddy.</p>",
  });
  return NextResponse.json({ ok: true, messageId: id });
}
