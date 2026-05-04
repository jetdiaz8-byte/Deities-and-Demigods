"use client";

import { useState } from "react";
import { ChoicePanel } from "@/components/game/ChoicePanel";
import { GameHeader } from "@/components/game/GameHeader";
import { GameSidebar } from "@/components/game/GameSidebar";
import { InteractiveDiceRoller } from "@/components/game/InteractiveDiceRoller";
import { NarrativePanel } from "@/components/game/NarrativePanel";
import { PartyBar } from "@/components/game/PartyBar";
import { callDM } from "@/lib/hooks/useDM";
import { useGameStore } from "@/lib/store/gameStore";
import type { DMChoice } from "@/lib/types/gameTypes";

export function GameScreen() {
  const state = useGameStore();
  const [loading, setLoading] = useState(false);

  async function choose(choice: DMChoice) {
    setLoading(true);
    const response = await callDM(state, choice.narrative);
    useGameStore.getState().applyDMResponse(response, choice.narrative);
    setLoading(false);
  }

  return (
    <main className="mythic-backdrop min-h-screen p-3 md:p-5">
      <div className="mx-auto grid max-w-[96rem] gap-4">
        <GameHeader state={state} onReset={state.resetGame} />
        <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
          <div className="grid gap-4">
            <NarrativePanel narration={state.currentNarration} loading={loading} />
            <ChoicePanel choices={state.currentChoices} disabled={loading} onChoose={choose} />
            <InteractiveDiceRoller />
            <PartyBar pcs={state.pcs} />
          </div>
          <GameSidebar state={state} />
        </div>
      </div>
    </main>
  );
}
