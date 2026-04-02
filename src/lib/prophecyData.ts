// Prophecy System - 9 Prophecies with Gaiman-style riddles
// Each prophecy is hidden from the player - they see only the cryptic riddle
// Prophecies can transfer on PC death, with different manifestations

export interface Prophecy {
  id: number // 1-9
  name: string // Internal name
  theme: string // Core theme
  riddle: string // Gaiman-style cryptic text shown to player
  act1_hint: string // How DM should foreshadow in Act I
  act2_manifestation: string // How it shows in Act II
  act3_resolution: string // Possible outcomes in Act III
  transfer_note: string // How the prophecy changes when transferred to new PC
}

export const PROPHECIES: Prophecy[] = [
  {
    id: 1,
    name: "The Bearer's Burden",
    theme: "Sacrifice",
    riddle: `The shard will demand what you cannot give. It whispers to you in the space between heartbeats, shows you futures where you are whole and futures where you are nothing, and it does not tell you which is the gift and which is the price. You will be asked to choose. The choice will feel like freedom. It will not be freedom. It will be the moment you understand that some burdens can only be carried by those strong enough to break beneath them.`,
    act1_hint: "Shard whispers secrets only to this PC. Dreams of the antagonist's true form. The shard feels warmer in their hands than anyone else's.",
    act2_manifestation: "PC learns the shard's true cost: using it fully means their death. The weight of this knowledge affects their decisions.",
    act3_resolution: "PC must choose: sacrifice themselves to defeat the antagonist, or find another way that may cost everything else.",
    transfer_note: "The new bearer feels the weight immediately - heavier than before, as if the shard remembers what it lost."
  },
  {
    id: 2,
    name: "The Bloodline Awakens",
    theme: "Heritage",
    riddle: `Your blood remembers what your mind forgot. There is a reason the old stories speak of you, a reason the gods pause when you enter a room, a reason your mother never told you who your father truly was. The truth is not a secret kept from you. It is a secret kept FROM you, by people who loved you enough to lie. When the truth comes, and it will come, you will have to decide whether to thank them or forgive them. Those are not the same thing.`,
    act1_hint: "NPC gods recognize them as 'kin.' Strange abilities manifest under stress. Other PCs notice this PC gets different treatment from divine NPCs.",
    act2_manifestation: "Ancestral power manifests as a unique ability. Related gods offer aid. PC learns the identity of their divine parent.",
    act3_resolution: "PC's bloodline proves essential to weakening the antagonist - divine right matters. May be related to the antagonist.",
    transfer_note: "The bloodline was never about blood. The new inheritor discovers they were adopted into destiny, not born to it."
  },
  {
    id: 3,
    name: "The Betrayer's Path",
    theme: "Treachery and Redemption",
    riddle: `You have stood on both sides of every war. The lion's skin was not your first murder, and the poison was not your last betrayal. When the shadow rises, you will remember what you were before they called you hero. The question is not whether you will betray. The question is who. And when. And whether, in the moment when betrayal would save everything you love, you will discover that was the test all along.`,
    act1_hint: "Visions of betrayal. Past lives show them as the antagonist's ally. Other PCs have uneasy feelings around this PC.",
    act2_manifestation: "PC struggles with dark impulses. The antagonist tempts them directly. Must resist or succumb to their darker nature.",
    act3_resolution: "PC can betray the party OR redeem themselves by turning on the antagonist at a crucial moment. Both paths are valid.",
    transfer_note: "The new holder feels the weight of the previous betrayals - not their own, but carried nonetheless."
  },
  {
    id: 4,
    name: "The Deathless One",
    theme: "Reincarnation",
    riddle: `Each morning, you wake and do not remember dying. This is a kindness the world has given you, and it is also a prison. You have died eleven times. You remember none of them. Each death erases the memory and leaves only the weight. The shard you carry has been counting. It is patient. It is waiting for the death that finally sticks. When that death comes, you will understand why you were given so many chances to get it right.`,
    act1_hint: "PC cannot remember deaths. Wakes after fatal wounds with no memory. Other PCs may witness them die and be confused when they're fine.",
    act2_manifestation: "PC discovers they've died multiple times - each death erases memory. They find evidence of their own corpses, their own funerals.",
    act3_resolution: "Final death is permanent. Must break the cycle by confronting what they were before, or accept the sacrifice of their final death.",
    transfer_note: "The new inheritor receives all the accumulated memories at once - eleven deaths in a single moment. This may break them."
  },
  {
    id: 5,
    name: "The Oracle's Choice",
    theme: "Free Will vs Fate",
    riddle: `All roads lead to the same mountain. You have seen it in dreams, in tea leaves, in the patterns of birds across the sky, and no matter which way you turn, the mountain grows larger. You can change the small things - what you eat, who you love, which hand you use to open doors. But the destination is written in a language older than choice, and the ink was dry before you were born. The only question the oracle cannot answer is whether you will walk willingly or be dragged.`,
    act1_hint: "PC receives visions of possible futures. All show the same endpoint. Can make small changes but not alter the destination.",
    act2_manifestation: "Choices narrow. PC can see the consequences of actions before taking them, but cannot change the ultimate outcome.",
    act3_resolution: "Must choose between two equally terrible outcomes - the prophecy demands one. Free will is choosing which tragedy to embrace.",
    transfer_note: "The new holder sees not just the future, but the futures that were - all the paths the previous holders tried and failed."
  },
  {
    id: 6,
    name: "The Nameless One",
    theme: "Identity",
    riddle: `You have always been between things. Half-this, half-that, never quite belonging anywhere enough to have a shape of your own. But there is a truth beneath the in-between that weighs more than either half: there was nothing before the shard found you. No mother. No father. No memory older than the moment it touched your skin. You are a piece of something that chose to forget it was whole. The question is not who you are. The question is whether you want to remember.`,
    act1_hint: "PC has no memory before the shard. Name feels wrong. The shard feels more like home than anything else.",
    act2_manifestation: "PC realizes they ARE a fragment of the antagonist - the lost piece that contains what the antagonist gave up.",
    act3_resolution: "PC can rejoin the antagonist (becoming whole, powerful, and lost) or remain separate (both weakened, but independent).",
    transfer_note: "The new holder realizes they were always meant to be the vessel - the previous holder was just keeping the fragment safe."
  },
  {
    id: 7,
    name: "The Last Defender",
    theme: "Protection",
    riddle: `You will save everyone except yourself. This is not a curse, though it will feel like one. It is a choice you have already made, in a moment you do not remember, for reasons that seemed noble at the time. The ones you protect will grow strong. The ones you shield will become heroes. And when the final moment comes, you will stand between the darkness and the light, and you will discover that the shield you became was never meant to survive the blow it was shaped to take.`,
    act1_hint: "PC feels compelled to protect others, sometimes at the cost of victory. Takes hits meant for allies without thinking.",
    act2_manifestation: "Protective instincts make them hesitate at crucial moments. Cannot bear to let others sacrifice themselves.",
    act3_resolution: "Must choose between saving the party or defeating the antagonist - cannot do both. The shield must break.",
    transfer_note: "The new defender carries the memory of every person the previous defender saved - a weight of gratitude that feels like guilt."
  },
  {
    id: 8,
    name: "The Unwritten",
    theme: "Defiance",
    riddle: `The prophecy is empty. You have looked for your destiny in the stars, in the cards, in the words of every oracle from here to the edge of the world, and found nothing. No words. No path. No destination written in the language of fate. This is not an error. This is not silence. This is the blank page, and you are the pen. You are the only one who can surprise the storyteller. You are the only one whose actions cannot be predicted. You are the unwritten, and the unwritten can become anything.`,
    act1_hint: "No visions. No guidance. Just silence. Other prophecies reference 'the one without destiny.' The antagonist cannot predict this PC.",
    act2_manifestation: "PC's actions consistently surprise both allies and enemies. Fate seems to bend around them. Predictions fail when they involve this PC.",
    act3_resolution: "PC is the wildcard. Their actions cannot be foreseen. They can break any prophecy - including their own empty one.",
    transfer_note: "The unwritten cannot be transferred - it simply ends. The new holder receives a NEW prophecy roll, not the unwritten."
  },
  {
    id: 9,
    name: "The Chosen One",
    theme: "Misdirection",
    riddle: `The old texts speak of one who will bring balance. The gods whisper your name. The shard burns bright in your hand, brighter than it does for anyone else. Everyone believes - you believe - that you are the answer to the prophecy. The chosen one. The hero foretold. But prophecies are written by the victors, and the victors have been lying since before language. You are not the chosen one. You are the precursor. The one who prepares the way. When the moment comes, you will understand: your destiny was never to win. It was to make winning possible for someone else.`,
    act1_hint: "PC is treated as special by DM narration - favored by gods, lucky rolls, NPC prophecies point to them. The 'chosen one' narrative builds.",
    act2_manifestation: "PC believes deeply in their destiny. Everything seems to confirm it. But small inconsistencies appear - prophecies that don't quite fit.",
    act3_resolution: "Twist reveal: PC was the setup, not the payoff. Must choose: accept sacrifice or deny destiny (breaks prophecy, unknown consequences).",
    transfer_note: "If the 'Chosen One' PC dies, the prophecy transfers - but the new PC becomes the TRUE chosen one, and the dead PC is retroactively revealed as the precursor. 'They weren't the chosen one. YOU are.'"
  }
]

// Roll for a random prophecy (d9)
export const rollProphecy = (): Prophecy => {
  const roll = Math.floor(Math.random() * 9) + 1
  return PROPHECIES.find(p => p.id === roll) || PROPHECIES[0]
}

// Roll for a single prophecy (alias for rollProphecy)
export const rollSingleProphecy = rollProphecy

// Roll for multiple prophecies (for party)
export const rollProphecies = (count: number): Prophecy[] => {
  const rolled: Prophecy[] = []
  const available = [...PROPHECIES]
  
  for (let i = 0; i < count && available.length > 0; i++) {
    const index = Math.floor(Math.random() * available.length)
    rolled.push(available[index])
    // Don't remove - allow duplicates for larger parties
    // But mark duplicates as "echoes" (same prophecy, different interpretation)
    if (available.length > 1) {
      available.splice(index, 1)
    }
  }
  
  return rolled
}

// Get prophecy by ID
export const getProphecyById = (id: number): Prophecy | undefined => {
  return PROPHECIES.find(p => p.id === id)
}

// Get prophecy name (for internal use, not shown to player)
export const getProphecyName = (id: number): string => {
  return PROPHECIES.find(p => p.id === id)?.name || 'Unknown Prophecy'
}
// Build timestamp: 2026-03-30T06:40:26Z
