import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addPitcher,
  addSlot,
  applyPitcherSlots,
  applySlots,
  createProspect,
  createRoster,
  deleteProspect,
  getRoster,
  listRosters,
  removePitcher,
  removeSlot,
  softDeleteRoster,
  updatePitcher,
  updateProspect,
  updateRoster,
  updateSlot,
  updateTeamSettings,
  upsertGrowth,
  type PitcherSlotChange,
  type SlotChange,
} from '../api/roster-api'
import type { Roster, RosterPitcherInput, SlotInput } from './types'

export const rosterKeys = {
  all: ['rosters'] as const,
  list: (scope: string, userId: string | null) => ['rosters', 'list', scope, userId] as const,
  one: (id: string) => ['rosters', 'one', id] as const,
}

export const useRosters = (scope: 'mine' | 'all', userId: string | null) =>
  useQuery({ queryKey: rosterKeys.list(scope, userId), queryFn: () => listRosters(scope, userId) })

export const useRoster = (id: string | undefined) =>
  useQuery({ queryKey: rosterKeys.one(id ?? ''), queryFn: () => getRoster(id as string), enabled: !!id })

export function useCreateRoster() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => createRoster(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: rosterKeys.all }),
  })
}

export function useUpdateRoster() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { id: string; patch: Partial<Pick<Roster, 'name' | 'memo'>>; version: number }) =>
      updateRoster(v.id, v.patch, v.version),
    onSuccess: () => qc.invalidateQueries({ queryKey: rosterKeys.all }),
    onError: (_e, v) => qc.invalidateQueries({ queryKey: rosterKeys.one(v.id) }),
  })
}

export function useDeleteRoster() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => softDeleteRoster(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: rosterKeys.all }),
  })
}

/** 라인업 조작 공통 — 성공/실패 모두 해당 팀 refetch(낙관락 version 이 계속 오르므로 최신 유지) */
function useLineupMutation<TVars>(rosterId: string, fn: (v: TVars) => Promise<void>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSettled: () => qc.invalidateQueries({ queryKey: rosterKeys.all }),
    onSuccess: () => qc.invalidateQueries({ queryKey: rosterKeys.one(rosterId) }),
  })
}

export const useAddSlot = (rosterId: string) => useLineupMutation(rosterId, (input: SlotInput) => addSlot(input))
export const useUpdateSlot = (rosterId: string) =>
  useLineupMutation(rosterId, (v: { id: string; patch: Partial<SlotInput> }) => updateSlot(v.id, v.patch))
export const useUpdateTeamSettings = (rosterId: string) =>
  useLineupMutation(rosterId, (ts: unknown) => updateTeamSettings(rosterId, ts))
export const useRemoveSlot = (rosterId: string) => useLineupMutation(rosterId, (id: string) => removeSlot(id))
export const useApplySlots = (rosterId: string) => useLineupMutation(rosterId, (entries: SlotChange[]) => applySlots(entries))
export const useUpsertGrowth = (rosterId: string) =>
  useLineupMutation(rosterId, (v: { batterId: string; growth: unknown }) => upsertGrowth(rosterId, v.batterId, v.growth))
export const useCreateProspect = (rosterId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: unknown) => createProspect(rosterId, data),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: rosterKeys.all })
      qc.invalidateQueries({ queryKey: rosterKeys.one(rosterId) })
    },
  })
}
export const useUpdateProspect = (rosterId: string) =>
  useLineupMutation(rosterId, (v: { id: string; data: unknown }) => updateProspect(v.id, v.data))
export const useDeleteProspect = (rosterId: string) => useLineupMutation(rosterId, (id: string) => deleteProspect(id))

// ---------- 투수진 ----------
export const useAddPitcher = (rosterId: string) =>
  useLineupMutation(rosterId, (input: RosterPitcherInput) => addPitcher(input))
export const useUpdatePitcher = (rosterId: string) =>
  useLineupMutation(rosterId, (v: { id: string; patch: Partial<RosterPitcherInput> }) => updatePitcher(v.id, v.patch))
export const useRemovePitcher = (rosterId: string) => useLineupMutation(rosterId, (id: string) => removePitcher(id))
export const useApplyPitcherSlots = (rosterId: string) =>
  useLineupMutation(rosterId, (entries: PitcherSlotChange[]) => applyPitcherSlots(entries))
