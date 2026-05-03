"use client";

import { buildDMSystem, fallbackNarration, MODEL_FALLBACK_CHAIN, parseDMResponse } from "@/lib/prompts/dmSystemPrompt";
import type { DMResponse, GameState } from "@/lib/types/gameTypes";

export async function callDM(state: GameState, playerChoice: string): Promise<DMResponse> {
  const messages = [
    { role: "system", content: buildDMSystem(state, true, state.turn === 0) },
    { role: "user", content: playerChoice }
  ];

  for (const model of MODEL_FALLBACK_CHAIN) {
    try {
      const response = await fetch("/api/openrouter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, model })
      });
      if (!response.ok) continue;
      const data = (await response.json()) as { content?: string; choices?: Array<{ message?: { content?: string } }> };
      const content = data.content ?? data.choices?.[0]?.message?.content ?? "";
      return parseDMResponse(content, state.turn === 0);
    } catch {
      // Try next model.
    }
  }

  try {
    const response = await fetch("/api/lmstudio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages })
    });
    if (response.ok) {
      const data = (await response.json()) as { content?: string };
      return parseDMResponse(data.content ?? "", state.turn === 0);
    }
  } catch {
    // Fall through to narrative fallback.
  }

  return fallbackNarration(new Error("All AI models unavailable"));
}
