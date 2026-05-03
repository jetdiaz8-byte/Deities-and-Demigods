import { NextRequest, NextResponse } from "next/server";
import { MODEL_FALLBACK_CHAIN } from "@/lib/prompts/dmSystemPrompt";

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "OPENROUTER_API_KEY is not configured" }, { status: 500 });
  const body = (await req.json()) as { messages?: unknown[]; model?: string };
  const model = body.model ?? MODEL_FALLBACK_CHAIN[0];
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
      "X-Title": "Deities and Demigods"
    },
    body: JSON.stringify({
      model,
      messages: body.messages ?? [],
      max_tokens: 4000
    })
  });
  const data = await response.json();
  if (!response.ok) return NextResponse.json(data, { status: response.status });
  return NextResponse.json({
    content: data.choices?.[0]?.message?.content ?? "",
    model,
    usage: data.usage
  });
}
