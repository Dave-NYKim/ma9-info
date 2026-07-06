import { create } from 'zustand'

/** 마지막으로 등록한 선수의 기본정보 — 다음 등록 폼에 미리 채움(같은 팀/등급 연속 입력 UX) */
export interface EntryBasics {
  league_code: string
  team_code: string
  grade: string
  name: string
}

interface LastEntryState {
  batter?: EntryBasics
  pitcher?: EntryBasics
  setBatter: (b: EntryBasics) => void
  setPitcher: (p: EntryBasics) => void
}

export const useLastEntryStore = create<LastEntryState>((set) => ({
  setBatter: (batter) => set({ batter }),
  setPitcher: (pitcher) => set({ pitcher }),
}))
