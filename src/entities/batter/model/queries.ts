import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchYears } from '@shared/api/years'
import {
  createBatter,
  getBatter,
  listBatters,
  searchBatterNames,
  softDeleteBatter,
  updateBatter,
} from '../api/batter-api'
import type { BatterFilters, BatterInput } from './types'

export const batterKeys = {
  all: ['batters'] as const,
  list: (f: BatterFilters) => ['batters', 'list', f] as const,
  one: (id: string) => ['batters', 'one', id] as const,
}

export const useBatters = (f: BatterFilters) =>
  useQuery({ queryKey: batterKeys.list(f), queryFn: () => listBatters(f) })

export const useBatter = (id: string | undefined) =>
  useQuery({ queryKey: batterKeys.one(id ?? ''), queryFn: () => getBatter(id as string), enabled: !!id })

/** 필터용: 타자 데이터에 존재하는 연도 목록(내림차순) */
export const useBatterYears = () =>
  useQuery({ queryKey: ['batter_years'], staleTime: 5 * 60_000, queryFn: () => fetchYears('v_batters') })

/** 이름 자동완성 검색 (신원 자동채움용) */
export const useBatterNameSearch = (q: string) =>
  useQuery({
    queryKey: ['batter_name_search', q.trim()],
    queryFn: () => searchBatterNames(q),
    enabled: q.trim().length >= 1,
    staleTime: 60_000,
  })

export function useCreateBatter() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: BatterInput) => createBatter(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: batterKeys.all }),
  })
}

export function useUpdateBatter() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { id: string; patch: Partial<BatterInput>; version: number }) =>
      updateBatter(v.id, v.patch, v.version),
    onSuccess: (b) => {
      qc.invalidateQueries({ queryKey: batterKeys.all })
      qc.setQueryData(batterKeys.one(b.id), b)
    },
  })
}

export function useDeleteBatter() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => softDeleteBatter(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: batterKeys.all }),
  })
}
