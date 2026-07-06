export interface Batter {
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
  levelup_type1: string | null
  power: number | null
  contact: number | null
  speed: number | null
  throwing: number | null
  defense: number | null
  clutch: number | null
  levelup_type2: string | null
  potential1: string | null
  potential2: string | null
  potential3: string | null
  sub_potential: string | null
  dual_levelup_type2: string | null
  dual_potential1: string | null
  dual_potential2: string | null
  dual_potential3: string | null
  dual_sub_potential: string | null
  version: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

/** insert/update 시 보내는 필드 (서버 관리 필드 제외) */
export type BatterInput = Omit<Batter, 'id' | 'version' | 'created_at' | 'updated_at' | 'deleted_at'>

import type { AdvancedFilters } from '@shared/api/advanced-filters'

export interface BatterFilters extends AdvancedFilters {
  league?: string
  team?: string
  grade?: string
  q?: string
  /** 레벨업 1유형 (파워/컨택트) */
  levelup1?: string
  /** 레벨업 2유형 (스피드/쓰로잉/수비력) — 듀얼 2유형 포함 검색 */
  levelup2?: string
  page?: number
  size?: number
}
