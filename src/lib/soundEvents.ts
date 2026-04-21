export type SoundEvent =
  | { type: 'dice_roll'; success: boolean }
  | { type: 'combat_hit'; critical?: boolean }
  | { type: 'combat_miss' }
  | { type: 'injury' }
  | { type: 'level_up' }
  | { type: 'shard_pulse' }
  | { type: 'act_transition'; act: string }
  | { type: 'boss_phase'; phase: number }
  | { type: 'victory' }
  | { type: 'death' }
  | { type: 'ui_click' }
  | { type: 'ambient_start'; act: string }
  | { type: 'ambient_stop' }
  | { type: 'ambient_transition'; act: string }

type SoundListener = (event: SoundEvent) => void
const listeners: SoundListener[] = []

export const soundEvents = {
  emit(event: SoundEvent) {
    requestAnimationFrame(() => {
      for (const listener of listeners) {
        try { listener(event) } catch {}
      }
    })
  },
  subscribe(listener: SoundListener): () => void {
    listeners.push(listener)
    return () => {
      const idx = listeners.indexOf(listener)
      if (idx >= 0) listeners.splice(idx, 1)
    }
  },
}
