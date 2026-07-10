import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import type { Batter } from '@entities/batter'
import { useBatters } from '@entities/batter'
import { usePool, useAddToPool } from '@entities/pool'
import { positionFit, type RosterProspectRow } from '@entities/roster'
import { GRADES, gradeBarBg, GRADE_ACCENT_TEXT } from '@shared/config/grades'
import { STAT5, STAT5_LABEL, type Stat5 } from '@shared/config/team-stats'
import { parseProspect } from '@shared/config/prospects'
import type { LineupPosition } from '@shared/config/roster'
import { useDebounced } from '@shared/lib/use-debounced'
import { cn } from '@shared/lib/cn'
import { Badge, Button, Input, Panel, Toggle } from '@shared/ui'

const gradeRank = (code: string) => GRADES.findIndex((g) => g.code === code)
const FIT_RANK = { main: 0, dual: 1, off: 2 } as const

/** 야구장 포지션 클릭 → 선수 선택 팝업.
 *  기본 = 내 풀(그 포지션 가능 선수만) · 「전체 선수」 체크 = 전체 DB 검색 + 선택 시 풀 자동 등록. */
export function PositionPicker({
  pos,
  lineupPos,
  prospects = [],
  prospectSlotPos,
  onPick,
  onPickProspect,
  onClose,
}: {
  pos: LineupPosition
  /** batter_id → 현재 배치 포지션 (라인업 선수 = 이동으로 표시, 같은 자리는 비활성) */
  lineupPos: Map<string, string>
  /** 팀 유망주 (그 포지션 = 유망주 position 일치만 노출) */
  prospects?: RosterProspectRow[]
  /** prospect_id → 현재 배치 포지션 */
  prospectSlotPos?: Map<string, string>
  onPick: (b: Batter) => void
  onPickProspect?: (row: RosterProspectRow) => void
  onClose: () => void
}) {
  const [q, setQ] = useState('')
  const dq = useDebounced(q)
  const [allMode, setAllMode] = useState(false)
  const { data: pool = [] } = usePool()
  const addPool = useAddToPool()
  const poolIds = useMemo(() => new Set(pool.filter((r) => r.batter_id).map((r) => r.batter_id as string)), [pool])
  // 전체 모드일 때만 DB 조회 (포지션 = 주/듀얼 일치 · DH 는 누구나 → 필터 없음)
  const { data: allData, isLoading } = useBatters({
    q: dq || undefined,
    position: pos === 'DH' ? undefined : pos,
    page: 0,
    size: 100,
  })

  const rows = useMemo(() => {
    let items: Batter[]
    if (allMode) {
      items = allData?.items ?? []
    } else {
      // 내 풀 — 그 포지션 가능(주/듀얼) 타자만, 중복 카드는 1번만
      const seen = new Set<string>()
      items = []
      for (const r of pool) {
        const b = r.batter
        if (!b || seen.has(b.id)) continue
        if (positionFit(b, pos) === 'off') continue
        if (dq && !b.name.includes(dq.trim())) continue
        seen.add(b.id)
        items.push(b)
      }
    }
    return [...items].sort((a, b) => {
      const f = FIT_RANK[positionFit(a, pos)] - FIT_RANK[positionFit(b, pos)]
      if (f !== 0) return f
      const g = gradeRank(a.grade) - gradeRank(b.grade)
      if (g !== 0) return g
      return a.name.localeCompare(b.name, 'ko')
    })
  }, [allMode, allData, pool, dq, pos])

  const pick = (b: Batter) => {
    // 전체 선수에서 골랐고 풀에 없으면 자동 등록
    if (allMode && !poolIds.has(b.id))
      addPool.mutate({ batter_id: b.id }, { onSuccess: () => toast(`「${b.name}」 풀에 자동 등록`), onError: (e) => toast.error(e.message) })
    onPick(b)
  }

  // 이 포지션에 맞는 유망주 (유망주 = 주포지션 일치 · DH 는 누구나) — 항상 상단 노출
  const fitProspects = useMemo(
    () =>
      prospects
        .map((row) => ({ row, p: parseProspect(row.data) }))
        .filter(({ p }) => (pos === 'DH' || p.position === pos) && (!dq || p.name.includes(dq.trim()))),
    [prospects, pos, dq],
  )

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/75 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-[640px] my-8" onClick={(e) => e.stopPropagation()}>
        <Panel
          title={
            <span className="normal-case tracking-normal text-[.9rem]">
              <b className="text-[color:var(--accent)] text-[1rem]">{pos}</b> <b className="text-ink">자리에 넣을 선수 선택</b>
              <span className="ml-2 text-ink-faint text-[.74rem] font-normal">
                {allMode ? `전체 ${allData?.total ?? 0}명` : `내 풀 ${rows.length}명`}
              </span>
            </span>
          }
          right={
            <Button variant="ghost" className="!px-3 !py-1" onClick={onClose}>
              닫기
            </Button>
          }
        >
          <div className="flex items-center gap-3 mb-2">
            <Input autoFocus placeholder="이름 검색…" value={q} onChange={(e) => setQ(e.target.value)} className="flex-1" />
            <Toggle
              checked={allMode}
              onChange={setAllMode}
              label={<span className="whitespace-nowrap">전체 선수 (선택 시 풀 자동 등록)</span>}
            />
          </div>

          <div className="max-h-[60vh] overflow-auto rounded-lg border border-line">
            {/* 유망주 — 이 포지션에 맞는 팀 유망주 (항상 상단) */}
            {onPickProspect &&
              fitProspects.map(({ row, p }) => {
                const cur = prospectSlotPos?.get(row.id)
                const samePos = cur === pos
                return (
                  <button
                    key={row.id}
                    type="button"
                    disabled={samePos}
                    onClick={() => onPickProspect(row)}
                    className={cn(
                      'flex w-full items-center gap-2 border-b border-line px-2.5 py-[7px] text-left text-[.8rem] transition cursor-pointer bg-[color:color-mix(in_srgb,var(--green)_5%,transparent)]',
                      samePos ? 'opacity-40 cursor-not-allowed' : 'hover:bg-surface-2',
                    )}
                  >
                    <Badge color="var(--green)">유망</Badge>
                    <span className="min-w-0 truncate font-bold">{p.name}</span>
                    <span className="shrink-0 text-[.72rem] text-ink-soft">
                      {p.throw_hand}/{p.bat_hand}
                    </span>
                    <span className="shrink-0 rounded border px-1 py-[1px] text-[.64rem] font-bold border-[color:var(--green)] text-[color:var(--green)]">
                      {pos === 'DH' ? p.position : '주포지션'}
                    </span>
                    <span className="ml-auto flex items-center gap-2 shrink-0 text-[.68rem] text-ink-faint">
                      {p.type1}/{p.type2}
                    </span>
                    {cur && <Badge color={samePos ? 'var(--ink-faint)' : 'var(--gold)'}>{samePos ? '현재' : `${cur}→이동`}</Badge>}
                  </button>
                )
              })}
            {allMode && isLoading ? (
              <div className="p-6 text-center text-ink-faint text-[.85rem]">불러오는 중…</div>
            ) : rows.length === 0 && fitProspects.length === 0 ? (
              <div className="p-6 text-center text-ink-faint text-[.85rem]">
                {allMode ? '해당 선수 없음' : '풀에 이 포지션 가능한 선수가 없어요 — 「전체 선수」를 켜보세요'}
              </div>
            ) : (
              rows.map((b) => {
                const fit = positionFit(b, pos)
                const cur = lineupPos.get(b.id)
                const samePos = cur === pos
                return (
                  <button
                    key={b.id}
                    type="button"
                    disabled={samePos}
                    onClick={() => pick(b)}
                    className={cn(
                      'flex w-full items-center gap-2 border-b border-line px-2.5 py-[7px] text-left text-[.8rem] transition cursor-pointer',
                      samePos ? 'opacity-40 cursor-not-allowed' : 'hover:bg-surface-2',
                    )}
                  >
                    <Badge color={gradeBarBg(b.grade)} text={GRADE_ACCENT_TEXT[b.grade] ?? '#fff'}>
                      {b.grade}
                    </Badge>
                    <span className="min-w-0 truncate font-bold">{b.name}</span>
                    {b.year != null && <span className="shrink-0 text-[.68rem] tabular-nums text-ink-faint">{b.year}</span>}
                    <span className="shrink-0 text-[.72rem] text-ink-soft">{b.team_code}</span>
                    <span
                      className={cn(
                        'shrink-0 rounded border px-1 py-[1px] text-[.64rem] font-bold',
                        fit === 'main' && 'border-[color:var(--green)] text-[color:var(--green)]',
                        fit === 'dual' && 'border-[color:var(--gold)] text-[color:var(--gold)]',
                      )}
                    >
                      {pos === 'DH' ? (b.dual_position ? `${b.position}/${b.dual_position}` : b.position) : fit === 'main' ? '주포지션' : '듀얼'}
                    </span>
                    <span className="ml-auto flex items-center gap-2 shrink-0 font-mono tabular-nums text-[.72rem] text-ink-soft">
                      {STAT5.map((k: Stat5) => (
                        <span key={k}>
                          <span className="text-ink-faint text-[.6rem]">{STAT5_LABEL[k]}</span> {b[k] ?? '—'}
                        </span>
                      ))}
                    </span>
                    {allMode && poolIds.has(b.id) && <Badge color="var(--blue)">풀</Badge>}
                    {cur && <Badge color={samePos ? 'var(--ink-faint)' : 'var(--gold)'}>{samePos ? '현재' : `${cur}→이동`}</Badge>}
                  </button>
                )
              })
            )}
          </div>
          <p className="mt-1.5 mb-0 text-[.66rem] text-ink-faint">
            {pos === 'DH'
              ? '지명타자는 누구나 배치 가능 (수비 페널티 없음) · 라인업 선수 선택 = 자리 이동 · 전체 선수 = 풀 자동 등록'
              : '주포지션(초록)·듀얼(금색)만 표시 · 라인업 선수 선택 = 자리 이동 · 전체 선수에서 고르면 내 풀에 자동 등록'}
          </p>
        </Panel>
      </div>
    </div>
  )
}
