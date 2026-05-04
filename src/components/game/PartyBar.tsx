"use client";

import type { PlayerCharacter } from "@/lib/types/gameTypes";
import { PortraitImage } from "@/components/game/PortraitImage";

export function PartyBar({ pcs }: { pcs: PlayerCharacter[] }) {
  if (pcs.length === 0) return null;
  return (
    <section className="grimoire-panel grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
      {pcs.map((pc) => {
        const pct = Math.max(0, Math.min(100, Math.round((pc.currentHp / pc.maxHp) * 100)));
        return (
          <div key={pc.id} className="fantasy-card flex gap-3 border border-[var(--border-leather)] bg-black/20 p-3">
            <PortraitImage character={pc} className="portrait-frame h-16 w-16" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="truncate font-title text-[var(--text-ivory)]">{pc.name}</h3>
                <span className="text-xs text-[var(--text-gold)]">{pc.align}</span>
              </div>
              <div className="mt-2 h-2 border border-[#4b1d1d] bg-black">
                <div className="h-full bg-gradient-to-r from-[#6a2020] to-[#c44040]" style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-1 text-xs text-[var(--text-muted)]">HP {pc.currentHp}/{pc.maxHp} | Fate {pc.fatePoints} | STA {pc.stamina}</p>
            </div>
          </div>
        );
      })}
    </section>
  );
}
