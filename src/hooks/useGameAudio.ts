'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { soundEvents, type SoundEvent } from '@/lib/soundEvents'

type ActName = 'act1' | 'act2' | 'act3' | 'intro'

interface AudioState {
  sfxEnabled: boolean
  ambientEnabled: boolean
  volume: number
  sfxVolume: number
  ambientVolume: number
}

const AMBIENT: Record<ActName, { baseFreq: number; harmonics: { f: number; g: number; t: OscillatorType }[]; lfoF: number; lfoD: number; noiseG: number; filtF: number; filtQ: number }> = {
  intro: { baseFreq: 55, harmonics: [{ f:55, g:.12, t:'sine' },{ f:82.5, g:.06, t:'sine' },{ f:110, g:.04, t:'triangle' }], lfoF:.15, lfoD:2, noiseG:.02, filtF:400, filtQ:1 },
  act1: { baseFreq: 48, harmonics: [{ f:48, g:.15, t:'sine' },{ f:72, g:.07, t:'sine' },{ f:96, g:.04, t:'triangle' },{ f:144, g:.02, t:'sawtooth' }], lfoF:.2, lfoD:3, noiseG:.015, filtF:300, filtQ:2 },
  act2: { baseFreq: 55, harmonics: [{ f:55, g:.12, t:'sine' },{ f:82.5, g:.08, t:'sine' },{ f:110, g:.06, t:'triangle' },{ f:165, g:.03, t:'sine' },{ f:220, g:.02, t:'triangle' }], lfoF:.3, lfoD:4, noiseG:.01, filtF:600, filtQ:1.5 },
  act3: { baseFreq: 40, harmonics: [{ f:40, g:.18, t:'sawtooth' },{ f:60, g:.10, t:'square' },{ f:80, g:.07, t:'sawtooth' },{ f:120, g:.04, t:'square' },{ f:160, g:.02, t:'sawtooth' }], lfoF:.5, lfoD:5, noiseG:.025, filtF:500, filtQ:3 },
}

export function useGameAudio() {
  const [s, setS] = useState<AudioState>({ sfxEnabled: true, ambientEnabled: false, volume: .5, sfxVolume: .7, ambientVolume: .25 })
  const ctxR = useRef<AudioContext | null>(null)
  const ambR = useRef<{ oscs: OscillatorNode[]; lfo: OscillatorNode | null; noise: AudioBufferSourceNode | null; master: GainNode | null }>({ oscs: [], lfo: null, noise: null, master: null })
  const volR = useRef(s.volume); useEffect(() => { volR.current = s.volume }, [s.volume])
  const sfxVolR = useRef(s.sfxVolume); useEffect(() => { sfxVolR.current = s.sfxVolume }, [s.sfxVolume])
  const ambVolR = useRef(s.ambientVolume); useEffect(() => { ambVolR.current = s.ambientVolume }, [s.ambientVolume])

  const getCtx = useCallback(() => {
    if (typeof window === 'undefined') return null
    if (!ctxR.current || ctxR.current.state === 'closed') {
      try { ctxR.current = new (window.AudioContext || (window as any).webkitAudioContext)() } catch { return null }
    }
    if (ctxR.current.state === 'suspended') ctxR.current.resume()
    return ctxR.current
  }, [])

  const mkReverb = useCallback((ctx: AudioContext, decay: number) => {
    const c = ctx.createConvolver(); const r = ctx.sampleRate; const len = r * decay; const buf = ctx.createBuffer(2, len, r)
    for (let ch = 0; ch < 2; ch++) { const d = buf.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random()*2-1)*Math.pow(1-i/len,2.5) }
    c.buffer = buf; return c
  }, [])

  const mkNoise = useCallback((ctx: AudioContext, dur: number, freq: number, vol: number, t: number) => {
    const len = Math.floor(ctx.sampleRate * dur); const buf = ctx.createBuffer(1, len, ctx.sampleRate); const d = buf.getChannelData(0)
    for (let i = 0; i < len; i++) d[i] = (Math.random()*2-1)
    const n = ctx.createBufferSource(); n.buffer = buf; const g = ctx.createGain()
    g.gain.setValueAtTime(.001, t); g.gain.linearRampToValueAtTime(vol, t + .03); g.gain.exponentialRampToValueAtTime(.001, t + dur)
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq; n.connect(f).connect(g).connect(ctx.destination); n.start(t); n.stop(t + dur)
  }, [])

  const playDiceRoll = useCallback((success: boolean) => {
    if (!s.sfxEnabled) return; const ctx = getCtx(); if (!ctx) return; const vol = volR.current * sfxVolR.current; const now = ctx.currentTime
    const count = 6 + Math.floor(Math.random() * 4)
    for (let i = 0; i < count; i++) {
      const t = now + i * .06 + Math.random() * .03; mkNoise(ctx, .025, 3000 + Math.random() * 4000, .15 * vol * (1 - i/count*.5), t)
      const o = ctx.createOscillator(); o.frequency.setValueAtTime(800+Math.random()*600, t); o.frequency.exponentialRampToValueAtTime(200, t+.02)
      const g = ctx.createGain(); g.gain.setValueAtTime(.08*vol*(1-i/count*.5), t); g.gain.exponentialRampToValueAtTime(.001, t+.025)
      o.connect(g).connect(ctx.destination); o.start(t); o.stop(t+.03)
    }
    const imp = now + count*.06 + .05
    if (success) {
      [880,1320].forEach((freq, i) => { const o=ctx.createOscillator(); o.frequency.setValueAtTime(freq,imp); o.frequency.linearRampToValueAtTime(freq+440,imp+.15)
        const g=ctx.createGain(); g.gain.setValueAtTime((.2-.08*i)*vol,imp); g.gain.exponentialRampToValueAtTime(.001,imp+.4); o.connect(g).connect(ctx.destination); o.start(imp); o.stop(imp+.4) })
    } else {
      const o=ctx.createOscillator(); o.type='sine'; o.frequency.setValueAtTime(150,imp); o.frequency.exponentialRampToValueAtTime(60,imp+.3)
      const g=ctx.createGain(); g.gain.setValueAtTime(.25*vol,imp); g.gain.exponentialRampToValueAtTime(.001,imp+.35); o.connect(g).connect(ctx.destination); o.start(imp); o.stop(imp+.35)
    }
  }, [s.sfxEnabled, getCtx, mkNoise])

  const playCombatHit = useCallback((critical?: boolean) => {
    if (!s.sfxEnabled) return; const ctx = getCtx(); if (!ctx) return; const vol = volR.current * sfxVolR.current; const now = ctx.currentTime
    mkNoise(ctx, .12, 3000, (critical?.35:.22)*vol, now)
    const o=ctx.createOscillator(); o.type='sine'; o.frequency.setValueAtTime(critical?80:100,now); o.frequency.exponentialRampToValueAtTime(30,now+.2)
    const g=ctx.createGain(); g.gain.setValueAtTime((critical?.3:.2)*vol,now); g.gain.exponentialRampToValueAtTime(.001,now+.25); o.connect(g).connect(ctx.destination); o.start(now); o.stop(now+.25)
    const r=ctx.createOscillator(); r.type='triangle'; r.frequency.setValueAtTime(critical?2400:1800,now); r.frequency.exponentialRampToValueAtTime(800,now+.15)
    const rg=ctx.createGain(); rg.gain.setValueAtTime((critical?.1:.05)*vol,now); rg.gain.exponentialRampToValueAtTime(.001,now+.2); r.connect(rg).connect(ctx.destination); r.start(now); r.stop(now+.2)
  }, [s.sfxEnabled, getCtx, mkNoise])

  const playInjury = useCallback(() => {
    if (!s.sfxEnabled) return; const ctx = getCtx(); if (!ctx) return; const vol = volR.current * sfxVolR.current; const now = ctx.currentTime
    mkNoise(ctx, .15, 2000, .15*vol, now)
    const o=ctx.createOscillator(); o.frequency.setValueAtTime(60,now+.05); o.frequency.exponentialRampToValueAtTime(40,now+.3)
    const g=ctx.createGain(); g.gain.setValueAtTime(.18*vol,now+.05); g.gain.exponentialRampToValueAtTime(.001,now+.35); o.connect(g).connect(ctx.destination); o.start(now+.05); o.stop(now+.35)
  }, [s.sfxEnabled, getCtx, mkNoise])

  const playLevelUp = useCallback(() => {
    if (!s.sfxEnabled) return; const ctx = getCtx(); if (!ctx) return; const vol = volR.current * sfxVolR.current; const now = ctx.currentTime
    [440,554,659,880].forEach((f,i) => { const o=ctx.createOscillator(); o.frequency.setValueAtTime(f,now+i*.12)
      const g=ctx.createGain(); g.gain.setValueAtTime(.001,now+i*.12); g.gain.linearRampToValueAtTime(.18*vol,now+i*.12+.03); g.gain.exponentialRampToValueAtTime(.001,now+i*.12+.4); o.connect(g).connect(ctx.destination); o.start(now+i*.12); o.stop(now+i*.12+.4) })
  }, [s.sfxEnabled, getCtx])

  const playShardPulse = useCallback(() => {
    if (!s.sfxEnabled) return; const ctx = getCtx(); if (!ctx) return; const vol = volR.current * sfxVolR.current; const now = ctx.currentTime
    const rv = mkReverb(ctx, 2)
    const o=ctx.createOscillator(); o.frequency.setValueAtTime(1200,now); o.frequency.exponentialRampToValueAtTime(800,now+.6)
    const g=ctx.createGain(); g.gain.setValueAtTime(.12*vol,now); g.gain.exponentialRampToValueAtTime(.001,now+.8); o.connect(g).connect(rv).connect(ctx.destination); o.start(now); o.stop(now+.8)
  }, [s.sfxEnabled, getCtx, mkReverb])

  const playActTransition = useCallback((act: ActName) => {
    if (!s.sfxEnabled) return; const ctx = getCtx(); if (!ctx) return; const vol = volR.current * sfxVolR.current; const now = ctx.currentTime
    const notes: Record<string, number[]> = { intro:[220,330,440], act1:[165,220,330,440], act2:[220,330,440,554,660], act3:[110,165,220,330,440,550] }
    ;(notes[act]||notes.intro).forEach((f,i) => { const t=now+i*.15; const o=ctx.createOscillator(); o.type=act==='act3'?'sawtooth':'triangle'; o.frequency.setValueAtTime(f,t)
      const g=ctx.createGain(); g.gain.setValueAtTime(.001,t); g.gain.linearRampToValueAtTime(.12*vol,t+.05); g.gain.exponentialRampToValueAtTime(.001,t+.8); o.connect(g).connect(ctx.destination); o.start(t); o.stop(t+.8) })
  }, [s.sfxEnabled, getCtx])

  const playBossPhase = useCallback((phase: number) => {
    if (!s.sfxEnabled) return; const ctx = getCtx(); if (!ctx) return; const vol = volR.current * sfxVolR.current; const now = ctx.currentTime
    ;(phase===2?[220,233,311,466]:[220,277,330,415,554]).forEach((f,i) => { const t=now+i*.08; const o=ctx.createOscillator(); o.type='sawtooth'; o.frequency.setValueAtTime(f,t)
      const g=ctx.createGain(); g.gain.setValueAtTime(.001,t); g.gain.linearRampToValueAtTime(.1*vol,t+.02); g.gain.setValueAtTime(.1*vol,t+.1); g.gain.exponentialRampToValueAtTime(.001,t+.6); o.connect(g).connect(ctx.destination); o.start(t); o.stop(t+.6) })
  }, [s.sfxEnabled, getCtx])

  const playVictory = useCallback(() => {
    if (!s.sfxEnabled) return; const ctx = getCtx(); if (!ctx) return; const vol = volR.current * sfxVolR.current; const now = ctx.currentTime
    ;[[262,330,392],[294,370,440],[330,415,494],[349,440,523],[392,494,587],[523,659,784]].forEach((chord,ci) => { chord.forEach((f) => { const o=ctx.createOscillator(); o.frequency.setValueAtTime(f,now+ci*.25)
      const g=ctx.createGain(); g.gain.setValueAtTime(.001,now+ci*.25); g.gain.linearRampToValueAtTime(.08*vol,now+ci*.25+.03); g.gain.exponentialRampToValueAtTime(.001,now+ci*.25+.5); o.connect(g).connect(ctx.destination); o.start(now+ci*.25); o.stop(now+ci*.25+.5) }) })
  }, [s.sfxEnabled, getCtx])

  const playDeath = useCallback(() => {
    if (!s.sfxEnabled) return; const ctx = getCtx(); if (!ctx) return; const vol = volR.current * sfxVolR.current; const now = ctx.currentTime
    const o=ctx.createOscillator(); o.frequency.setValueAtTime(300,now); o.frequency.exponentialRampToValueAtTime(80,now+1); const g=ctx.createGain(); g.gain.setValueAtTime(.15*vol,now); g.gain.exponentialRampToValueAtTime(.001,now+1.2); o.connect(g).connect(ctx.destination); o.start(now); o.stop(now+1.2)
  }, [s.sfxEnabled, getCtx])

  const stopAmbient = useCallback(() => {
    const a = ambR.current; a.oscs.forEach(o => { try{o.stop()}catch{} }); a.oscs=[]
    if (a.lfo) try{a.lfo.stop()}catch{}; a.lfo=null
    if (a.noise) try{a.noise.stop()}catch{}; a.noise=null
    if (a.master) try{a.master.disconnect()}catch{}; a.master=null
  }, [])

  const startAmbient = useCallback((act: ActName) => {
    const ctx = getCtx(); if (!ctx) return; stopAmbient(); const cfg = AMBIENT[act]; const vol = volR.current * ambVolR.current
    const master = ctx.createGain(); master.gain.setValueAtTime(.001, ctx.currentTime); master.gain.linearRampToValueAtTime(vol, ctx.currentTime + 2)
    const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = cfg.filtF; filter.Q.value = cfg.filtQ
    const reverb = mkReverb(ctx, act === 'act3' ? 2 : act === 'act1' ? 4 : 3)
    const oscs: OscillatorNode[] = []
    cfg.harmonics.forEach(h => { const o=ctx.createOscillator(); o.type=h.t; o.frequency.value=h.f; const g=ctx.createGain(); g.gain.value=h.g; o.connect(g); g.connect(filter); o.start(); oscs.push(o) })
    const lfo=ctx.createOscillator(); lfo.type='sine'; lfo.frequency.value=cfg.lfoF; const lg=ctx.createGain(); lg.gain.value=cfg.lfoD; lfo.connect(lg); if(oscs.length>0)lg.connect(oscs[0].frequency); lfo.start()
    const nDur=4; const nBuf=ctx.createBuffer(1,ctx.sampleRate*nDur,ctx.sampleRate); const nD=nBuf.getChannelData(0); for(let i=0;i<nD.length;i++)nD[i]=(Math.random()*2-1)
    const noise=ctx.createBufferSource(); noise.buffer=nBuf; noise.loop=true; const nf=ctx.createBiquadFilter(); nf.type='lowpass'; nf.frequency.value=300; const ng=ctx.createGain(); ng.gain.value=cfg.noiseG; noise.connect(nf).connect(ng).connect(filter); noise.start()
    filter.connect(reverb); filter.connect(master); reverb.connect(master); master.connect(ctx.destination)
    ambR.current = { oscs, lfo, noise, master }
  }, [getCtx, stopAmbient, mkReverb])

  const transitionAmbient = useCallback((act: ActName) => {
    if (!s.ambientEnabled) return; const ctx = getCtx(); if (!ctx) return
    if (ambR.current.master) ambR.current.master.gain.linearRampToValueAtTime(.001, ctx.currentTime + 1.5)
    setTimeout(() => startAmbient(act), 1600)
  }, [s.ambientEnabled, startAmbient])

  useEffect(() => { if (ambR.current.master) { const v = volR.current*ambVolR.current; ambR.current.master.gain.linearRampToValueAtTime(v,(ctxR.current?.currentTime||0)+.5) } }, [s.volume, s.ambientVolume])

  useEffect(() => {
    const handler = (e: SoundEvent) => {
      switch(e.type) {
        case 'dice_roll': playDiceRoll(e.success); break; case 'combat_hit': playCombatHit(e.critical); break; case 'combat_miss': mkNoise(getCtx()!,.2,4000,.12*volR.current*sfxVolR.current,0); break
        case 'injury': playInjury(); break; case 'level_up': playLevelUp(); break; case 'shard_pulse': playShardPulse(); break
        case 'act_transition': playActTransition(e.act as ActName); transitionAmbient(e.act as ActName); break; case 'boss_phase': playBossPhase(e.phase); break
        case 'victory': playVictory(); break; case 'death': playDeath(); break; case 'ambient_start': startAmbient(e.act as ActName); break
        case 'ambient_stop': stopAmbient(); break; case 'ambient_transition': transitionAmbient(e.act as ActName); break
      }
    }
    return soundEvents.subscribe(handler)
  }, [playDiceRoll, playCombatHit, playInjury, playLevelUp, playShardPulse, playActTransition, playBossPhase, playVictory, playDeath, startAmbient, stopAmbient, transitionAmbient, mkNoise])

  useEffect(() => { return () => { stopAmbient(); if (ctxR.current) { ctxR.current.close(); ctxR.current=null } } }, [stopAmbient])

  return {
    sfxEnabled: s.sfxEnabled, ambientEnabled: s.ambientEnabled, volume: s.volume, sfxVolume: s.sfxVolume, ambientVolume: s.ambientVolume,
    toggleSfx: useCallback(() => setS(p => ({...p, sfxEnabled: !p.sfxEnabled})), []),
    toggleAmbient: useCallback(() => setS(p => { if (!p.ambientEnabled) stopAmbient(); return {...p, ambientEnabled: !p.ambientEnabled} }), [stopAmbient]),
    setVolume: useCallback((v: number) => setS(p => ({...p, volume: Math.max(0, Math.min(1, v))})), []),
    setSfxVolume: useCallback((v: number) => setS(p => ({...p, sfxVolume: Math.max(0, Math.min(1, v))})), []),
    setAmbientVolume: useCallback((v: number) => setS(p => ({...p, ambientVolume: Math.max(0, Math.min(1, v))})), []),
    playDiceRoll, playCombatHit, playInjury, playLevelUp, playShardPulse, playActTransition, playBossPhase, playVictory, playDeath, startAmbient, stopAmbient, transitionAmbient,
  }
}
