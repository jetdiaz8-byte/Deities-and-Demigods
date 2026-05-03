import { NextRequest, NextResponse } from "next/server";
import { getCharacter } from "@/lib/gameData/characterData";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entity = getCharacter(id);
  if (!entity) return NextResponse.json({ error: "Entity not found" }, { status: 404 });
  return NextResponse.json(entity);
}
