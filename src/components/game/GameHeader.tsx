"use client";

import { BookOpen, RotateCcw, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GameState } from "@/lib/types/gameTypes";

export function GameHeader({ state, onReset }: { state: GameState; onReset: () => void }) {
  return (
    <header className="grimoire-panel flex flex-wrap items-center justify-between gap-4 p-4">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-[var(--text-gold)]">Act {state.act.replace("act", "")} · Turn {state.turn}</p>
        <h1 className="font-title text-2xl text-[var(--text-ivory)]">{state.location.region}</h1>
        <p className="text-sm text-[var(--text-muted)]">{state.location.location}</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 border border-[var(--border-leather)] bg-black/20 px-3 py-2 text-sm">
          <Shield size={16} className="text-[var(--text-gold)]" /> Success {state.currentSuccessRate}%
        </div>
        <Button onClick={onReset}><RotateCcw size={16} /> New Saga</Button>
        <Button><BookOpen size={16} /> Codex</Button>
      </div>
    </header>
  );
}
