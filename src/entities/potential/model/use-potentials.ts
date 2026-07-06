import { useQuery } from '@tanstack/react-query'
import { supabase } from '@shared/api/supabase'

async function names(table: 'batter_potentials' | 'pitcher_potentials'): Promise<string[]> {
  const { data, error } = await supabase.from(table).select('name').order('name')
  if (error) throw error
  return (data ?? []).map((r) => r.name as string)
}

export const useBatterPotentials = () =>
  useQuery({ queryKey: ['batter_potentials'], staleTime: Infinity, queryFn: () => names('batter_potentials') })

export const usePitcherPotentials = () =>
  useQuery({ queryKey: ['pitcher_potentials'], staleTime: Infinity, queryFn: () => names('pitcher_potentials') })

export interface SpecialPitch {
  name: string
  key: string
}

/** 특이구종은 선수 고유값이라 카탈로그 테이블이 없음.
 *  자동완성 후보는 기존 pitcher_pitches 실데이터(is_special)에서 파생. */
export const useSpecialPitches = () =>
  useQuery({
    queryKey: ['special_pitch_suggestions'],
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<SpecialPitch[]> => {
      const { data, error } = await supabase
        .from('pitcher_pitches')
        .select('key, special_name')
        .eq('is_special', true)
        .not('special_name', 'is', null)
      if (error) throw error
      const seen = new Set<string>()
      const out: SpecialPitch[] = []
      for (const r of (data ?? []) as { key: string; special_name: string }[]) {
        const id = `${r.key}:${r.special_name}`
        if (!seen.has(id)) {
          seen.add(id)
          out.push({ name: r.special_name, key: r.key })
        }
      }
      return out
    },
  })
