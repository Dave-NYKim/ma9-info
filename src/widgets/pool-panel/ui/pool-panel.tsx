import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import type { Batter } from '@entities/batter'
import { positionFit, type RosterProspectRow } from '@entities/roster'
import { usePool, usePlayerSearch, useAddToPool, useRemoveFromPool, type PoolPlayer } from '@entities/pool'
import { GRADES, gradeCssVar, gradeName } from '@shared/config/grades'
import { LINEUP_POSITIONS, type LineupPosition } from '@shared/config/roster'
import { prospectHasGrowth, type Prospect } from '@shared/config/prospects'
import { STAT5, statTier, type Growth, type Stat5 } from '@shared/config/team-stats'
import type { SlotStats } from '@shared/lib/stat-engine'
import { useDebounced } from '@shared/lib/use-debounced'
import { cn } from '@shared/lib/cn'
import { Button, GradeMark, HoverTip, Input, Panel, Segmented } from '@shared/ui'
import { CompareModal, type CmpEntry } from './compare-modal'

const APPLIED_KEYS = new Set<string>(STAT5)

const TABS = ['타자', '투수'] as const

interface Col {
  key: string
  label: string
  num?: boolean
}
const CMP_COL: Col = { key: '_cmp', label: '⚖' }
/** 파생 컬럼(선수 필드가 아님) — 정렬 대상에서 제외 */
const NO_SORT = new Set(['_cmp', '_lv', '_vetsw'])
const BATTER_COLS: Col[] = [
  { key: 'grade', label: '등급' },
  { key: 'year', label: '연도', num: true },
  { key: 'name', label: '이름' },
  { key: 'team_code', label: '팀' },
  { key: 'position', label: '포지션' },
  { key: '_lv', label: 'Lv' },
  { key: '_vetsw', label: '베테랑(강/약)' },
  { key: 'power', label: '파워', num: true },
  { key: 'contact', label: '컨택', num: true },
  { key: 'speed', label: '스핏', num: true },
  { key: 'throwing', label: '쓰로', num: true },
  { key: 'defense', label: '수비', num: true },
  { key: 'clutch', label: '클러', num: true },
]
const PITCHER_COLS: Col[] = [
  { key: 'grade', label: '등급' },
  { key: 'year', label: '연도', num: true },
  { key: 'name', label: '이름' },
  { key: 'team_code', label: '팀' },
  { key: 'position', label: '포지션' },
  { key: 'stamina', label: '체력', num: true },
  { key: 'control', label: '제구', num: true },
  { key: 'levelup_pitch', label: '성장' },
]

const gradeRank = (code: string) => GRADES.findIndex((g) => g.code === code)

/** 풀 안에서 라인업 포지션 지정/이동 — 야구장 안 가고 바로. 현재 자리=액센트, 주=기본/듀얼=금/불일치=흐림. */
function PositionChips({
  fitOf,
  current,
  onPick,
}: {
  fitOf: (pos: LineupPosition) => 'main' | 'dual' | 'off'
  current: string | null
  onPick: (pos: LineupPosition) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      <span className="mr-0.5 text-[.66rem] font-bold text-ink-faint">포지션</span>
      {LINEUP_POSITIONS.map((pos) => {
        const active = current === pos
        const fit = fitOf(pos)
        return (
          <button
            key={pos}
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onPick(pos)
            }}
            className={cn(
              'min-w-[2rem] rounded border px-1 py-[2px] text-center text-[.66rem] font-bold tabular-nums transition cursor-pointer',
              active
                ? 'border-transparent bg-[color:var(--accent)] text-[color:var(--accent-tx)]'
                : fit === 'main'
                  ? 'border-line-strong bg-surface text-ink-soft hover:bg-surface-2'
                  : fit === 'dual'
                    ? 'border-[color:var(--gold)] text-[color:var(--gold)] hover:bg-surface-2'
                    : 'border-line text-ink-faint hover:bg-surface-2',
            )}
            title={active ? '현재 배치' : fit === 'off' ? `${pos} · 수비 페널티` : fit === 'dual' ? `${pos} · 듀얼` : pos}
          >
            {pos}
          </button>
        )
      })}
    </div>
  )
}

/** 육성 설정 요약 칩 텍스트 — 풀 「육성」 컬럼·비교창 공용 */
export function growthSummary(g: Growth): string[] {
  const parts: string[] = []
  const sum5 = (v: Record<string, number>) => STAT5.reduce((a, k) => a + (v[k] ?? 0), 0)
  if (g.fixed_position) parts.push(`🔒${g.fixed_position}`)
  if (g.level > 0) parts.push(`Lv${g.level}`)
  if (g.awakening) parts.push('각성')
  if (g.veteran) parts.push('베테랑')
  if (g.team_veteran) parts.push('팀벳')
  if (g.equip) parts.push(`${g.equip.kind}${g.equip.grade}`)
  if (g.coach_training !== '해당없음' && g.coach_training !== '-') parts.push('훈련')
  if (g.special.strength !== '-') parts.push(`강(${g.special.strength})`)
  if (g.special.weakness !== '-') parts.push(`약(${g.special.weakness})`)
  const coop = sum5(g.coop)
  const extra = sum5(g.extra)
  const body = sum5(g.body)
  if (coop !== 0) parts.push(`협동${coop > 0 ? '+' : ''}${coop}`)
  if (extra !== 0) parts.push(`잠재${extra > 0 ? '+' : ''}${extra}`)
  if (body !== 0) parts.push(`체형${body > 0 ? '+' : ''}${body}`)
  return parts
}

/** 베테랑(강/약) 셀 — 일반 카드: 베테랑 여부(베테랑/-) · 유망주: 강/약 훈련 단계(완벽/일반). */
function VetSwCell(
  props:
    | { kind: 'card'; veteran: boolean; title?: string }
    | { kind: 'prospect'; strength: string; weakness: string },
) {
  if (props.kind === 'card')
    return (
      <span
        className={cn('text-[.74rem] font-bold', props.veteran ? 'text-[color:var(--gold)]' : 'text-ink-faint')}
        title={props.title}
      >
        {props.veteran ? '베테랑' : '-'}
      </span>
    )
  const step = (s: string, colorVar: string) =>
    s !== '-' ? (
      <span className="font-semibold" style={{ color: `var(${colorVar})` }}>
        {s}
      </span>
    ) : (
      <span className="text-ink-faint">-</span>
    )
  return (
    <span className="whitespace-nowrap text-[.72rem]">
      {step(props.strength, '--green')}
      <span className="text-ink-faint">/</span>
      {step(props.weakness, '--clay')}
    </span>
  )
}

/** 비교 엔트리 빌더 — 일반 카드 (최종 스탯 = 라인업 적용값 우선, 없으면 카드 기본) */
function batterToCmp(r: PoolPlayer, applied?: Map<string, SlotStats>, growthInfo?: Map<string, Growth>): CmpEntry {
  const b = r.batter!
  const s = r.batter_id ? applied?.get(r.batter_id) : undefined
  const g = r.batter_id ? growthInfo?.get(r.batter_id) : undefined
  const final = {} as Record<Stat5, number>
  for (const k of STAT5) final[k] = s?.final[k] ?? b[k] ?? 0
  return {
    name: b.name,
    gradeCode: b.grade,
    gradeLabel: `${b.grade} · ${gradeName(b.grade)}`,
    sub: `${b.team_code}${b.year != null ? ` · ${b.year}` : ''} · ${b.dual_position ? `${b.position}/${b.dual_position}` : b.position} · ${b.throw_hand}/${b.bat_hand}`,
    applied: !!s,
    final,
    clutch: b.clutch ?? 0,
    potentials: {
      main: [b.potential1, b.potential2, b.potential3].filter((x): x is string => !!x),
      sub: b.sub_potential,
      dual: [b.dual_potential1, b.dual_potential2, b.dual_potential3].filter((x): x is string => !!x),
      dualSub: b.dual_sub_potential,
    },
    growthChips: g ? growthSummary(g) : [],
    growthTitle: g && g.coach_training !== '해당없음' ? `감독훈련: ${g.coach_training}` : undefined,
  }
}

/** 비교 엔트리 빌더 — 유망주 (클러치·등급·잠재력 없음, 5스탯 최종값만) */
function prospectToCmp(it: ProspectItem): CmpEntry {
  const { parsed: p, stats } = it
  const final = {} as Record<Stat5, number>
  for (const k of STAT5) final[k] = stats.final[k]
  return {
    name: p.name,
    gradeCode: null,
    gradeLabel: '유망주',
    sub: `${p.position} · ${p.throw_hand}/${p.bat_hand}`,
    applied: it.pos != null,
    final,
    clutch: null,
    potentials: null,
    growthChips: prospectSummary(p),
    growthTitle: undefined,
  }
}

/** 내 풀(비교 작업대) — 담기 검색 · 타자/투수 탭 · 정렬 테이블 · 행 선택 → 포지션 배치/제거 */
export interface ProspectItem {
  row: RosterProspectRow
  parsed: Prospect
  stats: SlotStats
  /** 라인업 배치 포지션 (null = 미배치) */
  pos: string | null
}

export function PoolPanel({
  lineupPos,
  editable,
  onGrowth,
  onAssign,
  onAssignProspect,
  applied,
  growthInfo,
  prospects = [],
  onProspectEdit,
  onProspectGrowth,
  onProspectDelete,
  onAddProspect,
}: {
  /** batter_id → 현재 배치 포지션 (라인업 배치됨 뱃지 표시용) */
  lineupPos: Map<string, string>
  editable: boolean
  /** 육성 시트 열기 — 라인업 등록 여부 무관 (배치는 야구장) */
  onGrowth?: (batter: Batter) => void
  /** 풀에서 바로 라인업 포지션 배치/이동 (타자) */
  onAssign?: (batter: Batter, pos: LineupPosition) => void
  /** 풀에서 바로 라인업 포지션 배치/이동 (유망주) */
  onAssignProspect?: (row: RosterProspectRow, pos: LineupPosition) => void
  /** batter_id → 적용(최종) 스탯 — 라인업 선수는 풀에서도 최종 스탯 + 증감으로 표시 */
  applied?: Map<string, SlotStats>
  /** batter_id → 육성 설정 (Lv·각성·베테랑·장비 표시) */
  growthInfo?: Map<string, Growth>
  /** 팀 유망주(라인업 등록 여부 무관) — 타자 탭 상단에 고정 표시 */
  prospects?: ProspectItem[]
  onProspectEdit?: (row: RosterProspectRow) => void
  onProspectGrowth?: (row: RosterProspectRow) => void
  onProspectDelete?: (row: RosterProspectRow) => void
  onAddProspect?: () => void
}) {
  const { data: pool = [], isLoading } = usePool()
  const addMut = useAddToPool()
  const rmMut = useRemoveFromPool()

  const [tab, setTab] = useState<(typeof TABS)[number]>('타자')
  const [q, setQ] = useState('')
  const dq = useDebounced(q)
  const { data: hits = [] } = usePlayerSearch(dq)
  const [sel, setSel] = useState<string | null>(null)
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null)
  /** 비교 선택(풀 행 id, 최대 2 → 팝업) */
  const [cmp, setCmp] = useState<string[]>([])

  const isBatterTab = tab === '타자'
  const cols = isBatterTab ? [CMP_COL, ...BATTER_COLS] : PITCHER_COLS
  const toggleCmp = (rowId: string) =>
    setCmp((prev) => (prev.includes(rowId) ? prev.filter((x) => x !== rowId) : [...prev.slice(-1), rowId]))
  /** 비교 대상 → 정규화 엔트리 (유망주·일반 카드 모두, 최종 스탯 기준) */
  const cmpEntries = useMemo(
    () =>
      cmp
        .map((rid) => {
          const pr = prospects.find((it) => it.row.id === rid)
          if (pr) return prospectToCmp(pr)
          const pp = pool.find((r) => r.id === rid && r.batter)
          if (pp) return batterToCmp(pp, applied, growthInfo)
          return null
        })
        .filter((x): x is CmpEntry => !!x),
    [cmp, prospects, pool, applied, growthInfo],
  )
  const counts = useMemo(
    () => ({ 타자: pool.filter((r) => r.batter).length, 투수: pool.filter((r) => r.pitcher).length }),
    [pool],
  )

  const player = (r: PoolPlayer) => (r.batter ?? r.pitcher) as unknown as Record<string, unknown> | null
  const rows = useMemo(() => {
    const base = pool.filter((r) => (isBatterTab ? r.batter : r.pitcher))
    if (!sort) return base
    const { key, dir } = sort
    return [...base].sort((ra, rb) => {
      const a = key === 'grade' ? gradeRank(String(player(ra)?.grade)) : player(ra)?.[key]
      const b = key === 'grade' ? gradeRank(String(player(rb)?.grade)) : player(rb)?.[key]
      if (a == null && b == null) return 0
      if (a == null) return 1 // null 은 항상 뒤로
      if (b == null) return -1
      if (typeof a === 'number' && typeof b === 'number') return (a - b) * dir
      return String(a).localeCompare(String(b), 'ko') * dir
    })
  }, [pool, isBatterTab, sort])

  const clickSort = (c: Col) => {
    if (NO_SORT.has(c.key)) return
    setSort((prev) =>
      prev?.key === c.key
        ? { key: c.key, dir: prev.dir === 1 ? -1 : 1 }
        : { key: c.key, dir: c.num ? -1 : 1 }, // 숫자는 높은 값 먼저
    )
  }

  const add = (kind: 'batter' | 'pitcher', id: string, name: string) =>
    addMut.mutate(kind === 'batter' ? { batter_id: id } : { pitcher_id: id }, {
      onSuccess: () => toast(`「${name}」 풀에 담았습니다`),
      onError: (e) => toast.error(e.message),
    })

  return (
    <Panel
      title="내 풀 · 비교 작업대"
      right={<span className="text-[.72rem] text-ink-faint tabular-nums">중복 담기 가능</span>}
      className="min-w-0"
    >
      {/* 담기 검색 */}
      <div className="relative mb-2">
        <Input placeholder="선수 이름 검색해서 풀에 담기…" value={q} onChange={(e) => setQ(e.target.value)} />
        {q.trim() && hits.length > 0 && (
          <div className="absolute z-30 mt-1 w-full max-h-64 overflow-auto rounded-lg border border-line-strong bg-surface shadow-[var(--shadow)]">
            {hits.map((h) => (
              <button
                key={`${h.kind}-${h.id}`}
                type="button"
                onClick={() => add(h.kind, h.id, h.name)}
                className="flex w-full items-center gap-2 px-2.5 py-[6px] text-left text-[.8rem] hover:bg-surface-2 cursor-pointer"
              >
                <span className="w-4 text-[.66rem] font-bold text-ink-faint">{h.kind === 'batter' ? '타' : '투'}</span>
                <span className="font-extrabold" style={{ color: `var(${gradeCssVar(h.grade)})` }}>
                  {h.grade}
                </span>
                <span className="font-semibold">{h.name}</span>
                <span className="text-ink-faint text-[.72rem]">
                  {h.team_code} · {h.position}
                  {h.year != null && ` · ${h.year}`}
                </span>
                <span className="ml-auto text-[.7rem] font-bold text-[color:var(--green)]">+ 담기</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mb-2 flex items-center gap-2">
        <div className="w-[180px]">
          <Segmented
            options={TABS.map((t) => `${t} ${counts[t]}`)}
            value={`${tab} ${counts[tab]}`}
            onChange={(v) => {
              setTab(v.startsWith('타자') ? '타자' : '투수')
              setSel(null)
              setSort(null)
            }}
          />
        </div>
        {editable && onAddProspect && isBatterTab && (
          <Button variant="outline" className="!px-2.5 !py-[5px] !text-[.76rem] text-[color:var(--green)] border-[color:var(--green)]" onClick={onAddProspect}>
            + 유망주
          </Button>
        )}
      </div>

      {/* 비교 테이블 (클라이언트 정렬) */}
      <div className="max-h-[560px] overflow-auto rounded-lg border border-line">
        <table className="w-full text-[.76rem] border-collapse whitespace-nowrap [&_th]:px-1.5 [&_th]:py-1.5 [&_td]:px-1.5 [&_td]:py-[5px]">
          <thead className="sticky top-0 z-10">
            <tr className="text-[.6rem] uppercase tracking-[.04em] text-ink-faint bg-surface-2">
              {cols.map((c) => (
                <th key={c.key} className={cn('cursor-pointer select-none hover:text-ink', c.num ? 'text-right' : 'text-left')} onClick={() => clickSort(c)}>
                  {c.label}
                  {sort?.key === c.key && <span className="text-[color:var(--accent)]">{sort.dir === 1 ? '↑' : '↓'}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* 팀 유망주 — 타자 탭 상단 고정 (라인업 등록 여부 무관, 풀에서 설정/배치/삭제) */}
            {isBatterTab &&
              prospects.map((it) => (
                <ProspectRowView
                  key={it.row.id}
                  it={it}
                  cols={cols}
                  editable={editable}
                  selected={sel === it.row.id}
                  onSelect={() => setSel(sel === it.row.id ? null : it.row.id)}
                  onEdit={onProspectEdit}
                  onGrowth={onProspectGrowth}
                  onDelete={onProspectDelete}
                  onAssign={onAssignProspect ? (pos) => onAssignProspect(it.row, pos) : undefined}
                  compare={{ checked: cmp.includes(it.row.id), onToggle: () => toggleCmp(it.row.id) }}
                />
              ))}
            {rows.map((r) => {
              const p = player(r)
              if (!p) return null
              const inLineup = !!r.batter_id && lineupPos.has(r.batter_id)
              const selected = sel === r.id
              return (
                <FragmentRow
                  key={r.id}
                  row={r}
                  cols={cols}
                  selected={selected}
                  inLineup={inLineup}
                  onSelect={() => setSel(selected ? null : r.id)}
                  compare={isBatterTab && r.batter ? { checked: cmp.includes(r.id), onToggle: () => toggleCmp(r.id) } : undefined}
                  applied={r.batter_id ? applied?.get(r.batter_id) : undefined}
                  growth={r.batter_id ? growthInfo?.get(r.batter_id) : undefined}
                >
                  {selected && (
                    <tr className="bg-surface-2/70">
                      <td colSpan={cols.length}>
                        <div className="flex flex-wrap items-center gap-1 py-1">
                          {r.batter && editable && onAssign && (
                            <PositionChips
                              fitOf={(pos) => positionFit(r.batter!, pos)}
                              current={r.batter_id ? lineupPos.get(r.batter_id) ?? null : null}
                              onPick={(pos) => onAssign(r.batter!, pos)}
                            />
                          )}
                          <span className="ml-auto flex gap-1">
                            {r.batter && editable && onGrowth && (
                              <Button
                                variant="outline"
                                className="!px-2 !py-[3px] !text-[.7rem] font-bold text-[color:var(--gold)] border-[color:var(--gold)]"
                                onClick={() => onGrowth(r.batter!)}
                              >
                                육성 설정
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              className="!px-2 !py-1 !text-[.7rem] text-[color:var(--clay)]"
                              onClick={() => rmMut.mutate(r.id, { onSuccess: () => setSel(null) })}
                            >
                              풀에서 제거
                            </Button>
                          </span>
                        </div>
                      </td>
                    </tr>
                  )}
                </FragmentRow>
              )
            })}
          </tbody>
        </table>
        {!isLoading && rows.length === 0 && (
          <div className="p-6 text-center text-[.8rem] text-ink-faint">
            풀이 비었습니다 — 위 검색이나 선수 목록의 「+풀」 버튼으로 담아보세요
          </div>
        )}
      </div>
      {isBatterTab && cmp.length === 1 && (
        <div className="mt-1.5 text-[.7rem] text-ink-soft">⚖ 비교할 선수를 한 명 더 체크하면 비교 팝업이 열립니다</div>
      )}

      {cmpEntries.length === 2 && <CompareModal a={cmpEntries[0]} b={cmpEntries[1]} onClose={() => setCmp([])} />}
    </Panel>
  )
}

/** 데이터 행 + (선택 시) 액션 행 */
function FragmentRow({
  row,
  cols,
  selected,
  inLineup,
  onSelect,
  compare,
  applied,
  growth,
  children,
}: {
  row: PoolPlayer
  cols: Col[]
  selected: boolean
  inLineup: boolean
  onSelect: () => void
  /** 비교 체크(타자 탭만) */
  compare?: { checked: boolean; onToggle: () => void }
  /** 라인업 적용(최종) 스탯 — 있으면 구간색 + 증감으로 표시 */
  applied?: SlotStats
  /** 라인업 선수의 육성 설정 요약 */
  growth?: Growth
  children: React.ReactNode
}) {
  const p = (row.batter ?? row.pitcher)! as unknown as Record<string, unknown>
  const cell = (c: Col) => {
    if (c.key === '_cmp') {
      if (!compare) return null
      return (
        <span onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            className="cursor-pointer accent-[var(--accent)]"
            checked={compare.checked}
            onChange={compare.onToggle}
            title="선수 비교에 추가 (2명)"
          />
        </span>
      )
    }
    if (c.key === '_lv') {
      const lv = growth && growth.level > 0 ? String(growth.level) : '—'
      const full = growth ? growthSummary(growth).join('·') || '기본' : undefined
      return (
        <span className="font-mono tabular-nums text-ink-soft" title={full}>
          {lv}
        </span>
      )
    }
    if (c.key === '_vetsw')
      return <VetSwCell kind="card" veteran={!!growth?.veteran} title={growth?.team_veteran ? '팀 베테랑 지정됨' : undefined} />


    if (applied && APPLIED_KEYS.has(c.key)) {
      const k = c.key as Stat5
      const fin = applied.final[k]
      const d = fin - applied.base[k]
      const tier = statTier(fin)
      const items = applied.breakdown[k]
      return (
        <HoverTip
          tip={
            items.length ? (
              <div className="flex flex-col gap-[2px]">
                <div className="text-ink-faint">
                  기본 {applied.base[k]} → <b className="text-ink">{fin}</b>
                  <span className="ml-1" style={{ color: tier.color }}>
                    {tier.label}
                  </span>
                </div>
                {items.map((it, i) => (
                  <div key={i} className="flex justify-between gap-3">
                    <span>{it.label}</span>
                    <b className={it.delta > 0 ? 'text-[color:var(--green)]' : 'text-[color:var(--clay)]'}>
                      {it.delta > 0 ? `+${it.delta}` : it.delta}
                    </b>
                  </div>
                ))}
              </div>
            ) : undefined
          }
        >
          <span className="font-mono tabular-nums whitespace-nowrap">
            <b className={tier.cls} style={{ color: tier.color }}>{fin}</b>
            {d !== 0 && (
              <span className={cn('ml-0.5 text-[.62rem]', d > 0 ? 'text-[color:var(--green)]' : 'text-[color:var(--clay)]')}>
                {d > 0 ? `+${d}` : d}
              </span>
            )}
          </span>
        </HoverTip>
      )
    }
    if (c.key === 'grade') {
      return <GradeMark grade={String(p.grade)} />
    }
    if (c.key === 'name')
      return (
        <span className="flex items-center gap-1">
          <span className="inline-block max-w-[7rem] truncate font-semibold" title={String(p.name)}>
            {String(p.name)}
          </span>
          {inLineup && <span className="shrink-0 text-[.62rem] font-bold text-[color:var(--green)]">⚾라인업</span>}
        </span>
      )
    if (c.key === 'position') {
      const dual = p.dual_position as string | null
      return dual ? `${p.position}/${dual}` : String(p.position)
    }
    const v = p[c.key]
    return v == null ? '—' : String(v)
  }
  return (
    <>
      <tr
        onClick={onSelect}
        className={cn(
          'border-t border-line cursor-pointer transition',
          selected ? 'bg-surface-2' : 'hover:bg-surface-2/60',
          inLineup && 'bg-[color:color-mix(in_srgb,var(--green)_6%,transparent)]',
        )}
      >
        {cols.map((c) => (
          <td key={c.key} className={cn(c.num && 'text-right font-mono tabular-nums text-ink-soft')}>
            {cell(c)}
          </td>
        ))}
      </tr>
      {children}
    </>
  )
}

/** 유망주 육성 요약 칩 (풀 Lv 셀 title · 비교창) — 부분 배열, 없으면 [] */
function prospectSummary(p: Prospect): string[] {
  if (!prospectHasGrowth(p)) return []
  const parts: string[] = []
  const done = p.steps.filter((s) => s !== '-').length
  const perfect = p.steps.filter((s) => s === '완벽').length
  if (done > 0) parts.push(`성장${done}/7`)
  if (perfect > 0) parts.push(`완벽${perfect}`)
  if (p.rising) parts.push('라이징')
  if (p.roy_awaken) parts.push('ROY각성')
  if (p.strength !== '-') parts.push(`강(${p.strength})`)
  if (p.weakness !== '-') parts.push(`약(${p.weakness})`)
  if (p.equip) parts.push(`${p.equip.kind}${p.equip.grade}`)
  return parts
}

/** 유망주 행 — 데이터 행 + (선택 시) 설정/육성/삭제 액션 행 (배치는 야구장에서) */
function ProspectRowView({
  it,
  cols,
  editable,
  selected,
  onSelect,
  onEdit,
  onGrowth,
  onDelete,
  onAssign,
  compare,
}: {
  it: ProspectItem
  cols: Col[]
  editable: boolean
  selected: boolean
  onSelect: () => void
  onEdit?: (row: RosterProspectRow) => void
  onGrowth?: (row: RosterProspectRow) => void
  onDelete?: (row: RosterProspectRow) => void
  /** 풀에서 바로 라인업 포지션 배치/이동 */
  onAssign?: (pos: LineupPosition) => void
  /** 비교 체크 (유망주도 최종 스탯으로 비교) */
  compare?: { checked: boolean; onToggle: () => void }
}) {
  const { row, parsed: p, stats, pos } = it
  const cell = (c: Col) => {
    if (c.key === '_cmp') {
      if (!compare) return null
      return (
        <span onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            className="cursor-pointer accent-[var(--accent)]"
            checked={compare.checked}
            onChange={compare.onToggle}
            title="선수 비교에 추가 (2명)"
          />
        </span>
      )
    }
    if (c.key === 'grade') return <GradeMark grade={null} />

    if (c.key === 'name')
      return (
        <span className="flex items-center gap-1">
          <span className="inline-block max-w-[7rem] truncate font-semibold" title={p.name}>
            {p.name}
          </span>
          {pos && <span className="shrink-0 text-[.62rem] font-bold text-[color:var(--green)]">⚾{pos}</span>}
        </span>
      )
    if (c.key === 'position') return p.position
    if (c.key === '_lv') {
      const perfect = p.steps.filter((s) => s === '완벽').length
      return (
        <span className="font-mono tabular-nums text-ink-soft" title={prospectSummary(p).join('·') || '기본'}>
          {perfect}/7
        </span>
      )
    }
    if (c.key === '_vetsw') return <VetSwCell kind="prospect" strength={p.strength} weakness={p.weakness} />
    if (APPLIED_KEYS.has(c.key)) {
      const k = c.key as Stat5
      const fin = stats.final[k]
      const d = fin - stats.base[k]
      const tier = statTier(fin)
      const items = stats.breakdown[k]
      return (
        <HoverTip
          tip={
            items.length ? (
              <div className="flex flex-col gap-[2px]">
                <div className="text-ink-faint">
                  기본 {stats.base[k]} → <b className="text-ink">{fin}</b>
                  <span className="ml-1" style={{ color: tier.color }}>
                    {tier.label}
                  </span>
                </div>
                {items.map((x, i) => (
                  <div key={i} className="flex justify-between gap-3">
                    <span>{x.label}</span>
                    <b className={x.delta > 0 ? 'text-[color:var(--green)]' : 'text-[color:var(--clay)]'}>
                      {x.delta > 0 ? `+${x.delta}` : x.delta}
                    </b>
                  </div>
                ))}
              </div>
            ) : undefined
          }
        >
          <span className="font-mono tabular-nums whitespace-nowrap">
            <b className={tier.cls} style={{ color: tier.color }}>{fin}</b>
            {d !== 0 && (
              <span className={cn('ml-0.5 text-[.62rem]', d > 0 ? 'text-[color:var(--green)]' : 'text-[color:var(--clay)]')}>
                {d > 0 ? `+${d}` : d}
              </span>
            )}
          </span>
        </HoverTip>
      )
    }
    return '—'
  }
  return (
    <>
      <tr
        onClick={onSelect}
        className={cn(
          'border-t border-line cursor-pointer transition bg-[color:color-mix(in_srgb,var(--green)_5%,transparent)]',
          selected ? 'bg-surface-2' : 'hover:bg-surface-2/60',
        )}
      >
        {cols.map((c) => (
          <td key={c.key} className={cn(c.num && 'text-right font-mono tabular-nums text-ink-soft')}>
            {cell(c)}
          </td>
        ))}
      </tr>
      {selected && (
        <tr className="bg-surface-2/70">
          <td colSpan={cols.length}>
            <div className="flex flex-wrap items-center gap-1 py-1">
              {editable && onAssign ? (
                <PositionChips
                  fitOf={(pp) => positionFit({ position: p.position, dual_position: null }, pp)}
                  current={pos}
                  onPick={onAssign}
                />
              ) : (
                <span className="text-[.7rem] text-ink-faint">{pos ? `⚾ ${pos} 배치됨` : '미배치'}</span>
              )}
              <span className="ml-auto flex gap-1">
                {editable && onEdit && (
                  <Button variant="outline" className="!px-2 !py-[3px] !text-[.7rem] font-bold" onClick={() => onEdit(row)}>
                    설정
                  </Button>
                )}
                {editable && onGrowth && (
                  <Button
                    variant="outline"
                    className="!px-2 !py-[3px] !text-[.7rem] font-bold text-[color:var(--gold)] border-[color:var(--gold)]"
                    onClick={() => onGrowth(row)}
                  >
                    육성
                  </Button>
                )}
                {editable && onDelete && (
                  <Button variant="ghost" className="!px-2 !py-1 !text-[.7rem] text-[color:var(--clay)]" onClick={() => onDelete(row)}>
                    삭제
                  </Button>
                )}
              </span>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

