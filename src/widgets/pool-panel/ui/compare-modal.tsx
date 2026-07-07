import type { Batter } from '@entities/batter'
import type { PoolPlayer } from '@entities/pool'
import { STAT5, STAT5_LABEL, statTier, type Growth, type Stat5 } from '@shared/config/team-stats'
import type { SlotStats } from '@shared/lib/stat-engine'
import { gradeBarBg, gradeCardBg, gradeName, GRADE_ACCENT_TEXT } from '@shared/config/grades'
import { Badge, Button } from '@shared/ui'
import { cn } from '@shared/lib/cn'
import { growthSummary } from './pool-panel'

/** 선수 2명 비교 팝업 — 최종 스탯만, 두 선수 간 차이만 표시. 우세 쪽 크게·구간색, 열세 흐림. 잠재력 포함. */
export function CompareModal({
  a,
  b,
  applied,
  growthInfo,
  onClose,
}: {
  a: PoolPlayer
  b: PoolPlayer
  /** batter_id → 라인업 적용 스탯 (없으면 카드 기본 스탯이 곧 최종) */
  applied: Map<string, SlotStats>
  /** batter_id → 육성 설정 (베테랑·장비·체형 등 표시) */
  growthInfo: Map<string, Growth>
  onClose: () => void
}) {
  const ba = a.batter!
  const bb = b.batter!
  const sa = a.batter_id ? applied.get(a.batter_id) : undefined
  const sb = b.batter_id ? applied.get(b.batter_id) : undefined
  const ga = a.batter_id ? growthInfo.get(a.batter_id) : undefined
  const gb = b.batter_id ? growthInfo.get(b.batter_id) : undefined
  const val = (bt: Batter, s: SlotStats | undefined, k: Stat5) => s?.final[k] ?? bt[k] ?? 0
  const sumA = STAT5.reduce((acc, k) => acc + val(ba, sa, k), 0)
  const sumB = STAT5.reduce((acc, k) => acc + val(bb, sb, k), 0)

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-[720px] my-8 rounded-2xl border border-line bg-surface shadow-[var(--shadow)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 — 양쪽 등급색 */}
        <div className="grid grid-cols-[1fr_auto_1fr]">
          <PlayerHead b={ba} applied={!!sa} align="left" />
          <div className="flex items-center px-3 text-[1.1rem] font-extrabold text-ink-faint">VS</div>
          <PlayerHead b={bb} applied={!!sb} align="right" />
        </div>

        {/* 최종 스탯 비교 */}
        <div className="px-5 py-3 flex flex-col">
          {STAT5.map((k) => (
            <CompareRow key={k} label={STAT5_LABEL[k]} a={val(ba, sa, k)} b={val(bb, sb, k)} tiered />
          ))}
          <CompareRow label="클러치" a={ba.clutch ?? 0} b={bb.clutch ?? 0} />
          <div className="mt-1 border-t border-line-strong pt-2">
            <CompareRow label="5스탯 합" a={sumA} b={sumB} big />
          </div>
        </div>

        {/* 잠재력 */}
        <div className="grid grid-cols-[1fr_auto_1fr] gap-3 border-t border-line px-5 py-3">
          <PotentialCol b={ba} align="left" />
          <div className="flex items-center text-[.64rem] font-bold uppercase tracking-[.08em] text-ink-faint">잠재력</div>
          <PotentialCol b={bb} align="right" />
        </div>

        {/* 육성 설정 (레벨·베테랑·장비·체형 등) */}
        <div className="grid grid-cols-[1fr_auto_1fr] gap-3 border-t border-line px-5 py-3">
          <GrowthCol g={ga} align="left" />
          <div className="flex items-center text-[.64rem] font-bold uppercase tracking-[.08em] text-ink-faint">육성</div>
          <GrowthCol g={gb} align="right" />
        </div>

        <div className="flex justify-end px-5 pb-4">
          <Button variant="outline" onClick={onClose}>
            닫기
          </Button>
        </div>
      </div>
    </div>
  )
}

function PlayerHead({ b, applied, align }: { b: Batter; applied: boolean; align: 'left' | 'right' }) {
  const right = align === 'right'
  return (
    <div className={cn('p-4', right && 'text-right')} style={{ background: gradeCardBg(b.grade) }}>
      <div className="h-1 -mt-4 -mx-4 mb-3" style={{ background: gradeBarBg(b.grade) }} />
      <div className={cn('flex items-center gap-1.5', right && 'justify-end')}>
        <Badge color={gradeBarBg(b.grade)} text={GRADE_ACCENT_TEXT[b.grade] ?? '#fff'}>
          {b.grade} · {gradeName(b.grade)}
        </Badge>
        {applied && <Badge color="var(--green)">라인업</Badge>}
      </div>
      <div className="mt-1 text-[1.25rem] font-extrabold leading-tight truncate">{b.name}</div>
      <div className="text-[.74rem] text-ink-soft">
        {b.team_code}
        {b.year != null && ` · ${b.year}`} · {b.dual_position ? `${b.position}/${b.dual_position}` : b.position} · {b.throw_hand}/
        {b.bat_hand}
      </div>
    </div>
  )
}

function CompareRow({ label, a, b, tiered, big }: { label: string; a: number; b: number; tiered?: boolean; big?: boolean }) {
  const diff = a - b
  return (
    <div className="grid grid-cols-[1fr_84px_1fr] items-center py-[5px]">
      <SideVal v={a} right win={diff > 0} lose={diff < 0} diff={diff} tiered={tiered} big={big} />
      <div className="text-center text-[.68rem] font-bold uppercase tracking-[.08em] text-ink-faint">{label}</div>
      <SideVal v={b} win={diff < 0} lose={diff > 0} diff={-diff} tiered={tiered} big={big} />
    </div>
  )
}

function SideVal({
  v,
  right,
  win,
  lose,
  diff,
  tiered,
  big,
}: {
  v: number
  right?: boolean
  win: boolean
  lose: boolean
  diff: number
  tiered?: boolean
  big?: boolean
}) {
  const color = tiered ? statTier(v).color : undefined
  return (
    <div className={cn('flex items-baseline gap-1.5', right ? 'justify-end' : 'flex-row-reverse justify-end')}>
      {win && diff !== 0 && (
        <span className="text-[.68rem] font-bold text-[color:var(--green)] tabular-nums">+{Math.abs(diff)}</span>
      )}
      <span
        className={cn(
          'font-mono tabular-nums font-extrabold transition',
          big ? 'text-[1.5rem]' : 'text-[1.3rem]',
          lose && 'opacity-40 font-bold text-[1.05rem]',
        )}
        style={{ color: lose ? undefined : color }}
      >
        {v}
      </span>
    </div>
  )
}

/** 육성 설정 요약 — Lv·각성·베테랑·장비·훈련·체형/협동/잠재 합 */
function GrowthCol({ g, align }: { g: Growth | undefined; align: 'left' | 'right' }) {
  const right = align === 'right'
  const parts = g ? growthSummary(g) : []
  if (parts.length === 0)
    return <div className={cn('text-[.72rem] text-ink-faint', right && 'text-right')}>육성 설정 없음</div>
  return (
    <div className={cn('flex flex-wrap gap-1', right && 'justify-end')} title={g && g.coach_training !== '해당없음' ? `감독훈련: ${g.coach_training}` : undefined}>
      {parts.map((p) => (
        <span
          key={p}
          className="rounded border px-1.5 py-[1px] text-[.7rem] font-bold whitespace-nowrap text-[color:var(--gold)]"
          style={{
            borderColor: 'color-mix(in srgb, var(--gold) 45%, transparent)',
            background: 'color-mix(in srgb, var(--gold) 8%, var(--surface))',
          }}
        >
          {p}
        </span>
      ))}
    </div>
  )
}

/** 잠재력 칩 — 주1~3(초록) + 베테랑(보라), 듀얼 세트는 금색 라벨로 아래 줄 */
function PotentialCol({ b, align }: { b: Batter; align: 'left' | 'right' }) {
  const right = align === 'right'
  const main = [b.potential1, b.potential2, b.potential3].filter((x): x is string => !!x)
  const dual = [b.dual_potential1, b.dual_potential2, b.dual_potential3].filter((x): x is string => !!x)
  const Chip = ({ name, tone }: { name: string; tone: 'green' | 'purple' | 'gold' }) => (
    <span
      className="rounded border px-1.5 py-[1px] text-[.7rem] font-semibold whitespace-nowrap"
      style={{
        color: `var(--${tone})`,
        borderColor: `color-mix(in srgb, var(--${tone}) 45%, transparent)`,
        background: `color-mix(in srgb, var(--${tone}) 8%, var(--surface))`,
      }}
    >
      {name}
    </span>
  )
  const none = main.length === 0 && !b.sub_potential && dual.length === 0 && !b.dual_sub_potential
  return (
    <div className={cn('flex flex-col gap-1.5 min-w-0', right && 'items-end')}>
      {none && <span className="text-[.72rem] text-ink-faint">잠재력 없음</span>}
      {(main.length > 0 || b.sub_potential) && (
        <div className={cn('flex flex-wrap gap-1', right && 'justify-end')}>
          {main.map((p) => (
            <Chip key={p} name={p} tone="green" />
          ))}
          {b.sub_potential && <Chip name={`베테랑 ${b.sub_potential}`} tone="purple" />}
        </div>
      )}
      {(dual.length > 0 || b.dual_sub_potential) && (
        <div className={cn('flex flex-wrap items-center gap-1', right && 'justify-end')}>
          <span className="text-[.62rem] font-bold text-[color:var(--gold)]">듀얼</span>
          {dual.map((p) => (
            <Chip key={p} name={p} tone="gold" />
          ))}
          {b.dual_sub_potential && <Chip name={`베테랑 ${b.dual_sub_potential}`} tone="purple" />}
        </div>
      )}
    </div>
  )
}
