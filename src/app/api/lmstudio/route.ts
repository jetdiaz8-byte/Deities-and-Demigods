import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { messages?: unknown[] };
  const endpoint = process.env.LMSTUDIO_URL ?? "http://localhost:1234/v1";
  const model = process.env.LMSTUDIO_MODEL ?? "llama3";
  try {
    const response = await fetch(`${endpoint}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages: body.messages ?? [], max_tokens: 4000 })
    });
    const data = await response.json();
    return NextResponse.json({ content: data.choices?.[0]?.message?.content ?? "", model });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "LM Studio unavailable" }, { status: 502 });
  }
}
