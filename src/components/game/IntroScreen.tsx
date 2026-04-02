'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Users, Package, ScrollText, Save, Upload } from 'lucide-react'

export interface IntroScreenProps {
  geminiKey: string
  setGeminiKey: (key: string) => void
  startNewCampaign: () => void
  saveSlots: { id: string; name: string; timestamp: number; turn: number; act: string; partyNames: string[] }[]
  setShowLoadDialog: (open: boolean) => void
}

export function IntroScreen({
  geminiKey, setGeminiKey,
  startNewCampaign,
  saveSlots,
  setShowLoadDialog,
}: IntroScreenProps) {
  return (
    <div className="min-h-screen bg-[#060403] flex flex-col items-center justify-center p-4">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700;900&family=Cinzel:wght@400;600;700&family=IM+Fell+English:ital@0;1&display=swap');
        @keyframes pulse-glow {
          0%, 100% { text-shadow: 0 0 12px rgba(200,160,60,.18); }
          50% { text-shadow: 0 0 28px rgba(200,160,60,.55); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: none; }
        }
      `}</style>

      <div className="text-center mb-8">
        <div style={{ fontSize: '3.5rem', marginBottom: '1rem', animation: 'pulse-glow 3s infinite' }}>✦</div>
        <h1 style={{ fontFamily: '"Cinzel Decorative", serif', fontSize: 'clamp(1.4rem, 2.5vw, 2rem)', color: '#f0c860', letterSpacing: '.16em', textShadow: '0 0 10px rgba(200,160,60,.2)', marginBottom: '.8rem' }}>
          DEITIES & DEMIGODS
        </h1>
        <p style={{ fontFamily: 'Cinzel, serif', fontSize: '.75rem', color: '#9a8860', letterSpacing: '.25em', textTransform: 'uppercase' }}>
          Mythworld Engine · AI-Powered D&D
        </p>
      </div>

      <Card className="w-full max-w-2xl bg-[#110d07] border-[#2e2008]">
        <CardContent className="p-6">
          <p className="text-[#9a8860] text-center mb-6 italic leading-relaxed" style={{ fontFamily: '"IM Fell English", serif' }}>
            There is an object. It has had several names. The people who found it gave it names the way people give names to things they cannot explain: carefully, with a kind of reverence that is indistinguishable from fear.
            <br /><br />
            Each time a new campaign begins, the object has a different name. Each time, the gods react differently. Each time, the heroes are different, and what they lose along the way is different.
            <br /><br />
            The gods do not play fair. The stories do not end cleanly. And sometimes, the prophecy chooses the wrong hero on purpose.
            <br /><br />
            <span className="text-[#7a5f20] not-italic text-sm" style={{ fontFamily: 'Cinzel, serif', letterSpacing: '.15em' }}>
              ✦ Created by the imagination of JeTZone2k26 ✦
            </span>
            <br />
            <span className="text-[#c9a84c] not-italic" style={{ fontFamily: 'Cinzel, serif', fontSize: '.8rem', letterSpacing: '.1em' }}>
              Enter your keys. Let the story begin.
            </span>
          </p>

          <div className="space-y-4">
            <div className="flex gap-3 items-center">
              <span className="text-[#9a8860] text-xs uppercase tracking-wider whitespace-nowrap" style={{ fontFamily: 'Cinzel, serif' }}>Gemini 2.5 Key</span>
              <Input
                type="password"
                placeholder="AIza... — aistudio.google.com"
                value={geminiKey}
                onChange={e => setGeminiKey(e.target.value)}
                className="flex-1 bg-[#110d07] border-[#2e2008] text-[#e8d9b0] placeholder:text-[#5a4d30]"
              />
              <Badge className="bg-[#0a2820] text-[#40c0a0] border-[#208060]">AI</Badge>
            </div>
          </div>

          <p className="text-[#5a4d30] text-xs text-center mt-4 italic">
            Key auto-saves to browser memory · Direct browser calls to Gemini
          </p>
          
          {/* Help Link */}
          <div className="text-center mt-4">
            <a href="/rulebook" className="text-[#40a070] text-sm hover:text-[#60e0a0] transition-colors inline-flex items-center gap-1" style={{ fontFamily: 'Cinzel, serif' }}>
              <BookOpen className="w-4 h-4" />
              How to Play (Player's Guide)
            </a>
          </div>

          <div className="flex gap-3 mt-6 justify-center flex-wrap">
            <Button
              onClick={startNewCampaign}
              disabled={!geminiKey}
              className="bg-gradient-to-b from-[#4e3300] to-[#2b1800] hover:from-[#6e4800] hover:to-[#422600] text-[#f0c860] border border-[#7a5f20] px-8 py-3"
              style={{ fontFamily: 'Cinzel, serif', letterSpacing: '.17em' }}
            >
              ⚔ Begin New Campaign ⚔
            </Button>

            {saveSlots.length > 0 && (
              <Button
                onClick={() => setShowLoadDialog(true)}
                variant="outline"
                className="border-[#5a4018] text-[#9a8860] hover:bg-[#1a1205] px-6 py-3"
                style={{ fontFamily: 'Cinzel, serif', letterSpacing: '.1em' }}
              >
                <Upload className="w-4 h-4 mr-2" /> Load Save
              </Button>
            )}
          </div>

          {/* Enhanced Features Preview */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: <Users className="w-5 h-5" />, label: 'Party Selection', desc: 'Choose your heroes' },
              { icon: <Package className="w-5 h-5" />, label: 'Inventory System', desc: 'Artifacts & potions' },
              { icon: <ScrollText className="w-5 h-5" />, label: 'Quest Tracking', desc: 'Main & side quests' },
              { icon: <Save className="w-5 h-5" />, label: 'Save/Load', desc: 'Multiple slots' }
            ].map((feature, i) => (
              <div key={i} className="text-center p-3 bg-[#181208] border border-[#2e2008] rounded">
                <div className="text-[#c9a84c] mb-1">{feature.icon}</div>
                <div className="text-xs text-[#9a8860]" style={{ fontFamily: 'Cinzel, serif' }}>{feature.label}</div>
                <div className="text-[10px] text-[#5a4d30]">{feature.desc}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
