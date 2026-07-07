import { supabase } from '@shared/api/supabase'
import type { PoolPlayer, PoolAdd, PlayerHit } from '../model/types'

/** 내 풀 전체 — RLS 가 본인 것만 돌려준다. 규모가 작아 페이징 없이 클라이언트 정렬. */
export async function listPool(): Promise<PoolPlayer[]> {
  const { data, error } = await supabase
    .from('pool_players')
    .select('*, batter:batters(*), pitcher:pitchers(*)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as PoolPlayer[]
}

export async function addToPool(input: PoolAdd): Promise<void> {
  const { error } = await supabase.from('pool_players').insert(input)
  if (error) throw error
}

export async function removeFromPool(id: string): Promise<void> {
  const { error } = await supabase.from('pool_players').delete().eq('id', id)
  if (error) throw error
}

/** 풀 추가용 통합 검색(타자+투수, 이름 부분일치) */
export async function searchPlayers(q: string): Promise<PlayerHit[]> {
  const term = q.trim()
  if (!term) return []
  const cols = 'id, name, grade, team_code, year, position'
  const [b, p] = await Promise.all([
    supabase.from('v_batters').select(cols).ilike('name', `%${term}%`).order('name').limit(10),
    supabase.from('v_pitchers').select(cols).ilike('name', `%${term}%`).order('name').limit(10),
  ])
  if (b.error) throw b.error
  if (p.error) throw p.error
  return [
    ...(b.data ?? []).map((r) => ({ ...r, kind: 'batter' as const })),
    ...(p.data ?? []).map((r) => ({ ...r, kind: 'pitcher' as const })),
  ]
}
