"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { rollAntagonist } from "@/lib/gameData/antagonistPool";
import { characterData, getCharacter, getPlayableCharacters } from "@/lib/gameData/characterData";
import { itemData } from "@/lib/gameData/itemData";
import { shardData } from "@/lib/gameData/shardData";
import { createProphecy } from "@/lib/gameData/prophecyData";
import type { DMChoice, DMResponse, GameState, InventoryItem, PlayerCharacter } from "@/lib/types/gameTypes";
import { getActForTurn } from "@/lib/systems/acts";
import { updateAffinity } from "@/lib/systems/companion";
import { calculateSuccessRate } from "@/lib/systems/successRate";
import { inferProficiencies } from "@/lib/systems/skills";
import { generateStartingAspects } from "@/lib/systems/fatePoints";
import { maxStamina } from "@/lib/systems/stamina";

function toPlayer(characterId: string, turn: number, active = false): PlayerCharacter {
  const character = getCharacter(characterId) ?? getPlayableCharacters()[0];
  const max = maxStamina(character.con, character.level);
  return {
    ...character,
    currentHp: character.maxHp,
    isActive: active,
    joinedTurn: turn,
    statusEffects: [],
    stamina: max,
    maxStamina: max,
    fatePoints: 3,
    aspects: generateStartingAspects(character),
    proficiencies: inferProficiencies(character)
  };
}

function defaultChoices(): DMChoice[] {
  return [
    { narrative: "Touch the shard before the dark decides first ✦", ability: "religion", align_note: "creative" },
    { narrative: "Study the place where destiny has cracked 🔍", ability: "investigation", align_note: "careful" },
    { narrative: "Stand and make the silence answer you ⚔", ability: "athletics", align_note: "bold" }
  ];
}

function createInitialState(): GameState {
  const shard = shardData[0];
  const antagonist = rollAntagonist();
  const base: GameState = {
    gameId: `game-${Date.now()}`,
    turn: 0,
    act: "act1",
    actPhase: 0,
    gamePhase: "intro",
    pcs: [],
    companionId: "",
    companionAffinity: 50,
    companionMood: "friendly",
    antagonistId: antagonist.id,
    antagonistHp: antagonist.maxHp,
    antagonistMaxHp: antagonist.maxHp,
    antagonistPhase: 1,
    antagonistType: antagonist.category === "monsters" ? "super-monsters" : "greater-gods",
    identityRevealed: false,
    isBanished: false,
    shardId: shard.id,
    shardChargesRemaining: 3,
    prophecies: [],
    inventory: [itemData[0] as InventoryItem],
    injuries: {},
    currentSuccessRate: 40,
    partyBonus: 0,
    prophecyBonus: 0,
    allyBonus: 0,
    inCombat: false,
    combatState: "idle",
    initiativeOrder: [],
    currentCombatantId: "",
    turnDamageAccumulator: {},
    lastDiceRoll: null,
    diceHistory: [],
    combatLog: [],
    quests: [],
    alliedGods: [],
    paragon: 0,
    renegade: 0,
    lawChaos: 0,
    goodEvil: 0,
    achievements: [],
    conversation: { history: [], storySummary: "", journeySoFar: "" },
    currentNarration: "The shard waited in the dark before anyone had a name for waiting.",
    currentChoices: defaultChoices(),
    location: { region: "The Unwritten Threshold", location: "A crack in myth" }
  };
  return { ...base, currentSuccessRate: calculateSuccessRate(base) };
}

type GameActions = {
  startSelection: () => void;
  startGame: (pcId: string) => void;
  applyDMResponse: (response: DMResponse, playerChoice?: string) => void;
  addItem: (item: InventoryItem) => void;
  damagePC: (id: string, amount: number) => void;
  healCharacter: (id: string, amount: number) => void;
  resetGame: () => void;
};

export const useGameStore = create<GameState & GameActions>()(
  persist(
    (set, get) => ({
      ...createInitialState(),
      startSelection: () => set({ gamePhase: "party-select" }),
      startGame: (pcId) => {
        const pc = getCharacter(pcId) ?? getPlayableCharacters()[0];
        const companion = getPlayableCharacters().find((candidate) => candidate.id !== pc.id && candidate.pantheon !== pc.pantheon) ?? getPlayableCharacters().find((candidate) => candidate.id !== pc.id) ?? pc;
        const antagonist = rollAntagonist(pc.pantheon);
        const shard = shardData[Math.floor(Math.random() * shardData.length)] ?? shardData[0];
        const next: Partial<GameState> = {
          gamePhase: "playing",
          pcs: [toPlayer(pc.id, 1, true)],
          companionId: companion.id,
          companionAffinity: 50,
          companionMood: "friendly",
          antagonistId: antagonist.id,
          antagonistHp: antagonist.maxHp,
          antagonistMaxHp: antagonist.maxHp,
          antagonistType: antagonist.category === "monsters" ? "super-monsters" : "greater-gods",
          shardId: shard.id,
          prophecies: [createProphecy(shard, pc.id)],
          currentNarration: `${pc.name} woke beneath a sky that looked bruised by old gods. Somewhere nearby, ${shard.name} pulsed like a buried heart.`,
          currentChoices: defaultChoices(),
          location: { region: pc.pantheon, location: "A mythic borderland" }
        };
        set((state) => ({ ...next, currentSuccessRate: calculateSuccessRate({ ...state, ...next } as GameState) }));
      },
      applyDMResponse: (response, playerChoice) => {
        set((state) => {
          const turn = state.turn + 1;
          const affinityUpdate = updateAffinity(state.companionAffinity, response.companion_affinity_delta);
          const history = [
            ...state.conversation.history,
            ...(playerChoice ? [{ role: "user" as const, content: playerChoice }] : []),
            { role: "assistant" as const, content: response.dm_narration }
          ].slice(-20);
          const next: GameState = {
            ...state,
            turn,
            act: getActForTurn(turn),
            companionAffinity: affinityUpdate.affinity,
            companionMood: affinityUpdate.mood,
            paragon: state.paragon + response.paragon_delta,
            renegade: state.renegade + response.renegade_delta,
            currentNarration: response.dm_narration,
            currentChoices: response.pc_choices,
            conversation: {
              history,
              storySummary: response.story_summary,
              journeySoFar: response.journey_so_far || state.conversation.journeySoFar
            },
            combatLog: [...state.combatLog, ...response.damage_dealt.map((entry) => String(entry.description ?? "A blow lands."))].slice(-100),
            turnDamageAccumulator: {}
          };
          return { ...next, currentSuccessRate: calculateSuccessRate(next) };
        });
      },
      addItem: (item) => set((state) => ({ inventory: [...state.inventory, item] })),
      damagePC: (id, amount) =>
        set((state) => ({
          pcs: state.pcs.map((pc) => (pc.id === id ? { ...pc, currentHp: Math.max(0, pc.currentHp - amount) } : pc))
        })),
      healCharacter: (id, amount) =>
        set((state) => ({
          pcs: state.pcs.map((pc) => (pc.id === id ? { ...pc, currentHp: Math.min(pc.maxHp, pc.currentHp + amount) } : pc))
        })),
      resetGame: () => set(createInitialState())
    }),
    {
      name: "ddg-state-v1",
      partialize: (state) => {
        const { startSelection, startGame, applyDMResponse, addItem, damagePC, healCharacter, resetGame, ...persisted } = state;
        void startSelection; void startGame; void applyDMResponse; void addItem; void damagePC; void healCharacter; void resetGame;
        return persisted;
      }
    }
  )
);

export { characterData };
