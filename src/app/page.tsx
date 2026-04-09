'use client'

import dynamic from 'next/dynamic'

// Skip SSR prerender entirely — useGameEngine needs browser APIs (localStorage, speechSynthesis, etc.)
// This eliminates all SSR crash classes: no mounted guards, no ?? {} fallbacks, no safeGS needed.
const MythworldEngine = dynamic(() => import('./MythworldPage'), { ssr: false })

export default function Page() {
  return <MythworldEngine />
}
