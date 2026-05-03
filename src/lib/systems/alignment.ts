import { clamp } from "@/lib/utils";

export function alignmentTitle(lawChaos: number, goodEvil: number) {
  const law = lawChaos <= -30 ? "Lawful" : lawChaos >= 30 ? "Chaotic" : "Neutral";
  const good = goodEvil <= -30 ? "Good" : goodEvil >= 30 ? "Evil" : "Neutral";
  return law === "Neutral" && good === "Neutral" ? "True Neutral" : `${law} ${good}`;
}

export function shiftAlignment(lawChaos: number, goodEvil: number, lawChaosDelta: number, goodEvilDelta: number) {
  return {
    lawChaos: clamp(lawChaos + lawChaosDelta, -100, 100),
    goodEvil: clamp(goodEvil + goodEvilDelta, -100, 100)
  };
}
