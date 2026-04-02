import ZAI from 'z-ai-web-dev-sdk';
import * as fs from 'fs';

async function generateGameContent() {
  const zai = await ZAI.create();

  // System prompt for DDG 1980 expert
  const systemPrompt = `You are an expert on the TSR Deities & Demigods 1980 rulebook (Cthulhu Mythos, Melnibonéan Mythos, Nehwon Mythos, and all historical pantheons). You create content for a D&D campaign game.

IMPORTANT: Respond ONLY with valid JSON. No markdown, no code blocks, no explanation text outside the JSON.

For shard names, use creative mythological references. For injuries, reference AD&D 1st Edition rules where applicable.`;

  // Prompt for new shards
  const shardPrompt = `Create 12 NEW shard types for a D&D campaign. Each shard should be a mysterious artifact from different pantheons/mythos in the Deities & Demigods 1980 rulebook.

Existing shards (do not duplicate):
- The Pale Shard (generic)
- The First Crack (generic)
- The Splinter of Before (primordial)
- The Yggdrasil Wound (Norse)

Create shards inspired by:
- Greek/Roman mythology
- Egyptian mythology  
- Norse mythology
- Celtic mythology
- Cthulhu Mythos
- Melnibonéan Mythos (Elric's world)
- Nehwon Mythos (Lankhmar)
- Finnish mythology
- Babylonian/Sumerian mythology
- Central American mythology (Aztec/Maya)
- Indian mythology
- Chinese mythology
- Japanese mythology

For each shard, provide:
- name: Creative evocative name
- origin: 2-3 sentences of atmospheric backstory in Neil Gaiman style
- color: Hex color code (e.g., #e8e0d0)
- glow: RGBA color for glow effect (e.g., rgba(220,210,180,.6))
- pantheon: Which mythos it belongs to
- power: What type of god it favors summoning (e.g., "Favors chaotic gods", "Draws from Egyptian pantheon")

Output as JSON array: [{"name": "...", "origin": "...", "color": "...", "glow": "...", "pantheon": "...", "power": "..."}]`;

  // Prompt for expanded injuries
  const injuryPrompt = `Create an expanded injury system for AD&D 1st Edition. Include these damage types:

1. PHYSICAL injuries (cuts, bruises, breaks)
2. MAGICAL injuries (from spells, magical attacks)
3. POISON injuries (from toxins, venomous creatures)
4. PSIONIC injuries (from mental attacks - reference AD&D 1e psionics rules if applicable)

For each injury provide:
- id: lowercase_with_underscores
- name: Evocative injury name
- type: "physical" | "magic" | "poison" | "psionic"
- effect: Mechanical effect description
- modifier: Object with stat modifiers (e.g., {"attack": -1, "save": -2})
- duration: How long it lasts (turns or "permanent" until cured)
- icon: Single emoji
- cure: How it can be healed (e.g., "Cure Disease spell", "Rest 3 turns", "Antitoxin")

Create 20 injuries total:
- 8 physical
- 4 magical
- 4 poison
- 4 psionic

Output as JSON array: [{"id": "...", "name": "...", "type": "...", "effect": "...", "modifier": {...}, "duration": "...", "icon": "...", "cure": "..."}]`;

  // Prompt for item acquisition
  const itemPrompt = `Create an item acquisition system for D&D. Items should be obtainable through:

1. NPC_ENCOUNTER - Gifts, trades, rewards
2. MONSTER_DROP - Loot from defeated enemies
3. BATTLE - Found in aftermath
4. CONVERSATION - Persuasion, intimidation, diplomacy
5. PICKPOCKET - Theft (for rogues)
6. EXPLORATION - Hidden in dungeons, ruins
7. QUEST_REWARD - Completing objectives

Create 30 items total (mix of artifacts, potions, equipment, scrolls) with rarities: common, uncommon, rare, legendary.

For each item provide:
- id: lowercase_with_underscores
- name: Item name
- type: "artifact" | "potion" | "equipment" | "scroll"
- rarity: "common" | "uncommon" | "rare" | "legendary"
- effect: What it does
- modifier: Object with bonuses (e.g., {"damage": 5, "healing": 20})
- charges: Number of uses (99 for permanent)
- icon: Single emoji
- description: Flavor text
- acquisition: Array of how it can be obtained ["npc_encounter", "battle", "pickpocket", etc.]
- source: What type of entity drops it (e.g., "Greek gods", "Undead", "Any", "Rogues")

Output as JSON array`;

  // Prompt for antagonist clues
  const antagonistPrompt = `Create a clue system for revealing a hidden antagonist (greater god/goddess) throughout a 3-act campaign.

Available greater gods (antagonist could be ANY of these):
- Zeus, Odin, Loki, Cthulhu, Set, Hades, Hel, Ares, etc.

Create 24 clues (8 per act) that progressively reveal the antagonist's identity:

For each clue provide:
- id: clue_act1_01, etc.
- act: 1, 2, or 3
- clue_text: The cryptic hint text (poetic, mythological)
- reveals: What aspect it reveals (e.g., "pantheon", "alignment", "domain", "symbol", "name_fragment")
- specificity: How specific (vague, moderate, specific)
- trigger: What player action might trigger this clue

Act 1 clues should be VERY vague (just hints of shadow, power)
Act 2 clues should be MODERATE (domain, pantheon hints)
Act 3 clues should be SPECIFIC (near full reveal before final confrontation)

Output as JSON array: [{"id": "...", "act": 1, "clue_text": "...", "reveals": "...", "specificity": "...", "trigger": "..."}]`;

  console.log('Generating game content with Gemini...\n');

  // Generate shards
  console.log('1. Generating new shard types...');
  const shardCompletion = await zai.chat.completions.create({
    messages: [
      { role: 'assistant', content: systemPrompt },
      { role: 'user', content: shardPrompt }
    ],
    thinking: { type: 'disabled' }
  });
  const shards = shardCompletion.choices[0]?.message?.content;
  console.log('Shards generated!\n');

  // Generate injuries
  console.log('2. Generating expanded injury system...');
  const injuryCompletion = await zai.chat.completions.create({
    messages: [
      { role: 'assistant', content: systemPrompt },
      { role: 'user', content: injuryPrompt }
    ],
    thinking: { type: 'disabled' }
  });
  const injuries = injuryCompletion.choices[0]?.message?.content;
  console.log('Injuries generated!\n');

  // Generate items
  console.log('3. Generating item acquisition system...');
  const itemCompletion = await zai.chat.completions.create({
    messages: [
      { role: 'assistant', content: systemPrompt },
      { role: 'user', content: itemPrompt }
    ],
    thinking: { type: 'disabled' }
  });
  const items = itemCompletion.choices[0]?.message?.content;
  console.log('Items generated!\n');

  // Generate clues
  console.log('4. Generating antagonist clue system...');
  const clueCompletion = await zai.chat.completions.create({
    messages: [
      { role: 'assistant', content: systemPrompt },
      { role: 'user', content: antagonistPrompt }
    ],
    thinking: { type: 'disabled' }
  });
  const clues = clueCompletion.choices[0]?.message?.content;
  console.log('Clues generated!\n');

  // Parse and save results
  const output = {
    shards: parseJSON(shards || '[]'),
    injuries: parseJSON(injuries || '[]'),
    items: parseJSON(items || '[]'),
    clues: parseJSON(clues || '[]')
  };

  fs.writeFileSync(
    '/home/z/my-project/generated-content.json',
    JSON.stringify(output, null, 2)
  );

  console.log('Content saved to generated-content.json');
  console.log('\n=== SUMMARY ===');
  console.log(`Shards: ${output.shards.length}`);
  console.log(`Injuries: ${output.injuries.length}`);
  console.log(`Items: ${output.items.length}`);
  console.log(`Clues: ${output.clues.length}`);

  return output;
}

function parseJSON(text: string): any[] {
  try {
    // Try direct parse
    return JSON.parse(text);
  } catch (e) {
    // Try to extract JSON from text
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e2) {
        console.error('Failed to parse JSON:', text.slice(0, 200));
        return [];
      }
    }
    return [];
  }
}

generateGameContent().catch(console.error);
