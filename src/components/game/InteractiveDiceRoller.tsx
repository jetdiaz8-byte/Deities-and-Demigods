"use client";

import { Dices } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { rollD20 } from "@/lib/systems/dice";
import type { DiceResult } from "@/lib/types/gameTypes";

export function InteractiveDiceRoller() {
  const [roll, setRoll] = useState<DiceResult | null>(null);
  return (
    <div className="grimoire-panel flex items-center justify-between gap-4 p-4">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-gold)]">Dice of Fate</p>
        <p className="font-title text-2xl text-[var(--text-ivory)]">{roll ? `${roll.raw} (${roll.outcome})` : "d20 waits"}</p>
      </div>
      <Button onClick={() => setRoll(rollD20(0, 10))}><Dices size={18} /> Roll</Button>
    </div>
  );
}
