"use client";

import type { Character } from "@/lib/types/gameTypes";
import { PortraitImage } from "@/components/game/PortraitImage";
import { cn } from "@/lib/utils";

export function CharacterCard({ character, selected, onSelect }: { character: Character; selected?: boolean; onSelect?: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "group relative grid min-h-[18rem] grid-rows-[auto_1fr] border bg-[#16100a] text-left transition",
        selected ? "border-[#e0c060] shadow-[0_0_28px_rgba(201,168,76,0.24)]" : "border-[var(--border-leather)] hover:border-[var(--border-gold)]"
      )}
    >
      <PortraitImage character={character} className="h-40 w-full opacity-90 transition group-hover:opacity-100" />
      <div className="space-y-2 p-4">
        <div>
          <h3 className="font-title text-lg text-[var(--text-ivory)]">{character.name}</h3>
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-gold)]">{character.title}</p>
        </div>
        <p className="line-clamp-3 text-sm text-[var(--text-parchment)]">{character.description}</p>
        <div className="flex flex-wrap gap-2 text-xs text-[var(--text-muted)]">
          <span>{character.pantheon}</span>
          <span>{character.align}</span>
          <span>HP {character.maxHp}</span>
          <span>AC {character.ac}</span>
        </div>
      </div>
    </button>
  );
}
