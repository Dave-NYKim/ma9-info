import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addToPool, listPool, removeFromPool, searchPlayers } from '../api/pool-api'
import type { PoolAdd } from './types'

export const poolKeys = {
  all: ['pool'] as const,
}

export const usePool = () => useQuery({ queryKey: poolKeys.all, queryFn: listPool })

export const usePlayerSearch = (q: string) =>
  useQuery({
    queryKey: ['player_search', q.trim()],
    queryFn: () => searchPlayers(q),
    enabled: q.trim().length >= 1,
    staleTime: 60_000,
  })

export function useAddToPool() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: PoolAdd) => addToPool(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: poolKeys.all }),
  })
}

export function useRemoveFromPool() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => removeFromPool(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: poolKeys.all }),
  })
}
