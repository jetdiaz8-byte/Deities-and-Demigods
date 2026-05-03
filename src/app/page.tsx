"use client";

import { GameScreen } from "@/components/game/GameScreen";
import { IntroScreen } from "@/components/game/IntroScreen";
import { PartySelectionScreen } from "@/components/game/PartySelectionScreen";
import { useGameStore } from "@/lib/store/gameStore";

export default function Page() {
  const gamePhase = useGameStore((state) => state.gamePhase);
  const startSelection = useGameStore((state) => state.startSelection);
  const startGame = useGameStore((state) => state.startGame);

  if (gamePhase === "intro") return <IntroScreen onBegin={startSelection} />;
  if (gamePhase === "party-select") return <PartySelectionScreen onSelect={startGame} />;
  return <GameScreen />;
}
