"use client";

import { useState } from "react";
import type { Character } from "@/lib/types/gameTypes";

export function PortraitImage({ character, className = "" }: { character: Character; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className={`relative grid place-items-center overflow-hidden border border-[var(--border-gold)] bg-[#130805] text-[var(--text-gold)] ${className}`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_34%,rgba(215,168,58,.26),transparent_28%),linear-gradient(145deg,rgba(103,24,19,.32),transparent_56%)]" />
        <svg viewBox="0 0 120 120" className="relative h-3/4 w-3/4 drop-shadow-[0_0_14px_rgba(215,168,58,.35)]" aria-hidden="true">
          <path d="M60 8 92 30 84 88 60 112 36 88 28 30Z" fill="none" stroke="currentColor" strokeWidth="3" />
          <path d="M60 20v80M38 36l44 48M82 36 38 84" fill="none" stroke="currentColor" strokeWidth="2" opacity=".72" />
          <circle cx="60" cy="60" r="17" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M46 60c8-13 20-13 28 0-8 13-20 13-28 0Z" fill="currentColor" opacity=".32" />
        </svg>
        <span className="absolute bottom-4 max-w-[80%] truncate font-title text-sm text-[var(--text-ivory)]">{character.name}</span>
      </div>
    );
  }
  return <img src={character.portrait} alt={character.name} onError={() => setFailed(true)} className={`object-cover ${className}`} />;
}
