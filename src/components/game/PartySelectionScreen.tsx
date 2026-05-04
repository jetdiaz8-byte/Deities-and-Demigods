"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { CharacterCard } from "@/components/game/CharacterCard";
import { getPlayableCharacters, pantheons } from "@/lib/gameData/characterData";

export function PartySelectionScreen({ onSelect }: { onSelect: (id: string) => void }) {
  const [pantheon, setPantheon] = useState("All");
  const [selected, setSelected] = useState<string | null>(null);
  const characters = useMemo(() => {
    const playable = getPlayableCharacters();
    return pantheon === "All" ? playable : playable.filter((character) => character.pantheon === pantheon);
  }, [pantheon]);
  return (
    <main className="mythic-backdrop min-h-screen px-4 py-6 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-[var(--text-gold)]">Choose the mortal flame</p>
            <h1 className="font-title text-4xl text-[var(--text-ivory)]">Select Your Hero</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            {["All", ...pantheons].map((name) => (
              <Button key={name} onClick={() => setPantheon(name)} className={name === pantheon ? "border-[#e0c060]" : ""}>
                {name}
              </Button>
            ))}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {characters.map((character) => (
            <CharacterCard key={character.id} character={character} selected={selected === character.id} onSelect={() => setSelected(character.id)} />
          ))}
        </div>
        <div className="sticky bottom-4 mt-6 flex justify-end">
          <Button disabled={!selected} onClick={() => selected && onSelect(selected)} className="px-6 py-3">
            Bind Fate and Begin
          </Button>
        </div>
      </div>
    </main>
  );
}
