"use client";

import type { Character } from "@/lib/types/gameTypes";
import { PortraitImage } from "@/components/game/PortraitImage";
import { cn } from "@/lib/utils";

export function CharacterCard({ character, selected, onSelect }: { character: Character; selected?: boolean; onSelect?: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "fantasy-card group relative grid min-h-[22rem] grid-rows-[auto_1fr] overflow-hidden border text-left transition",
        selected ? "border-[#e0c060] shadow-[0_0_28px_rgba(201,168,76,0.24)]" : "border-[var(--border-leather)] hover:border-[var(--border-gold)]"
      )}
    >
      <div className="p-4 pb-0">
        <PortraitImage character={character} className="portrait-frame h-48 w-full opacity-90 transition group-hover:opacity-100" />
      </div>
      <div className="space-y-2 p-4">
        <div>
          <h3 className="font-title text-lg text-[var(--text-ivory)]">{character.name}</h3>
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-gold)]">{character.title}</p>
        </div>
        <p className="line-clamp-3 text-sm text-[var(--text-parchment)]">{character.description}</p>
        <div className="flex flex-wrap gap-2 text-xs text-[var(--text-muted)]">
          {[character.pantheon, character.align, `HP ${character.maxHp}`, `AC ${character.ac}`].map((label) => (
            <span key={label} className="border border-[#4d3218] bg-black/20 px-2 py-1">{label}</span>
          ))}
        </div>
      </div>
    </button>
  );
}
