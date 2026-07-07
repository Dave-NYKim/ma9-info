import type { Batter } from '@entities/batter'
import type { LineupPosition } from '@shared/config/roster'
import { parseProspect } from '@shared/config/prospects'

export interface Roster {
  id: string
  user_id: string
  name: string
  memo: string | null
  /** 팀 전역 설정(jsonb) — parseTeamSettings 로 읽는다 (shared/config/team-stats) */
  team_settings: unknown
  version: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

/** 목록용 — 소유자 이메일 + 라인업 인원(count 임베드) */
export interface RosterListItem extends Roster {
  owner: { email: string | null } | null
  roster_players: { count: number }[]
}

/** 유망주 — 팀 단위 독립 저장 (라인업 등록 여부 무관, 풀에서 관리). data 는 parseProspect 로 읽는다 */
export interface RosterProspectRow {
  id: string
  roster_id: string
  data: unknown
  created_at: string
}

/** 라인업 한 자리 = 한 행. 실제 카드(batter_id) 또는 유망주(prospect_id) 중 하나. */
export interface RosterSlot {
  id: string
  roster_id: string
  batter_id: string | null
  prospect_id: string | null
  assigned_position: LineupPosition
  lineup_order: number
  use_dual: boolean
  created_at: string
  batter: Batter | null
  /** prospect_id 임베드 (roster_prospects) */
  prospect: RosterProspectRow | null
}

/** 슬롯 표시 정보 — 카드/유망주 공용 (타순·야구장·요약에서 사용) */
export interface SlotView {
  isProspect: boolean
  name: string
  grade: string | null // 유망주 = null
  mainPos: string
  dualPos: string | null
  year: number | null
  team: string | null
  hands: string | null // 카드 = 우투/좌타 · 유망주 = 유형(파워/스피드)
}
export function slotView(s: Pick<RosterSlot, 'batter' | 'prospect'>): SlotView {
  if (s.batter) {
    const b = s.batter
    return {
      isProspect: false,
      name: b.name,
      grade: b.grade,
      mainPos: b.position,
      dualPos: b.dual_position,
      year: b.year,
      team: b.team_code,
      hands: `${b.throw_hand}/${b.bat_hand}`,
    }
  }
  const p = parseProspect((s.prospect as RosterProspectRow | null)?.data)
  return {
    isProspect: true,
    name: p.name,
    grade: null,
    mainPos: p.position,
    dualPos: null,
    year: null,
    team: null,
    hands: `${p.throw_hand}/${p.bat_hand}`,
  }
}

/** 카드 육성 상태 — 팀 × 선수 단위(라인업 등록 여부 무관). growth 는 parseGrowth 로 읽는다 */
export interface RosterGrowthRow {
  id: string
  roster_id: string
  batter_id: string
  growth: unknown
}

export interface RosterDetail extends Roster {
  owner: { email: string | null } | null
  roster_players: RosterSlot[]
  roster_growth: RosterGrowthRow[]
  roster_prospects: RosterProspectRow[]
}

export type SlotInput = Pick<
  RosterSlot,
  'roster_id' | 'batter_id' | 'assigned_position' | 'lineup_order' | 'use_dual'
> & { prospect_id?: string | null }

/** 배치 포지션이 카드 포지션과 맞는지 — main(기본)/dual(듀얼)/off(불일치=수비 페널티 경고) */
export type PositionFit = 'main' | 'dual' | 'off'
export function positionFit(b: Pick<Batter, 'position' | 'dual_position'> | null | undefined, pos: string): PositionFit {
  if (!b) return 'off'
  if (pos === 'DH') return 'main' // 지명타자 = 누구나 가능, 수비 페널티 없음
  if (b.position === pos) return 'main'
  if (b.dual_position === pos) return 'dual'
  return 'off'
}
