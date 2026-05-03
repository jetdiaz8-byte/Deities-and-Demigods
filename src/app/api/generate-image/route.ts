import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { characterData } from "@/lib/gameData/characterData";
import { buildPortraitPrompt } from "@/lib/portraits";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { characterId?: string; prompt?: string; category?: string; size?: string };
  const character = body.characterId ? characterData.find((entry) => entry.id === body.characterId) : undefined;
  const category = body.category ?? character?.category ?? "heroes";
  const prompt = body.prompt ?? (character ? buildPortraitPrompt(character) : "");
  if (!prompt) return NextResponse.json({ error: "Missing prompt or characterId" }, { status: 400 });
  if (!character) return NextResponse.json({ prompt, image: null, url: null });

  const filePath = path.join(process.cwd(), "public", "portraits", category, `${character.id}.png`);
  try {
    await fs.access(filePath);
    return NextResponse.json({ prompt, cached: true, url: `/portraits/${category}/${character.id}.png?v=3` });
  } catch {
    return NextResponse.json({
      prompt,
      cached: false,
      url: null,
      message: "Generation endpoint is ready; run scripts/generate-portraits.ts with network/image provider access to populate static PNGs."
    });
  }
}
