import { create } from 'zustand'
import type { GamePhase } from '../types'

interface GameState {
  placeId: string | null
  phase: GamePhase
  prepare: (placeId: string) => void
  start: () => void
  leave: () => void
}

// Transient scene state only. Quest completion and coin rewards belong to a separate saved record.
export const useGameStore = create<GameState>((set) => ({
  placeId: null,
  phase: 'idle',
  prepare: (placeId) => set({ placeId, phase: 'ready' }),
  start: () => set(s => s.phase === 'ready' ? { phase: 'exploring' } : s),
  leave: () => set({ placeId: null, phase: 'idle' }),
}))
