"use client";

import { Gem, HeartHandshake, Skull, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getCharacter } from "@/lib/gameData/characterData";
import { getShard } from "@/lib/gameData/shardData";
import type { GameState } from "@/lib/types/gameTypes";

export function GameSidebar({ state }: { state: GameState }) {
  const shard = getShard(state.shardId);
  const companion = getCharacter(state.companionId);
  const antagonist = getCharacter(state.antagonistId);
  return (
    <aside className="grid gap-4">
      <Card className="p-5">
        <h2 className="rune-divider mb-3 font-title text-base text-[var(--text-ivory)]"><Gem size={18} /> Shard</h2>
        <p className="gold-text text-lg">{shard?.name}</p>
        <p className="mt-2 text-sm leading-6 text-[var(--text-parchment)]">{shard?.power}</p>
        <p className="mt-3 text-sm text-[var(--text-muted)]">Charges: {state.shardChargesRemaining}</p>
      </Card>
      <Card className="p-5">
        <h2 className="rune-divider mb-3 font-title text-base text-[var(--text-ivory)]"><HeartHandshake size={18} /> Companion</h2>
        <p className="gold-text text-lg">{companion?.name ?? "Unchosen"}</p>
        <p className="mt-2 text-sm text-[var(--text-parchment)]">{state.companionMood} | {state.companionAffinity}/100</p>
      </Card>
      <Card className="p-5">
        <h2 className="rune-divider mb-3 font-title text-base text-[var(--text-ivory)]"><Skull size={18} /> Antagonist</h2>
        <p className="gold-text text-lg">{state.identityRevealed ? antagonist?.name : "Hidden Power"}</p>
        <p className="mt-2 text-sm text-[var(--text-parchment)]">Phase {state.antagonistPhase} | HP {state.identityRevealed ? state.antagonistHp : "?"}</p>
      </Card>
      <Card className="p-5">
        <h2 className="rune-divider mb-3 font-title text-base text-[var(--text-ivory)]"><Trophy size={18} /> Quests</h2>
        {state.quests.length === 0 ? <p className="text-sm text-[var(--text-muted)]">No quest has dared name itself yet.</p> : state.quests.map((quest) => <p key={quest.id}>{quest.name}</p>)}
      </Card>
    </aside>
  );
}
