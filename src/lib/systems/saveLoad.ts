import type { GameState } from "@/lib/types/gameTypes";

const KEY = "ddg-save-v1";

export function saveGame(state: GameState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(state));
}

export function loadGame(): GameState | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as GameState;
  } catch {
    return null;
  }
}

export function clearSave() {
  if (typeof window !== "undefined") window.localStorage.removeItem(KEY);
}
