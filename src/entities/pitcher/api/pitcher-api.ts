import { supabase } from '@shared/api/supabase'
import { ConflictError } from '@shared/lib/errors'
import type { Pitcher, PitcherFilters, PitcherInput, PitcherPitch, PitcherWithPitches } from '../model/types'

export async function listPitchers(f: PitcherFilters): Promise<{ items: Pitcher[]; total: number }> {
  const page = f.page ?? 0
  const size = f.size ?? 50
  let q = supabase.from('v_pitchers').select('*', { count: 'exact' })
  if (f.league) q = q.eq('league_code', f.league)
  if (f.team) q = q.eq('team_code', f.team)
  if (f.grade) q = q.eq('grade', f.grade)
  if (f.q) q = q.ilike('name', `%${f.q}%`)
  const { data, error, count } = await q.order('name').range(page * size, page * size + size - 1)
  if (error) throw error
  return { items: (data ?? []) as Pitcher[], total: count ?? 0 }
}

/** 카드 뷰용: 목록 + 각 투수의 구종 6개를 함께 로드. (v_pitchers 는 embed 불가 → 베이스 테이블 + soft-delete 필터) */
export async function listPitchersWithPitches(
  f: PitcherFilters,
): Promise<{ items: PitcherWithPitches[]; total: number }> {
  const page = f.page ?? 0
  const size = f.size ?? 50
  let q = supabase.from('pitchers').select('*, pitcher_pitches(*)', { count: 'exact' }).is('deleted_at', null)
  if (f.league) q = q.eq('league_code', f.league)
  if (f.team) q = q.eq('team_code', f.team)
  if (f.grade) q = q.eq('grade', f.grade)
  if (f.q) q = q.ilike('name', `%${f.q}%`)
  const { data, error, count } = await q.order('name').range(page * size, page * size + size - 1)
  if (error) throw error
  return { items: (data ?? []) as PitcherWithPitches[], total: count ?? 0 }
}

/** 이름 자동완성용: 고정 신원 정보 + 특이구종(키·계열·이름). 이름별 중복 제거. */
export interface PitcherNameHit {
  name: string
  league_code: string
  team_code: string
  throw_hand: string
  bat_hand: string
  special_form: boolean
  pitcher_pitches: Pick<PitcherPitch, 'key' | 'pitch_type' | 'is_special' | 'special_name'>[]
}

export async function searchPitcherNames(q: string): Promise<PitcherNameHit[]> {
  const term = q.trim()
  if (!term) return []
  const { data, error } = await supabase
    .from('pitchers')
    .select('name, league_code, team_code, throw_hand, bat_hand, special_form, pitcher_pitches(key, pitch_type, is_special, special_name)')
    .is('deleted_at', null)
    .ilike('name', `%${term}%`)
    .order('name')
    .limit(50)
  if (error) throw error
  const seen = new Set<string>()
  const out: PitcherNameHit[] = []
  for (const r of (data ?? []) as PitcherNameHit[]) {
    if (!seen.has(r.name)) {
      seen.add(r.name)
      out.push(r)
    }
  }
  return out
}

export async function getPitcher(id: string): Promise<PitcherWithPitches> {
  const { data, error } = await supabase.from('pitchers').select('*, pitcher_pitches(*)').eq('id', id).single()
  if (error) throw error
  return data as PitcherWithPitches
}

async function replacePitches(pitcherId: string, pitches: PitcherPitch[]) {
  await supabase.from('pitcher_pitches').delete().eq('pitcher_id', pitcherId)
  if (pitches.length) {
    const rows = pitches.map((p) => ({
      pitcher_id: pitcherId,
      key: p.key,
      pitch_type: p.pitch_type,
      value: p.value,
      is_special: p.is_special,
      special_name: p.special_name,
    }))
    const { error } = await supabase.from('pitcher_pitches').insert(rows)
    if (error) throw error
  }
}

export async function createPitcher(input: PitcherInput, pitches: PitcherPitch[]): Promise<Pitcher> {
  const { data, error } = await supabase.from('pitchers').insert(input).select().single()
  if (error) throw error
  const pitcher = data as Pitcher
  await replacePitches(pitcher.id, pitches) // ⚠️ 비원자적: 실제 운영은 RPC(단일 트랜잭션) 권장
  return pitcher
}

export async function updatePitcher(
  id: string,
  patch: Partial<PitcherInput>,
  version: number,
  pitches: PitcherPitch[],
): Promise<Pitcher> {
  const { data, error } = await supabase
    .from('pitchers')
    .update(patch)
    .eq('id', id)
    .eq('version', version)
    .select()
    .single()
  if (error) {
    if (error.code === 'PGRST116') throw new ConflictError()
    throw error
  }
  await replacePitches(id, pitches)
  return data as Pitcher
}

export async function softDeletePitcher(id: string): Promise<void> {
  const { error } = await supabase.from('pitchers').update({ deleted_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
}
