import assert from "node:assert/strict";
import { abilityToBonus } from "@/lib/systems/dice";
import { maxDamageToBossPerTurn, maxDamageToPCPerHit } from "@/lib/systems/combat";
import { moodFromAffinity } from "@/lib/systems/companion";
import { parseDMResponse } from "@/lib/prompts/dmSystemPrompt";

assert.equal(abilityToBonus(3), -3);
assert.equal(abilityToBonus(12), 0);
assert.equal(abilityToBonus(18), 3);
assert.equal(abilityToBonus(19), 7);
assert.equal(abilityToBonus(25), 14);

assert.equal(maxDamageToPCPerHit(100), 50);
assert.equal(maxDamageToBossPerTurn(400), 100);

assert.equal(moodFromAffinity(90), "loyal");
assert.equal(moodFromAffinity(50), "neutral");
assert.equal(moodFromAffinity(5), "frozen");

const parsed = parseDMResponse(JSON.stringify({
  dm_narration: "The old door breathed.",
  story_summary: "A door waits.",
  journey_so_far: "A shard woke.",
  pc_choices: [
    { narrative: "Kick it open ⚔", ability: "athletics", align_note: "bold" },
    { narrative: "Study the hinges 🔍", ability: "investigation", align_note: "careful" },
    { narrative: "Sing to the lock ✦", ability: "performance", align_note: "creative" }
  ]
}));

assert.equal(parsed.pc_choices.length, 3);
assert.equal(parsed.dm_narration, "The old door breathed.");

console.log("systems.test.ts passed");
