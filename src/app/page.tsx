'use client'

import dynamic from 'next/dynamic'
 ab1f1d96776be46a7e06740f946d9e7822458cc0

// Skip SSR prerender entirely — useGameEngine needs browser APIs (localStorage, speechSynthesis, etc.)
// This eliminates all SSR crash classes: no mounted guards, no ?? {} fallbacks, no safeGS needed.
const MythworldEngine = dynamic(() => import('./MythworldPage'), { ssr: false })

export default function Page() {
  return <MythworldEngine />
}
