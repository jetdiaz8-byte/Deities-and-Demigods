"use client";

import { Swords, Search, Sparkles } from "lucide-react";
import type { DMChoice } from "@/lib/types/gameTypes";
import { Button } from "@/components/ui/button";

const icons = [Swords, Search, Sparkles];

export function ChoicePanel({ choices, disabled, onChoose }: { choices: DMChoice[]; disabled: boolean; onChoose: (choice: DMChoice) => void }) {
  return (
    <section className="grid gap-3">
      {choices.map((choice, index) => {
        const Icon = icons[index] ?? Sparkles;
        return (
          <Button key={`${choice.narrative}-${index}`} disabled={disabled} onClick={() => onChoose(choice)} className="min-h-16 justify-start border-[#8d5a23] bg-[#201007] p-4 text-left text-lg">
            <Icon size={20} className="shrink-0 text-[var(--text-gold)] drop-shadow-[0_0_8px_rgba(215,168,58,.55)]" />
            <span className="flex-1">{choice.narrative}</span>
            <span className="hidden text-xs text-[var(--text-muted)] md:inline">{choice.align_note}</span>
          </Button>
        );
      })}
    </section>
  );
}
