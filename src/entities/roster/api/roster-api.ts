import { supabase } from '@shared/api/supabase'
import { ConflictError } from '@shared/lib/errors'
import type { Roster, RosterDetail, RosterListItem, RosterSlot, SlotInput } from '../model/types'

export { ConflictError }

const OWNER = 'owner:profiles(email)'

// 뷰(v_rosters)는 embed 불가(프로젝트 공통 제약) → 베이스 테이블 + soft-delete 필터로 조회.

export async function listRosters(scope: 'mine' | 'all', userId: string | null): Promise<RosterListItem[]> {
  let q = supabase
    .from('rosters')
    .select(`*, ${OWNER}, roster_players(count)`)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
  if (scope === 'mine' && userId) q = q.eq('user_id', userId)
  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as unknown as RosterListItem[]
}

export async function getRoster(id: string): Promise<RosterDetail> {
  const { data, error } = await supabase
    .from('rosters')
    .select(`*, ${OWNER}, roster_players(*, batter:batters(*), prospect:roster_prospects(*)), roster_growth(*), roster_prospects(*)`)
    .eq('id', id)
    .is('deleted_at', null)
    .single()
  if (error) throw error
  return data as unknown as RosterDetail
}

export async function createRoster(name: string): Promise<Roster> {
  const { data, error } = await supabase.from('rosters').insert({ name }).select().single()
  if (error) throw error
  return data as Roster
}

/** 낙관적 락: version 일치할 때만 갱신(이름·메모). 라인업 변경도 version 을 올리므로 실패 시 refetch. */
export async function updateRoster(id: string, patch: Partial<Pick<Roster, 'name' | 'memo'>>, version: number): Promise<Roster> {
  const { data, error } = await supabase
    .from('rosters')
    .update(patch)
    .eq('id', id)
    .eq('version', version)
    .select()
    .single()
  if (error) {
    if (error.code === 'PGRST116') throw new ConflictError()
    throw error
  }
  return data as Roster
}

export async function softDeleteRoster(id: string): Promise<void> {
  const { error } = await supabase.from('rosters').update({ deleted_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
}

/** 팀 설정(jsonb) 저장 — 취향 노브라 낙관락 없이 마지막 쓰기 우선(소유자만 쓰므로 충돌 = 내 탭끼리) */
export async function updateTeamSettings(id: string, team_settings: unknown): Promise<void> {
  const { error } = await supabase.from('rosters').update({ team_settings }).eq('id', id)
  if (error) throw error
}

// ---------- 라인업 슬롯 ----------

export async function addSlot(input: SlotInput): Promise<void> {
  const { error } = await supabase.from('roster_players').insert(input)
  if (error) throw error
}

export async function updateSlot(id: string, patch: Partial<SlotInput>): Promise<void> {
  const { error } = await supabase.from('roster_players').update(patch).eq('id', id)
  if (error) throw error
}

/** 카드 육성 저장 — 팀 × 선수 단위 upsert (라인업 등록 여부 무관) */
export async function upsertGrowth(roster_id: string, batter_id: string, growth: unknown): Promise<void> {
  const { error } = await supabase
    .from('roster_growth')
    .upsert({ roster_id, batter_id, growth }, { onConflict: 'roster_id,batter_id' })
  if (error) throw error
}

// ---------- 유망주 (팀 단위 독립 — 라인업 등록 여부 무관) ----------

export async function createProspect(roster_id: string, data: unknown): Promise<{ id: string }> {
  const { data: row, error } = await supabase.from('roster_prospects').insert({ roster_id, data }).select('id').single()
  if (error) throw error
  return row as { id: string }
}

export async function updateProspect(id: string, data: unknown): Promise<void> {
  const { error } = await supabase.from('roster_prospects').update({ data }).eq('id', id)
  if (error) throw error
}

/** 유망주 완전 삭제 — 라인업 슬롯도 FK cascade 로 함께 제거됨 */
export async function deleteProspect(id: string): Promise<void> {
  const { error } = await supabase.from('roster_prospects').delete().eq('id', id)
  if (error) throw error
}

export async function removeSlot(id: string): Promise<void> {
  const { error } = await supabase.from('roster_players').delete().eq('id', id)
  if (error) throw error
}

/** 슬롯 일괄 변경(타순 교환·드래그 이동·포지션 맞교환) — upsert 한 요청(단일 트랜잭션).
 *  uq_lineup_order/uq_lineup_position 이 deferrable 이라 커밋 시점 검사로 통과. */
export interface SlotChange {
  slot: RosterSlot
  order?: number
  position?: RosterSlot['assigned_position']
  use_dual?: boolean
}
export async function applySlots(entries: SlotChange[]): Promise<void> {
  const rows = entries
    .map(({ slot: s, order, position, use_dual }) => ({
      id: s.id,
      roster_id: s.roster_id,
      batter_id: s.batter_id,
      // 유망주 슬롯(batter_id=null)은 prospect_id 를 반드시 함께 보내야 한다.
      // 빠지면 upsert 의 INSERT 시도 튜플에서 prospect_id 가 null 로 채워져
      // check(num_nonnulls(batter_id, prospect_id)=1) 위반 → 타순 변경 오류.
      prospect_id: s.prospect_id,
      assigned_position: position ?? s.assigned_position,
      use_dual: use_dual ?? s.use_dual,
      lineup_order: order ?? s.lineup_order,
    }))
    .filter((r, i) => {
      const s = entries[i].slot
      return r.assigned_position !== s.assigned_position || r.lineup_order !== s.lineup_order || r.use_dual !== s.use_dual
    })
  if (rows.length === 0) return
  const { error } = await supabase.from('roster_players').upsert(rows)
  if (error) throw error
}
