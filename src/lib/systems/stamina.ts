import { clamp } from "@/lib/utils";

export function maxStamina(con: number, level: number) {
  return 8 + Math.floor(con / 2) + Math.ceil(level / 2);
}

export function useStamina(current: number, amount: number) {
  return clamp(current - amount, 0, current);
}

export function regenerateStamina(current: number, max: number) {
  return clamp(current + 2, 0, max);
}
