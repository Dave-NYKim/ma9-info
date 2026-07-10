import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import type { Batter } from '@entities/batter'
import { usePool } from '@entities/pool'
import { useSession } from '@entities/session'
import {
  ConflictError,
  useAddSlot,
  useApplySlots,
  useDeleteRoster,
  useRemoveSlot,
  useRoster,
  useUpdateRoster,
  useUpdateSlot,
  useUpdateTeamSettings,
  useUpsertGrowth,
  useCreateProspect,
  useUpdateProspect,
  useDeleteProspect,
  slotView,
  type RosterProspectRow,
  type RosterSlot,
} from '@entities/roster'
import { Ballpark } from '@widgets/ballpark'
import { BattingOrder } from '@widgets/batting-order'
import { PoolPanel, type ProspectItem } from '@widgets/pool-panel'
import { GrowthSheet } from '@widgets/growth-sheet'
import { PositionPicker } from '@widgets/position-picker'
import { ProspectSheet, ProspectGrowthSheet } from '@widgets/prospect-sheet'
import { TeamPreview } from '@widgets/team-preview'
import { TeamSettingsPanel } from '@widgets/team-settings'
import { LineupSheet } from '@widgets/lineup-sheet'
import { TeamStatBar } from '@widgets/team-stat-bar'
import { LINEUP_SIZE, type LineupPosition } from '@shared/config/roster'
import { DEFAULT_PROSPECT, parseProspect, type Prospect } from '@shared/config/prospects'
import {
  DEFAULT_GROWTH,
  parseGrowth,
  parseTeamSettings,
  STAT5,
  type Growth,
  type Stat5,
  type TeamSettings,
} from '@shared/config/team-stats'
import {
  computeCost,
  computeProspectStats,
  computeSlotStats,
  computeTeamCtx,
  type EngineSlot,
  type SlotStats,
} from '@shared/lib/stat-engine'
import { Badge, Button, Input, Panel } from '@shared/ui'

export function RosterEditPage() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const { userId } = useSession()
  const { data: roster, isLoading } = useRoster(id)
  const { data: pool = [] } = usePool()

  const slots = useMemo(
    () => [...(roster?.roster_players ?? [])].sort((a, b) => a.lineup_order - b.lineup_order),
    [roster],
  )
  const isOwner = !!roster && roster.user_id === userId

  const addMut = useAddSlot(id ?? '')
  const updMut = useUpdateSlot(id ?? '')
  const rmMut = useRemoveSlot(id ?? '')
  const applyMut = useApplySlots(id ?? '')
  const growthMut = useUpsertGrowth(id ?? '')
  const createProspectMut = useCreateProspect(id ?? '')
  const updateProspectMut = useUpdateProspect(id ?? '')
  const deleteProspectMut = useDeleteProspect(id ?? '')
  const renameMut = useUpdateRoster()
  const delMut = useDeleteRoster()
  const settingsMut = useUpdateTeamSettings(id ?? '')

  /** 타순 교환 대기 슬롯(필드 칩·타순 행 공유) */
  const [swapSel, setSwapSel] = useState<string | null>(null)
  const [nameEdit, setNameEdit] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  /** 육성 시트 대상 — 라인업 등록 여부 무관 (풀에서 열림) */
  const [growthTarget, setGrowthTarget] = useState<Batter | null>(null)
  /** 유망주 정체성 시트 (생성/편집 — 편집 대상은 roster_prospects 행) */
  const [prospectSheet, setProspectSheet] = useState<{ mode: 'create' } | { mode: 'edit'; row: RosterProspectRow } | null>(null)
  /** 유망주 육성 시트 */
  const [prospectGrowthRow, setProspectGrowthRow] = useState<RosterProspectRow | null>(null)
  /** 야구장 빈 포지션 클릭 → 선수 선택 팝업 */
  const [pickerPos, setPickerPos] = useState<LineupPosition | null>(null)

  // ---- 팀 스탯 (SPEC §10) — jsonb 파싱 → 엔진 ----
  const ts: TeamSettings = useMemo(() => parseTeamSettings(roster?.team_settings), [roster?.team_settings])
  /** batter_id → 육성 설정 (roster_growth — 팀 × 선수 단위, 라인업 무관) */
  const growthMap = useMemo(() => {
    const m = new Map<string, Growth>()
    for (const r of roster?.roster_growth ?? []) m.set(r.batter_id, parseGrowth(r.growth))
    return m
  }, [roster?.roster_growth])
  const growthOf = (batterId: string) => growthMap.get(batterId) ?? DEFAULT_GROWTH
  const engineSlots: EngineSlot[] = useMemo(
    () =>
      slots
        .filter((s) => s.batter)
        .map((s) => ({
          batter: s.batter!,
          assigned_position: s.assigned_position,
          growth: growthMap.get(s.batter_id!) ?? DEFAULT_GROWTH,
        })),
    [slots, growthMap],
  )
  const ctx = useMemo(() => computeTeamCtx(engineSlots), [engineSlots])
  const cost = useMemo(() => computeCost(engineSlots, ctx), [engineSlots, ctx]) // 유망주 = 코스트 0 (미포함)
  /** 라인업 슬롯별 최종 스탯 (카드 + 유망주 모두) */
  const slotStatsList = useMemo(
    () =>
      slots.map((s) => ({
        slot: s,
        stats: s.batter
          ? computeSlotStats(
              {
                batter: s.batter,
                assigned_position: s.assigned_position,
                growth: growthMap.get(s.batter_id!) ?? DEFAULT_GROWTH,
              },
              ts,
              ctx,
            )
          : computeProspectStats(parseProspect(s.prospect?.data), s.assigned_position, ts, ctx),
      })),
    [slots, growthMap, ts, ctx],
  )
  /** 팀 유망주 목록 (라인업 등록 여부 무관) — 풀 상단 표시 */
  const prospectItems: ProspectItem[] = useMemo(
    () =>
      (roster?.roster_prospects ?? []).map((row) => {
        const parsed = parseProspect(row.data)
        const slot = slots.find((s) => s.prospect_id === row.id)
        return {
          row,
          parsed,
          pos: slot?.assigned_position ?? null,
          stats: computeProspectStats(parsed, slot?.assigned_position ?? parsed.position, ts, ctx),
        }
      }),
    [roster?.roster_prospects, slots, ts, ctx],
  )
  /** batter_id → 적용(최종) 스탯 — 풀 패널·비교 팝업에서 사용.
   *  라인업 밖 풀 선수도 팀설정·육성을 전부 반영(주 포지션 기준)해 평가용 최종 스탯을 낸다
   *  — 풀에서 버프 반영된 스탯을 보고 좋은 선수를 라인업에 올리기 위함. */
  const appliedStats = useMemo(() => {
    const m = new Map<string, SlotStats>()
    // 라인업 슬롯 — 실제 배치 포지션 기준(오프/듀얼 반영)
    for (const { slot: s, stats } of slotStatsList) if (s.batter_id) m.set(s.batter_id, stats)
    // 풀에만 있는(라인업 밖) 카드 — 주 포지션 기준, 팀설정·육성 전부 반영
    for (const r of pool) {
      if (!r.batter || !r.batter_id || m.has(r.batter_id)) continue
      m.set(
        r.batter_id,
        computeSlotStats(
          { batter: r.batter, assigned_position: r.batter.position, growth: growthMap.get(r.batter_id) ?? DEFAULT_GROWTH },
          ts,
          ctx,
        ),
      )
    }
    return m
  }, [slotStatsList, pool, growthMap, ts, ctx])
  /** batter_id → 배치 포지션 (라인업 배치됨 표시·피커 이동 판단) */
  const lineupPos = useMemo(
    () => new Map(slots.filter((s) => s.batter_id).map((s) => [s.batter_id!, s.assigned_position as string])),
    [slots],
  )
  /** 슬롯 id 집합 — 고정 포지션과 배치 포지션이 어긋난 카드(야구장·타순에 "!") */
  const fixMismatch = useMemo(() => {
    const set = new Set<string>()
    for (const s of slots) {
      if (!s.batter_id) continue
      const fp = growthMap.get(s.batter_id)?.fixed_position
      if (fp && fp !== s.assigned_position) set.add(s.id)
    }
    return set
  }, [slots, growthMap])
  /** prospect_id → 배치 포지션 (피커 이동 판단) */
  const prospectSlotPos = useMemo(
    () => new Map(slots.filter((s) => s.prospect_id).map((s) => [s.prospect_id!, s.assigned_position as string])),
    [slots],
  )
  /** 라인업 등록(카드+유망주) 최종 스탯 평균 (풀 맨 위 표시) — 클러치는 카드만 */
  const teamAvg = useMemo(() => {
    if (slotStatsList.length === 0) return undefined
    const n = slotStatsList.length
    const stats = Object.fromEntries(
      STAT5.map((k) => [k, slotStatsList.reduce((a, x) => a + x.stats.final[k], 0) / n]),
    ) as Record<Stat5, number>
    const batters = slots.filter((s) => s.batter)
    const clutch = batters.reduce((a, s) => a + (s.batter!.clutch ?? 0), 0) / Math.max(1, batters.length)
    return { count: n, stats, clutch }
  }, [slotStatsList, slots])
  const veteranNames = useMemo(
    () => ({
      black: slots.find((s) => s.batter?.grade === 'B' && s.batter_id && growthMap.get(s.batter_id)?.team_veteran)?.batter?.name ?? null,
      sig: slots.find((s) => s.batter?.grade === 'SG' && s.batter_id && growthMap.get(s.batter_id)?.team_veteran)?.batter?.name ?? null,
    }),
    [slots, growthMap],
  )

  const saveSettings = (patch: Partial<TeamSettings>) =>
    settingsMut.mutate({ ...ts, ...patch }, { onError: (e) => toast.error(e.message) })

  /** 육성 저장(라인업 무관) — 팀 베테랑 중복(등급별 1명, 라인업 내) 자동 해제 + L 카드 HOF 는 팀 설정으로 */
  const saveGrowth = (g: Growth, legendPotential?: TeamSettings['legend_potential']) => {
    const b = growthTarget
    setGrowthTarget(null)
    if (!b) return
    if (g.team_veteran) {
      const other = slots.find(
        (x) => !!x.batter_id && x.batter_id !== b.id && x.batter?.grade === b.grade && growthMap.get(x.batter_id)?.team_veteran,
      )
      if (other?.batter) {
        if (!window.confirm(`${b.grade === 'B' ? '블랙' : '시그'} 팀 베테랑은 1명 — 「${other.batter.name}」 지정을 해제하고 「${b.name}」(으)로 바꿀까요?`)) {
          g = { ...g, team_veteran: false }
        } else {
          growthMut.mutate({ batterId: other.batter_id!, growth: { ...growthOf(other.batter_id!), team_veteran: false } })
        }
      }
    }
    growthMut.mutate(
      { batterId: b.id, growth: g },
      { onSuccess: () => toast(`「${b.name}」 육성 저장`), onError: fail },
    )
    if (legendPotential !== undefined) saveSettings({ legend_potential: legendPotential })
    // 고정은 배치와 독립 — 배치가 고정 포지션과 다르면 야구장/타순에 "!"로 경고(자동 이동 안 함).
  }

  const fail = (e: Error) => {
    const code = (e as { code?: string }).code
    toast.error(code === '23505' ? '자리·타순·카드가 겹칩니다 — 잠시 후 다시 시도하세요' : e.message)
  }

  /** 야구장 칩 두 개 클릭 = 타순 교환 */
  const slotClick = (s: RosterSlot) => {
    if (!isOwner) return
    if (!swapSel) return setSwapSel(s.id)
    if (swapSel === s.id) return setSwapSel(null)
    const a = slots.find((x) => x.id === swapSel)
    setSwapSel(null)
    if (!a) return
    applyMut.mutate(
      [
        { slot: a, order: s.lineup_order },
        { slot: s, order: a.lineup_order },
      ],
      { onSuccess: () => toast(`타순 교환: ${a.lineup_order}번 ↔ ${s.lineup_order}번`), onError: fail },
    )
  }

  /** 타순 패널 드래그앤드랍 — 빈 자리면 그 번호로 이동, 찬 자리면 사이로 끼워넣기(점유 번호 유지) */
  const moveOrder = (dragged: RosterSlot, targetOrder: number, targetSlot: RosterSlot | null) => {
    if (!targetSlot) {
      applyMut.mutate([{ slot: dragged, order: targetOrder }], {
        onSuccess: () => toast(`${targetOrder}번으로 이동`),
        onError: fail,
      })
      return
    }
    const filled = slots // lineup_order 오름차순 정렬돼 있음
    const fromIdx = filled.findIndex((x) => x.id === dragged.id)
    const toIdx = filled.findIndex((x) => x.id === targetSlot.id)
    if (fromIdx < 0 || toIdx < 0) return
    const arr = [...filled]
    arr.splice(fromIdx, 1)
    arr.splice(toIdx, 0, dragged)
    const orders = filled.map((x) => x.lineup_order)
    const entries = arr.map((slot, i) => ({ slot, order: orders[i] })).filter((e) => e.order !== e.slot.lineup_order)
    if (entries.length === 0) return
    applyMut.mutate(entries, { onSuccess: () => toast('타순 변경'), onError: fail })
  }

  const removeSlot = (s: RosterSlot) => {
    if (swapSel === s.id) setSwapSel(null)
    rmMut.mutate(s.id, {
      onSuccess: () => toast(`「${slotView(s).name}」 라인업에서 제거${s.batter ? ' (풀에는 그대로)' : ''}`),
      onError: fail,
    })
  }

  const freeOrder = () => {
    const used = new Set(slots.map((s) => s.lineup_order))
    return Array.from({ length: LINEUP_SIZE }, (_, i) => i + 1).find((o) => !used.has(o)) as number
  }
  const placeProspect = (prospectId: string, pos: LineupPosition, name: string) => {
    if (!roster) return
    if (slots.length >= LINEUP_SIZE) return toast('라인업이 이미 9명입니다 — 풀에는 보관됩니다')
    const order = freeOrder()
    addMut.mutate(
      { roster_id: roster.id, batter_id: null, prospect_id: prospectId, assigned_position: pos, lineup_order: order, use_dual: false },
      { onSuccess: () => toast(`${order}번 ${pos} 유망주 「${name}」 배치`), onError: fail },
    )
  }

  /** 유망주 정체성 저장 — roster_prospects 에 저장(라인업 무관). 배치는 풀의 포지션 칩으로. */
  const saveProspect = (p: Prospect) => {
    const sheet = prospectSheet
    setProspectSheet(null)
    if (!roster || !sheet) return
    if (sheet.mode === 'create') {
      createProspectMut.mutate(p, { onSuccess: () => toast(`유망주 「${p.name}」 추가 (풀에 담김)`), onError: fail })
      return
    }
    updateProspectMut.mutate(
      { id: sheet.row.id, data: p },
      { onSuccess: () => toast(`유망주 「${p.name}」 저장`), onError: fail },
    )
  }

  /** 풀의 유망주 포지션 칩 — 배치/이동/맞교환 */
  const assignProspect = (row: RosterProspectRow, pos: LineupPosition) => {
    if (!roster) return
    const p = parseProspect(row.data)
    const mySlot = slots.find((s) => s.prospect_id === row.id)
    const target = slots.find((s) => s.assigned_position === pos)
    if (mySlot) {
      if (mySlot.assigned_position === pos) return
      if (!target) {
        applyMut.mutate([{ slot: mySlot, position: pos }], { onSuccess: () => toast(`${p.name} → ${pos} 이동`), onError: fail })
        return
      }
      const tv = slotView(target)
      if (!window.confirm(`${pos}의 「${tv.name}」와 포지션을 맞바꿀까요? (타순은 유지)`)) return
      applyMut.mutate(
        [
          { slot: mySlot, position: pos },
          {
            slot: target,
            position: mySlot.assigned_position,
            use_dual: target.batter ? dualOf(target.batter, mySlot.assigned_position) : false,
          },
        ],
        { onSuccess: () => toast(`포지션 맞교환: ${p.name} ↔ ${tv.name}`), onError: fail },
      )
      return
    }
    if (target) {
      if (!window.confirm(`${pos} 자리의 「${slotView(target).name}」 → 유망주 「${p.name}」(으)로 교체할까요?`)) return
      updMut.mutate(
        { id: target.id, patch: { prospect_id: row.id, batter_id: null, use_dual: false } },
        { onSuccess: () => toast(`${pos} 교체 → ${p.name}`), onError: fail },
      )
      return
    }
    placeProspect(row.id, pos, p.name)
  }

  const removeProspect = (row: RosterProspectRow) => {
    const p = parseProspect(row.data)
    if (!window.confirm(`유망주 「${p.name}」을(를) 완전히 삭제할까요? (라인업에 있으면 함께 빠집니다)`)) return
    deleteProspectMut.mutate(row.id, { onSuccess: () => toast(`유망주 「${p.name}」 삭제`), onError: fail })
  }

  /** 유망주 육성 저장 — 정체성은 유지하고 data 전체를 다시 쓴다(시트가 full Prospect 보유) */
  const saveProspectGrowth = (p: Prospect) => {
    const row = prospectGrowthRow
    setProspectGrowthRow(null)
    if (!row) return
    updateProspectMut.mutate({ id: row.id, data: p }, { onSuccess: () => toast(`유망주 「${p.name}」 육성 저장`), onError: fail })
  }

  const dualOf = (b: Batter, pos: LineupPosition) => b.dual_position === pos && b.position !== pos

  /** 풀 → 배치/이동. 라인업 밖 = 배치(빈 타순 최소 번호) · 라인업 안 = 포지션 이동(빈 자리) 또는 맞교환(찬 자리).
   *  ※ 배치 ≠ 고정(훈련). 고정은 육성 시트에서만. */
  const assign = (batter: Batter, pos: LineupPosition) => {
    if (!roster) return
    const use_dual = dualOf(batter, pos)
    const mySlot = slots.find((s) => s.batter_id === batter.id)
    const target = slots.find((s) => s.assigned_position === pos)

    // 이미 라인업에 있는 선수 → 포지션 이동/맞교환
    if (mySlot) {
      if (mySlot.assigned_position === pos) return
      if (!target) {
        applyMut.mutate([{ slot: mySlot, position: pos, use_dual }], {
          onSuccess: () => toast(`${batter.name} → ${pos} 이동`),
          onError: fail,
        })
        return
      }
      const tb = target.batter
      if (!window.confirm(`${pos}의 「${tb?.name ?? '?'}」와 포지션을 맞바꿀까요? (타순은 유지)`)) return
      applyMut.mutate(
        [
          { slot: mySlot, position: pos, use_dual },
          { slot: target, position: mySlot.assigned_position, use_dual: tb ? dualOf(tb, mySlot.assigned_position) : false },
        ],
        { onSuccess: () => toast(`포지션 맞교환: ${batter.name} ↔ ${tb?.name ?? '?'}`), onError: fail },
      )
      return
    }

    // 라인업 밖 → 배치 (유망주 자리를 뺏는 경우 prospect 를 비워 카드 슬롯으로 전환)
    if (target) {
      const ok = window.confirm(
        `${pos} 자리의 「${slotView(target).name}」 → 「${batter.name}」(으)로 교체할까요?\n(빠지는 카드는 풀에 그대로 남습니다)`,
      )
      if (!ok) return
      updMut.mutate(
        { id: target.id, patch: { batter_id: batter.id, use_dual, prospect_id: null } },
        { onSuccess: () => toast(`${pos} 교체 → ${batter.name}`), onError: fail },
      )
      return
    }
    if (slots.length >= LINEUP_SIZE) return toast('라인업이 이미 9명입니다 — 자리를 비우거나 교체하세요')
    const used = new Set(slots.map((s) => s.lineup_order))
    const order = Array.from({ length: LINEUP_SIZE }, (_, i) => i + 1).find((o) => !used.has(o)) as number
    addMut.mutate(
      { roster_id: roster.id, batter_id: batter.id, assigned_position: pos, lineup_order: order, use_dual },
      { onSuccess: () => toast(`${order}번 ${pos} 배치 → ${batter.name}`), onError: fail },
    )
  }

  const saveName = () => {
    if (!roster || nameEdit == null) return
    const n = nameEdit.trim()
    setNameEdit(null)
    if (!n || n === roster.name) return
    renameMut.mutate(
      { id: roster.id, patch: { name: n }, version: roster.version },
      {
        onSuccess: () => toast('팀 이름 저장'),
        onError: (e) => toast.error(e instanceof ConflictError ? e.message : e.message),
      },
    )
  }

  const del = () => {
    if (!roster) return
    if (!window.confirm(`팀 「${roster.name}」 을(를) 삭제할까요?`)) return
    delMut.mutate(roster.id, {
      onSuccess: () => {
        toast('팀이 삭제되었습니다')
        nav('/rosters')
      },
      onError: fail,
    })
  }

  if (isLoading) return <div className="p-10 text-center text-ink-faint">불러오는 중…</div>
  if (!roster)
    return (
      <div className="p-10 text-center text-ink-faint">
        팀을 찾을 수 없습니다
        <div className="mt-3">
          <Button onClick={() => nav('/rosters')}>← 팀 목록</Button>
        </div>
      </div>
    )

  return (
    <div className="p-4 flex flex-col gap-3 max-w-[1300px] mx-auto">
      {/* 헤더: 이름(소유자는 클릭 편집) · 소유자 · 인원 · 삭제 */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" onClick={() => nav('/rosters')}>
          ← 팀 목록
        </Button>
        {isOwner && nameEdit != null ? (
          <Input
            autoFocus
            className="w-[240px] !text-[1.05rem] font-extrabold"
            value={nameEdit}
            onChange={(e) => setNameEdit(e.target.value)}
            onBlur={saveName}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveName()
              if (e.key === 'Escape') setNameEdit(null)
            }}
          />
        ) : (
          <h1
            className={isOwner ? 'text-xl font-extrabold cursor-text hover:underline decoration-dotted' : 'text-xl font-extrabold'}
            onClick={isOwner ? () => setNameEdit(roster.name) : undefined}
            title={isOwner ? '클릭해서 이름 수정' : undefined}
          >
            {roster.name}
          </h1>
        )}
        <span className="text-[.76rem] text-ink-faint">{roster.owner?.email ?? ''}</span>
        {!isOwner && <Badge color="var(--ink-faint)">읽기 전용</Badge>}
        <div className="ml-auto flex items-center gap-2">
          <span className="font-mono tabular-nums font-extrabold text-[.9rem]">
            {slots.length}
            <span className="text-ink-faint font-normal">/{LINEUP_SIZE}</span>
          </span>
          {slots.length < LINEUP_SIZE && <Badge color="var(--gold)">미완성</Badge>}
          {isOwner && (
            <Button variant="ghost" className="text-[color:var(--clay)]" onClick={del}>
              팀 삭제
            </Button>
          )}
        </div>
      </div>

      {/* 팀 스탯 바 — 코스트 게이지 + 활성 버프 (SPEC §10) */}
      <TeamStatBar
        cost={cost}
        ts={ts}
        ctx={ctx}
        editable={isOwner}
        settingsOpen={settingsOpen}
        onToggleSettings={() => setSettingsOpen((v) => !v)}
      />
      {isOwner && settingsOpen && <TeamSettingsPanel ts={ts} ctx={ctx} veteranNames={veteranNames} onPatch={saveSettings} />}

      {swapSel && (
        <div className="rounded-lg border border-[color:var(--accent)] bg-[color:color-mix(in_srgb,var(--accent)_8%,transparent)] px-3 py-2 text-[.8rem] text-ink">
          타순 교환 — 야구장에서 바꿀 다른 선수 칩을 클릭하세요 (같은 칩 다시 클릭 = 취소)
        </div>
      )}

      {/* 좌 야구장 / 우 타순+팀 미리보기 (우측 합산 높이 = 야구장 높이) */}
      <div className="grid gap-3 items-stretch lg:grid-cols-[minmax(0,1fr)_520px]">
        <div className="flex flex-col gap-3 min-w-0">
          <Ballpark
            slots={slots}
            editable={isOwner}
            swapSel={swapSel}
            mismatch={fixMismatch}
            onChipClick={slotClick}
            onRemove={removeSlot}
            onEmptyClick={(pos) => setPickerPos(pos)}
          />
        </div>
        {/* 우측 열 — lg 에선 야구장 높이에 고정(absolute), 미리보기가 남는 공간을 차지하고 내부 스크롤 */}
        <div className="relative min-w-0">
          <div className="flex flex-col gap-3 lg:absolute lg:inset-0">
            <BattingOrder
              slots={slots}
              editable={isOwner}
              mismatch={fixMismatch}
              onMove={moveOrder}
              onRemove={removeSlot}
            />
            <TeamPreview ts={ts} ctx={ctx} cost={cost} veteranNames={veteranNames} className="flex-1 min-h-0" />
            {!isOwner && (
              <Panel title="읽기 전용">
                <p className="text-[.82rem] text-ink-soft m-0">
                  다른 사용자의 팀입니다 — 라인업 열람만 가능해요. 내 팀을 만들려면 팀 목록에서 「+ 팀 만들기」.
                </p>
              </Panel>
            )}
          </div>
        </div>
      </div>

      {/* 내 풀 — 하단 전체 너비 (비교 작업대) */}
      {isOwner && (
        <PoolPanel
          lineupPos={lineupPos}
          editable
          onGrowth={(batter) => setGrowthTarget(batter)}
          onAssign={assign}
          onAssignProspect={assignProspect}
          applied={appliedStats}
          growthInfo={growthMap}
          teamAvg={teamAvg}
          prospects={prospectItems}
          onProspectEdit={(row) => setProspectSheet({ mode: 'edit', row })}
          onProspectGrowth={(row) => setProspectGrowthRow(row)}
          onProspectDelete={removeProspect}
          onAddProspect={() => setProspectSheet({ mode: 'create' })}
        />
      )}

      {/* 팀 페이지 맨 아래 — 전체 라인업 최종 스탯 (인게임 팀 정보 화면 형태) */}
      <LineupSheet entries={slotStatsList} growthMap={growthMap} />

      {/* 야구장 포지션 클릭 → 선수/유망주 선택 팝업 (검색 포함) */}
      {pickerPos && (
        <PositionPicker
          pos={pickerPos}
          lineupPos={lineupPos}
          prospects={roster.roster_prospects}
          prospectSlotPos={prospectSlotPos}
          onPick={(b) => {
            setPickerPos(null)
            assign(b, pickerPos)
          }}
          onPickProspect={(row) => {
            setPickerPos(null)
            assignProspect(row, pickerPos)
          }}
          onClose={() => setPickerPos(null)}
        />
      )}

      {/* 유망주 생성/편집 시트 — roster_prospects 행 기준 (정체성만) */}
      {prospectSheet && (
        <ProspectSheet
          mode={prospectSheet.mode}
          initial={prospectSheet.mode === 'edit' ? parseProspect(prospectSheet.row.data) : DEFAULT_PROSPECT}
          onSave={saveProspect}
          onClose={() => setProspectSheet(null)}
        />
      )}

      {/* 유망주 육성 시트 (일반 선수의 육성 대응) */}
      {prospectGrowthRow && (
        <ProspectGrowthSheet
          prospect={parseProspect(prospectGrowthRow.data)}
          onSave={saveProspectGrowth}
          onClose={() => setProspectGrowthRow(null)}
        />
      )}

      {/* 육성 시트 모달 — 라인업 무관, 등급 조건부(L=HOF · B/SG=팀 베테랑 · S=강점/약점) */}
      {growthTarget && (
        <GrowthSheet
          batter={growthTarget}
          lineup={(() => {
            const s = slots.find((x) => x.batter_id === growthTarget.id)
            return s ? { order: s.lineup_order, position: s.assigned_position } : null
          })()}
          growth={growthOf(growthTarget.id)}
          teamSettings={ts}
          onSave={saveGrowth}
          onClose={() => setGrowthTarget(null)}
        />
      )}
    </div>
  )
}
