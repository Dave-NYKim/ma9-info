import { supabase } from './supabase'

/** 뷰에 실제 존재하는 연도(내림차순 · null 제외)를 distinct 로 뽑음 — 연도 필터 드롭다운용.
 *  PostgREST 는 DISTINCT 미지원 → year 컬럼만 받아 클라에서 중복 제거(useSpecialPitches 와 같은 방식).
 *  ⚠️ 기본 row cap(1000) 초과 시 최신순이라 아주 오래된 연도만 누락될 수 있음. */
export async function fetchYears(view: 'v_batters' | 'v_pitchers'): Promise<number[]> {
  const { data, error } = await supabase
    .from(view)
    .select('year')
    .not('year', 'is', null)
    .order('year', { ascending: false })
  if (error) throw error
  const seen = new Set<number>()
  const out: number[] = []
  for (const r of (data ?? []) as { year: number }[]) {
    if (!seen.has(r.year)) {
      seen.add(r.year)
      out.push(r.year)
    }
  }
  return out
}
