import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@shared/api/supabase'

export interface PotentialInfo {
  name: string
  description: string | null
  effect: string | null
  enhanced_effect: string | null
}

/** 잠재력 마스터 종류 → 테이블 */
export type PotentialKind = 'batter' | 'pitcher'
const TABLE: Record<PotentialKind, 'batter_potentials' | 'pitcher_potentials'> = {
  batter: 'batter_potentials',
  pitcher: 'pitcher_potentials',
}

async function fetchInfos(table: 'batter_potentials' | 'pitcher_potentials'): Promise<PotentialInfo[]> {
  const { data, error } = await supabase.from(table).select('name, description, effect, enhanced_effect').order('name')
  if (error) throw error
  return (data ?? []) as PotentialInfo[]
}

const infoQuery = (table: 'batter_potentials' | 'pitcher_potentials') =>
  ({ queryKey: [table], staleTime: Infinity, queryFn: () => fetchInfos(table) }) as const

const toNames = (rows: PotentialInfo[]) => rows.map((r) => r.name)
const toMap = (rows: PotentialInfo[]) => Object.fromEntries(rows.map((r) => [r.name, r]))

/** 마스터 전체 (관리 표용) */
export const usePotentialInfos = (kind: PotentialKind) => useQuery(infoQuery(TABLE[kind]))

/** 이름 목록 (자동완성용) — 같은 쿼리 캐시 공유 */
export const useBatterPotentials = () => useQuery({ ...infoQuery('batter_potentials'), select: toNames })
export const usePitcherPotentials = () => useQuery({ ...infoQuery('pitcher_potentials'), select: toNames })

/** 이름 → 상세(설명·효과·강화효과) 맵 (툴팁용) */
export const useBatterPotentialMap = () => useQuery({ ...infoQuery('batter_potentials'), select: toMap })
export const usePitcherPotentialMap = () => useQuery({ ...infoQuery('pitcher_potentials'), select: toMap })

/* ---------- 마스터 CRUD (editor 전용 — RLS로 강제) ---------- */

export function useCreatePotential(kind: PotentialKind) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (info: PotentialInfo) => {
      const { error } = await supabase.from(TABLE[kind]).insert(info)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [TABLE[kind]] }),
  })
}

/** name(PK) 기준 부분 수정 — patch 에 name 을 넣으면 이름 변경(선수 쪽은 텍스트 참조라 따로 안 바뀜 주의) */
export function useUpdatePotential(kind: PotentialKind) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ name, patch }: { name: string; patch: Partial<PotentialInfo> }) => {
      const { error } = await supabase.from(TABLE[kind]).update(patch).eq('name', name)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [TABLE[kind]] }),
  })
}

export function useDeletePotential(kind: PotentialKind) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase.from(TABLE[kind]).delete().eq('name', name)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [TABLE[kind]] }),
  })
}

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
