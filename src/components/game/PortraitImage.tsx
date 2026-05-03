"use client";

import { useState } from "react";
import type { Character } from "@/lib/types/gameTypes";

export function PortraitImage({ character, className = "" }: { character: Character; className?: string }) {
  const [failed, setFailed] = useState(false);
  const initials = character.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2);
  if (failed) {
    return (
      <div className={`grid place-items-center border border-[var(--border-gold)] bg-[#181108] text-[var(--text-gold)] ${className}`}>
        <span className="font-title text-2xl">{initials}</span>
      </div>
    );
  }
  return <img src={character.portrait} alt={character.name} onError={() => setFailed(true)} className={`object-cover ${className}`} />;
}
