import { NextRequest, NextResponse } from "next/server";
import { characterData } from "@/lib/gameData/characterData";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pantheon = searchParams.get("pantheon");
  const type = searchParams.get("type");
  const search = searchParams.get("search")?.toLowerCase();
  const entities = characterData.filter((entity) => {
    if (pantheon && entity.pantheon.toLowerCase() !== pantheon.toLowerCase()) return false;
    if (type && entity.type !== type && entity.category !== type) return false;
    if (search && !`${entity.name} ${entity.title} ${entity.description}`.toLowerCase().includes(search)) return false;
    return true;
  });
  return NextResponse.json(entities);
}
