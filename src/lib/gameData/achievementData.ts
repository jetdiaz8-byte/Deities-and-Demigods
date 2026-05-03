import type { Achievement } from "@/lib/types/gameTypes";

export const achievementData: Achievement[] = [
  { id: "first-step", name: "The Shard Wakes", description: "Begin a new legend.", tier: "bronze", icon: "✦", hidden: false },
  { id: "first-blood", name: "First Blood", description: "Survive the first real danger.", tier: "bronze", icon: "⚔", hidden: false },
  { id: "party-seven", name: "Seven Against Heaven", description: "Gather a full party.", tier: "silver", icon: "♜", hidden: false },
  { id: "quickening", name: "Lightning in the Bones", description: "Absorb a fallen divine power.", tier: "gold", icon: "☇", hidden: false },
  { id: "the-question", name: "The Question", description: "Reach the final moral choice.", tier: "legendary", icon: "☉", hidden: true }
];
