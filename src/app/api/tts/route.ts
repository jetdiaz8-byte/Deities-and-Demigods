import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { text } = (await req.json()) as { text?: string; voice?: string };
  if (!text) return NextResponse.json({ error: "Missing text" }, { status: 400 });
  return NextResponse.json({
    text,
    enabled: process.env.EDGE_TTS_ENABLED !== "false",
    message: "Browser Speech Synthesis is the primary TTS fallback for this build."
  });
}
