import type { Batter } from '@entities/batter'
import type { Pitcher } from '@entities/pitcher'

/** 계정 공용 후보 풀 한 행 — 중복 허용(비교 작업대). batter/pitcher 중 하나만 채워진다. */
export interface PoolPlayer {
  id: string
  user_id: string
  batter_id: string | null
  pitcher_id: string | null
  created_at: string
  batter: Batter | null
  pitcher: Pitcher | null
}

/** 풀 담기 입력 — batter_id/pitcher_id 중 하나만 채운다(DB CHECK 강제) */
export interface PoolAdd {
  batter_id?: string
  pitcher_id?: string
}

/** 풀 추가 검색 결과(타자·투수 통합) */
export interface PlayerHit {
  kind: 'batter' | 'pitcher'
  id: string
  name: string
  grade: string
  team_code: string
  year: number | null
  position: string
}
