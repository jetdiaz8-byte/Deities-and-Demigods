// Character type definitions
// Shared between characterData.ts and krynnCharacters.ts to avoid circular imports

export interface Character {
  id: string
  name: string
  title: string
  pantheon: string
  align: string
  hp: number
  AC: number
  MR?: number
  move?: string
  attacks?: string
  abilities: string[]
  domain?: string
  symbol?: string
  personality: string
  type?: 'hero' | 'demigod' | 'lesser god' | 'greater god' | 'monster'
  category: 'greater-gods' | 'lesser-gods' | 'demigods' | 'heroes' | 'monsters' | 'krynn'
  divineRank?: 'Greater God' | 'Lesser God' | 'Demigod' | 'Hero' | 'Monster'
  str?: string
  dex?: string
  con?: string
  int?: string
  wis?: string
  cha?: string
  level?: string
  phase1?: string
  phase2?: string
  phase3?: string
}
