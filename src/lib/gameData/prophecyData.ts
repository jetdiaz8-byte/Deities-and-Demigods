import type { Prophecy, Shard } from "@/lib/types/gameTypes";

export function createProphecy(shard: Shard, boundToId: string): Prophecy {
  return {
    id: `${shard.id}-prophecy`,
    text: `${shard.prophecy} When the third shadow crosses the road, ${shard.name} will demand a choice no blade can answer.`,
    boundToType: "pc",
    boundToId,
    status: "dormant",
    triggerTurn: 7,
    reward: `Unlock the deeper power of ${shard.name}.`
  };
}
