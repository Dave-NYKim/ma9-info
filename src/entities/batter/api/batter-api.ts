import { supabase } from '@shared/api/supabase'
import { ConflictError } from '@shared/lib/errors'
import type { Batter, BatterInput, BatterFilters } from '../model/types'

export { ConflictError }

export async function listBatters(f: BatterFilters): Promise<{ items: Batter[]; total: number }> {
  const page = f.page ?? 0
  const size = f.size ?? 50
  let q = supabase.from('v_batters').select('*', { count: 'exact' })
  if (f.league) q = q.eq('league_code', f.league)
  if (f.team) q = q.eq('team_code', f.team)
  if (f.grade) q = q.eq('grade', f.grade)
  if (f.q) q = q.ilike('name', `%${f.q}%`)
  const { data, error, count } = await q.order('name').range(page * size, page * size + size - 1)
  if (error) throw error
  return { items: (data ?? []) as Batter[], total: count ?? 0 }
}

/** 이름 자동완성용: 같은 선수의 고정 신원 정보(카드마다 동일). 이름별 중복 제거. */
export interface BatterNameHit {
  name: string
  league_code: string
  team_code: string
  throw_hand: string
  bat_hand: string
  special_form: boolean
}

export async function searchBatterNames(q: string): Promise<BatterNameHit[]> {
  const term = q.trim()
  if (!term) return []
  const { data, error } = await supabase
    .from('v_batters')
    .select('name, league_code, team_code, throw_hand, bat_hand, special_form')
    .ilike('name', `%${term}%`)
    .order('name')
    .limit(50)
  if (error) throw error
  const seen = new Set<string>()
  const out: BatterNameHit[] = []
  for (const r of (data ?? []) as BatterNameHit[]) {
    if (!seen.has(r.name)) {
      seen.add(r.name)
      out.push(r)
    }
  }
  return out
}

export async function getBatter(id: string): Promise<Batter> {
  const { data, error } = await supabase.from('batters').select('*').eq('id', id).single()
  if (error) throw error
  return data as Batter
}

export async function createBatter(input: BatterInput): Promise<Batter> {
  const { data, error } = await supabase.from('batters').insert(input).select().single()
  if (error) throw error
  return data as Batter
}

/** 낙관적 락: version 일치할 때만 갱신. 0행이면 ConflictError. */
export async function updateBatter(id: string, patch: Partial<BatterInput>, version: number): Promise<Batter> {
  const { data, error } = await supabase
    .from('batters')
    .update(patch)
    .eq('id', id)
    .eq('version', version)
    .select()
    .single()
  if (error) {
    if (error.code === 'PGRST116') throw new ConflictError() // no rows
    throw error
  }
  return data as Batter
}

export async function softDeleteBatter(id: string): Promise<void> {
  const { error } = await supabase.from('batters').update({ deleted_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
}
