import { useQuery } from '@tanstack/react-query'
import { supabase } from '@shared/api/supabase'
import type { CodeMap, CodeRow } from './types'

/** codes 테이블(기본 db) 전체를 1회 로드해 category 로 그룹핑(캐시=Infinity). 모든 드롭다운/칩의 원천. */
export function useCodes() {
  return useQuery({
    queryKey: ['codes'],
    staleTime: Infinity,
    queryFn: async (): Promise<CodeMap> => {
      const { data, error } = await supabase
        .from('codes')
        .select('category, code, label, parent, sort_order')
        .order('category')
        .order('sort_order')
      if (error) throw error
      const map: CodeMap = {}
      for (const r of (data ?? []) as CodeRow[]) (map[r.category] ??= []).push(r)
      return map
    },
  })
}
