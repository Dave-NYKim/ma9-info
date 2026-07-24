import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchYears } from '@shared/api/years'
import {
  createPitcher,
  getPitcher,
  listPitchers,
  listPitchersWithPitches,
  searchPitcherNames,
  softDeletePitcher,
  updatePitcher,
} from '../api/pitcher-api'
import type { PitcherFilters, PitcherInput, PitcherPitch } from './types'

export const pitcherKeys = {
  all: ['pitchers'] as const,
  list: (f: PitcherFilters) => ['pitchers', 'list', f] as const,
  one: (id: string) => ['pitchers', 'one', id] as const,
}

export const usePitchers = (f: PitcherFilters) =>
  useQuery({ queryKey: pitcherKeys.list(f), queryFn: () => listPitchers(f) })

/** 카드 뷰용: 구종 포함 목록 */
export const usePitcherCards = (f: PitcherFilters) =>
  useQuery({ queryKey: [...pitcherKeys.list(f), 'cards'], queryFn: () => listPitchersWithPitches(f) })

/** 이름 자동완성 검색 (신원 + 특이구종 자동채움용) */
export const usePitcherNameSearch = (q: string) =>
  useQuery({
    queryKey: ['pitcher_name_search', q.trim()],
    queryFn: () => searchPitcherNames(q),
    enabled: q.trim().length >= 1,
    staleTime: 60_000,
  })

export const usePitcher = (id: string | undefined) =>
  useQuery({ queryKey: pitcherKeys.one(id ?? ''), queryFn: () => getPitcher(id as string), enabled: !!id })

/** 필터용: 투수 데이터에 존재하는 연도 목록(내림차순) */
export const usePitcherYears = () =>
  useQuery({ queryKey: ['pitcher_years'], staleTime: 5 * 60_000, queryFn: () => fetchYears('v_pitchers') })

export function useCreatePitcher() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { input: PitcherInput; pitches: PitcherPitch[] }) => createPitcher(v.input, v.pitches),
    onSuccess: () => qc.invalidateQueries({ queryKey: pitcherKeys.all }),
  })
}

export function useUpdatePitcher() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { id: string; patch: Partial<PitcherInput>; version: number; pitches: PitcherPitch[] }) =>
      updatePitcher(v.id, v.patch, v.version, v.pitches),
    onSuccess: (p) => {
      qc.invalidateQueries({ queryKey: pitcherKeys.all })
      qc.invalidateQueries({ queryKey: pitcherKeys.one(p.id) })
    },
  })
}

export function useDeletePitcher() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => softDeletePitcher(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: pitcherKeys.all }),
  })
}
