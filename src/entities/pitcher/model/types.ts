export interface PitcherPitch {
  id?: string
  pitcher_id?: string
  key: string
  pitch_type: string // 계열(base)
  value: number | null
  is_special: boolean
  special_name: string | null
}

export interface Pitcher {
  id: string
  league_code: string
  team_code: string
  grade: string
  year: number | null
  name: string
  weather: string | null
  sub_weather: string | null
  position: string
  dual_position: string | null
  throw_hand: string
  bat_hand: string
  special_form: boolean
  stamina: number | null
  control: number | null
  levelup_pitch: string | null // W/A/D/F/Z/X/C
  potential1: string | null
  potential2: string | null
  potential3: string | null
  sub_potential: string | null
  dual_potential1: string | null
  dual_potential2: string | null
  dual_potential3: string | null
  dual_sub_potential: string | null
  version: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type PitcherInput = Omit<Pitcher, 'id' | 'version' | 'created_at' | 'updated_at' | 'deleted_at'>
export interface PitcherWithPitches extends Pitcher {
  pitcher_pitches: PitcherPitch[]
}

export interface PitcherFilters {
  league?: string
  team?: string
  grade?: string
  q?: string
  page?: number
  size?: number
}
