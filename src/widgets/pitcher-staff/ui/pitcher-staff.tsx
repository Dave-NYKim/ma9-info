import { useState, type DragEvent } from 'react'
import { RELIEF_SIZE, STARTER_SIZE, type PitcherRole, type RosterPitcher } from '@entities/roster'
import { WeatherIcon, WEATHER_COLOR } from '@features/weather-picker/ui/icons'
import { gradeBarBg, gradeCardBgSoft, gradeCssVar } from '@shared/config/grades'
import { pitcherUnitCost, type PitcherCost } from '@shared/lib/stat-engine'
import { cn } from '@shared/lib/cn'
import { GradeMark } from '@shared/ui'

/** slot_order(1..size) 로 희소 배열을 채워 고정 칸 렌더 */
function bySlot(list: RosterPitcher[], size: number): (RosterPitcher | null)[] {
  const arr: (RosterPitcher | null)[] = Array.from({ length: size }, () => null)
  for (const p of list) if (p.slot_order >= 1 && p.slot_order <= size) arr[p.slot_order - 1] = p
  return arr
}

const GRID = '[grid-template-columns:repeat(auto-fill,minmax(180px,1fr))]'

/** 드래그앤드랍 핸들러 묶음 (카드/빈칸 공용) */
interface Dnd {
  draggable: boolean
  dragging: boolean
  over: boolean
  onDragStart?: () => void
  onDragEnd: () => void
  onDragOver: (e: DragEvent) => void
  onDragLeave: () => void
  onDrop: (e: DragEvent) => void
}

/** 투수진 패널 — 야구장 아래 「투수」 토글에서 노출.
 *  선발 5 · 계투 18 모두 요약 카드(등급·연도·이름·주/부날씨·투타). 선발만 클릭=등판 지정.
 *  순서 변경 = 드래그(같은 역할 안에서 교환/이동). ※ 투수 스탯 계산 없음. */
export function PitcherStaff({
  starters,
  relief,
  cost,
  editable,
  onSelectStarter,
  onRemove,
  onReorder,
  onEmpty,
}: {
  starters: RosterPitcher[]
  relief: RosterPitcher[]
  cost: PitcherCost
  editable: boolean
  onSelectStarter: (p: RosterPitcher) => void
  onRemove: (p: RosterPitcher) => void
  /** 드래그 순서 변경 — dragged 를 (그 역할의) slot 자리로. target = 그 자리 투수(빈 자리면 null) */
  onReorder: (dragged: RosterPitcher, slot: number, target: RosterPitcher | null) => void
  onEmpty: (role: PitcherRole, slot: number) => void
}) {
  const starterSlots = bySlot(starters, STARTER_SIZE)
  const reliefSlots = bySlot(relief, RELIEF_SIZE)

  const [dragId, setDragId] = useState<string | null>(null)
  const [overKey, setOverKey] = useState<string | null>(null)
  const draggedRole = [...starters, ...relief].find((p) => p.id === dragId)?.role ?? null

  const drop = (role: PitcherRole, slot: number, target: RosterPitcher | null) => {
    const dragged = [...starters, ...relief].find((p) => p.id === dragId)
    setDragId(null)
    setOverKey(null)
    if (!dragged || dragged.role !== role) return // 같은 역할끼리만
    if (target && target.id === dragged.id) return
    if (!target && dragged.slot_order === slot) return
    onReorder(dragged, slot, target)
  }

  /** (role, slot) 칸의 DnD 핸들러 — p 있으면 draggable, 같은 역할 드래그 중이면 drop 가능 */
  const dnd = (role: PitcherRole, slot: number, p: RosterPitcher | null): Dnd => {
    const key = `${role}:${slot}`
    const canDrop = dragId != null && draggedRole === role
    return {
      draggable: editable && !!p,
      dragging: !!p && dragId === p.id,
      over: overKey === key && canDrop && p?.id !== dragId,
      onDragStart: p ? () => setDragId(p.id) : undefined,
      onDragEnd: () => {
        setDragId(null)
        setOverKey(null)
      },
      onDragOver: (e) => {
        if (canDrop) {
          e.preventDefault()
          setOverKey(key)
        }
      },
      onDragLeave: () => setOverKey((v) => (v === key ? null : v)),
      onDrop: (e) => {
        e.preventDefault()
        drop(role, slot, p)
      },
    }
  }

  return (
    <div className="rounded-xl border border-line bg-surface p-3 shadow-[var(--shadow)]">
      {/* 헤더 — 코스트 소계 */}
      <div className="mb-2 flex items-center gap-2">
        <span className="text-[.64rem] font-bold uppercase tracking-[.08em] text-ink-faint">선발 로테이션</span>
        <span className="text-[.66rem] text-ink-faint">클릭 = 등판 · 드래그 = 순서</span>
        <span className="ml-auto text-[.74rem] tabular-nums text-ink-soft">
          선발 <b className="text-ink">{cost.starter}</b>
          <span className="text-ink-faint"> · </span>
          계투 <b className="text-ink">{cost.relief}</b>
          <span className="text-ink-faint"> · </span>
          투수 <b className="text-[color:var(--blue)]">{cost.total}</b>
        </span>
      </div>

      {/* 선발 5 */}
      <div className={cn('grid gap-2 mb-4', GRID)}>
        {starterSlots.map((p, i) =>
          p ? (
            <SummaryCard
              key={p.id}
              p={p}
              editable={editable}
              dnd={dnd('선발', i + 1, p)}
              onClick={editable ? () => onSelectStarter(p) : undefined}
              onRemove={() => onRemove(p)}
            />
          ) : (
            <EmptyCard key={`s-${i}`} label={`+ 선발 ${i + 1}`} editable={editable} dnd={dnd('선발', i + 1, null)} onClick={() => onEmpty('선발', i + 1)} />
          ),
        )}
      </div>

      {/* 계투 18 */}
      <div className="mb-1 flex items-center gap-2">
        <span className="text-[.64rem] font-bold uppercase tracking-[.08em] text-ink-faint">계투</span>
        <span className="text-[.66rem] text-ink-faint">전원 코스트 (RP · CP)</span>
        <span className="ml-auto text-[.7rem] font-bold tabular-nums text-ink-soft">{relief.length} / {RELIEF_SIZE}</span>
      </div>
      {/* 날씨 집계 (주 + 부) */}
      <div className="mb-2">
        <WeatherTally relief={relief} />
      </div>
      <div className={cn('grid gap-2', GRID)}>
        {reliefSlots.map((p, i) =>
          p ? (
            <SummaryCard key={p.id} p={p} editable={editable} dnd={dnd('계투', i + 1, p)} onRemove={() => onRemove(p)} />
          ) : (
            <EmptyCard key={`r-${i}`} label="＋ 계투" editable={editable} dnd={dnd('계투', i + 1, null)} onClick={() => onEmpty('계투', i + 1)} />
          ),
        )}
      </div>
    </div>
  )
}

/** 역보(역날씨) = 주+부 날씨가 실제로 이 쌍일 때만. 해+구름 · 비+눈. (눈+구름 같은 조합은 아님) */
const REVERSE_PAIRS: [string, string][] = [
  ['해', '구름'],
  ['비', '눈'],
]
/** 주·부날씨가 역보 쌍을 이루는가 (둘 다 있어야 하고 순서 무관) */
function isReverseWeather(w?: string | null, sw?: string | null): boolean {
  if (!w || !sw) return false
  return REVERSE_PAIRS.some(([a, b]) => (w === a && sw === b) || (w === b && sw === a))
}
const WEATHER_LIST = ['해', '구름', '비', '눈', '무속'] // 집계 표시 순서

/** 날씨 아이콘 + 개수 (0이면 흐림) */
function WChip({ w, n }: { w: string; n: number }) {
  return (
    <span className={cn('flex items-center gap-0.5 tabular-nums text-[.78rem]', n === 0 && 'opacity-35')} title={w}>
      <span style={{ color: WEATHER_COLOR[w] }}>
        <WeatherIcon name={w} />
      </span>
      <b className="text-ink">{n}</b>
    </span>
  )
}

/** 계투 날씨 분포 — 주날씨 / 부날씨 좌우로 각각 개수. */
function WeatherTally({ relief }: { relief: RosterPitcher[] }) {
  const main: Record<string, number> = {}
  const sub: Record<string, number> = {}
  for (const p of relief) {
    if (p.pitcher?.weather) main[p.pitcher.weather] = (main[p.pitcher.weather] ?? 0) + 1
    if (p.pitcher?.sub_weather) sub[p.pitcher.sub_weather] = (sub[p.pitcher.sub_weather] ?? 0) + 1
  }
  const Block = ({ label, tally }: { label: string; tally: Record<string, number> }) => (
    <div className="flex flex-col gap-1">
      <span className="text-[.6rem] font-bold uppercase tracking-[.06em] text-ink-faint">{label}</span>
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
        {WEATHER_LIST.map((w) => (
          <WChip key={w} w={w} n={tally[w] ?? 0} />
        ))}
      </div>
    </div>
  )
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-2 rounded-lg border border-line bg-surface-2 px-2.5 py-2">
      <Block label="주날씨" tally={main} />
      <Block label="부날씨" tally={sub} />
    </div>
  )
}

/** 투수 요약 카드 — 등급·연도·이름·주/부날씨·투타만. 선발(onClick)은 클릭=등판, 등판=링+태그. 드래그=순서. */
function SummaryCard({
  p,
  editable,
  dnd,
  onClick,
  onRemove,
}: {
  p: RosterPitcher
  editable: boolean
  dnd: Dnd
  /** 있으면 선발(클릭=등판 지정) */
  onClick?: () => void
  onRemove: () => void
}) {
  const pit = p.pitcher
  if (!pit) return null
  const grade = pit.grade
  const weathers = [pit.weather, pit.sub_weather].filter((w): w is string => !!w)
  const rev = isReverseWeather(pit.weather, pit.sub_weather) // 주+부가 역보 쌍(해+구름 / 비+눈)
  const isStarter = p.role === '선발'
  const on = p.active
  const clickable = !!onClick
  const unit = pitcherUnitCost(grade)

  return (
    <div
      draggable={dnd.draggable}
      onDragStart={dnd.onDragStart}
      onDragEnd={dnd.onDragEnd}
      onDragOver={dnd.onDragOver}
      onDragLeave={dnd.onDragLeave}
      onDrop={dnd.onDrop}
      className={cn(
        'relative group rounded-lg transition',
        isStarter && on && 'outline outline-2 outline-offset-2 outline-[color:var(--accent)]',
        isStarter && !on && 'opacity-[.82]',
        dnd.dragging && 'opacity-40',
        dnd.over && 'outline outline-2 outline-offset-2 outline-dashed outline-[color:var(--accent)]',
        editable && 'cursor-grab active:cursor-grabbing',
      )}
    >
      <div
        role={clickable ? 'button' : undefined}
        tabIndex={clickable ? 0 : undefined}
        onClick={onClick}
        onKeyDown={clickable ? (e) => (e.key === 'Enter' || e.key === ' ') && onClick?.() : undefined}
        className="overflow-hidden rounded-lg border-2 shadow-[var(--shadow)] transition"
        style={{
          borderColor: `var(${gradeCssVar(grade)})`,
          background: gradeCardBgSoft(grade),
          ...(grade === 'B' ? { boxShadow: '0 0 0 1px rgba(255,255,255,.45), var(--shadow)' } : {}),
        }}
      >
        <div className="h-1 w-full" style={{ background: gradeBarBg(grade) }} />
        <div className="flex flex-col gap-1 p-2">
          {/* 등급 · 이름 · 날씨 */}
          <div className="flex items-center gap-1 min-w-0">
            <GradeMark grade={grade} className="!min-w-[1.7rem] !text-[.6rem]" />
            <span className="truncate text-[.82rem] font-extrabold text-ink" title={pit.name}>
              {pit.name}
            </span>
            <span className="ml-auto flex shrink-0 items-center gap-1">
              {weathers.map((w, i) => (
                <span key={i} style={{ color: WEATHER_COLOR[w] }} title={w}>
                  <WeatherIcon name={w} />
                </span>
              ))}
            </span>
          </div>
          {/* 연도 · 투타 · (역보 ON) */}
          <div className="flex items-center gap-1.5 text-[.68rem] text-ink-soft">
            {pit.year != null && (
              <span className="rounded border border-line-strong bg-surface px-1 py-[1px] text-[.62rem] font-bold tabular-nums text-ink">
                {pit.year}
              </span>
            )}
            <span className="tabular-nums">
              {pit.throw_hand}/{pit.bat_hand}
            </span>
            {rev && (
              <span
                className="ml-auto rounded-full border border-[color:var(--accent)] px-1.5 py-[1px] text-[.56rem] font-extrabold text-[color:var(--accent)]"
                title={`역보(역날씨) · ${pit.weather} + ${pit.sub_weather}`}
              >
                역보 ON
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 선발 등판/대기 태그 (좌상단) */}
      {isStarter && (
        <span
          className="absolute -top-2 left-2 z-20 rounded-full border px-2 py-[1px] text-[.62rem] font-extrabold tabular-nums shadow-[var(--shadow)]"
          style={
            on
              ? { background: 'var(--green)', color: 'var(--surface)', borderColor: 'var(--green)' }
              : { background: 'var(--surface)', color: 'var(--ink-faint)', borderColor: 'var(--ink-faint)' }
          }
        >
          {on ? `등판 · ${unit}` : '대기 · 0'}
        </span>
      )}

      {editable && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="absolute -top-2 -right-2 z-20 hidden group-hover:flex h-[20px] w-[20px] items-center justify-center rounded-full bg-ink text-[.66rem] text-[color:var(--surface)] cursor-pointer shadow-[var(--shadow)]"
          title="투수진에서 제거"
        >
          ✕
        </button>
      )}
    </div>
  )
}

/** 빈 칸 — 점선 추가 카드(드래그 드랍 대상 포함). 읽기전용이면 밋밋한 빈 칸. */
function EmptyCard({
  label,
  editable,
  dnd,
  onClick,
}: {
  label: string
  editable: boolean
  dnd: Dnd
  onClick: () => void
}) {
  if (!editable) return <div className="min-h-[64px] rounded-lg border border-dashed border-line" />
  return (
    <button
      type="button"
      onClick={onClick}
      onDragOver={dnd.onDragOver}
      onDragLeave={dnd.onDragLeave}
      onDrop={dnd.onDrop}
      className={cn(
        'flex min-h-[64px] items-center justify-center rounded-lg border-2 border-dashed border-line-strong text-[.76rem] font-bold text-ink-faint transition cursor-pointer hover:text-[color:var(--accent)] hover:border-[color:var(--accent)] hover:bg-surface-2',
        dnd.over && 'border-[color:var(--accent)] text-[color:var(--accent)] bg-[color:color-mix(in_srgb,var(--accent)_8%,transparent)]',
      )}
      title="투수 추가"
    >
      {label}
    </button>
  )
}
