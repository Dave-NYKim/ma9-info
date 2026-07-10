import { STAT5, STAT5_LABEL, statTier, type Stat5 } from '@shared/config/team-stats'
import { gradeBarBg, gradeCardBg, GRADE_ACCENT_TEXT } from '@shared/config/grades'
import { Badge, Button } from '@shared/ui'
import { cn } from '@shared/lib/cn'

/** 잠재력 묶음 (일반 카드만 — 유망주는 없음) */
export interface CmpPotentials {
  main: string[]
  sub: string | null
  dual: string[]
  dualSub: string | null
}

/** 비교창 입력 — 일반 카드/유망주 공통 정규화 엔트리. 최종 스탯 기준 비교. */
export interface CmpEntry {
  name: string
  /** 색상용 등급 코드 — 유망주는 null(초록 처리) */
  gradeCode: string | null
  gradeLabel: string
  /** 서브 라인 (팀·연도·포지션·투타 등) */
  sub: string
  /** 라인업 반영됨 뱃지 */
  applied: boolean
  final: Record<Stat5, number>
  /** 클러치 — 유망주는 null(스탯 없음) */
  clutch: number | null
  /** 잠재력 — 유망주는 null */
  potentials: CmpPotentials | null
  /** 육성 요약 칩 */
  growthChips: string[]
  growthTitle?: string
}

/** 선수 2명 비교 팝업 — 최종 스탯만, 두 선수 간 차이만 표시. 우세 쪽 크게·구간색, 열세 흐림. 유망주도 지원. */
export function CompareModal({ a, b, onClose }: { a: CmpEntry; b: CmpEntry; onClose: () => void }) {
  const sumA = STAT5.reduce((acc, k) => acc + a.final[k], 0)
  const sumB = STAT5.reduce((acc, k) => acc + b.final[k], 0)
  const showClutch = a.clutch != null && b.clutch != null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-[720px] my-8 rounded-2xl border border-line bg-surface shadow-[var(--shadow)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 — 양쪽 등급색 */}
        <div className="grid grid-cols-[1fr_auto_1fr]">
          <PlayerHead e={a} align="left" />
          <div className="flex items-center px-3 text-[1.1rem] font-extrabold text-ink-faint">VS</div>
          <PlayerHead e={b} align="right" />
        </div>

        {/* 최종 스탯 비교 */}
        <div className="px-5 py-3 flex flex-col">
          {STAT5.map((k) => (
            <CompareRow key={k} label={STAT5_LABEL[k]} a={a.final[k]} b={b.final[k]} tiered />
          ))}
          {showClutch && <CompareRow label="클러치" a={a.clutch as number} b={b.clutch as number} />}
          <div className="mt-1 border-t border-line-strong pt-2">
            <CompareRow label="5스탯 합" a={sumA} b={sumB} big />
          </div>
        </div>

        {/* 잠재력 */}
        <div className="grid grid-cols-[1fr_auto_1fr] gap-3 border-t border-line px-5 py-3">
          <PotentialCol p={a.potentials} align="left" />
          <div className="flex items-center text-[.64rem] font-bold uppercase tracking-[.08em] text-ink-faint">잠재력</div>
          <PotentialCol p={b.potentials} align="right" />
        </div>

        {/* 육성 설정 (레벨·베테랑·장비·체형 등) */}
        <div className="grid grid-cols-[1fr_auto_1fr] gap-3 border-t border-line px-5 py-3">
          <GrowthCol chips={a.growthChips} title={a.growthTitle} align="left" />
          <div className="flex items-center text-[.64rem] font-bold uppercase tracking-[.08em] text-ink-faint">육성</div>
          <GrowthCol chips={b.growthChips} title={b.growthTitle} align="right" />
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

function PlayerHead({ e, align }: { e: CmpEntry; align: 'left' | 'right' }) {
  const right = align === 'right'
  const cardBg = e.gradeCode ? gradeCardBg(e.gradeCode) : 'color-mix(in srgb, var(--green) 12%, var(--surface))'
  const barBg = e.gradeCode ? gradeBarBg(e.gradeCode) : 'var(--green)'
  const badgeText = e.gradeCode ? (GRADE_ACCENT_TEXT[e.gradeCode] ?? '#fff') : '#fff'
  return (
    <div className={cn('p-4', right && 'text-right')} style={{ background: cardBg }}>
      <div className="h-1 -mt-4 -mx-4 mb-3" style={{ background: barBg }} />
      <div className={cn('flex items-center gap-1.5', right && 'justify-end')}>
        <Badge color={barBg} text={badgeText}>
          {e.gradeLabel}
        </Badge>
        {e.applied && <Badge color="var(--green)">라인업</Badge>}
      </div>
      <div className="mt-1 text-[1.25rem] font-extrabold leading-tight truncate">{e.name}</div>
      <div className="text-[.74rem] text-ink-soft">{e.sub}</div>
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
  const tier = tiered ? statTier(v) : undefined
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
          !lose && tier?.cls,
        )}
        style={{ color: lose ? undefined : tier?.color }}
      >
        {v}
      </span>
    </div>
  )
}

/** 육성 설정 요약 칩 */
function GrowthCol({ chips, title, align }: { chips: string[]; title?: string; align: 'left' | 'right' }) {
  const right = align === 'right'
  if (chips.length === 0)
    return <div className={cn('text-[.72rem] text-ink-faint', right && 'text-right')}>육성 설정 없음</div>
  return (
    <div className={cn('flex flex-wrap gap-1', right && 'justify-end')} title={title}>
      {chips.map((p) => (
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

/** 잠재력 칩 — 주1~3(초록) + 베테랑(보라), 듀얼 세트는 금색 라벨로 아래 줄. 유망주(null)는 없음 안내. */
function PotentialCol({ p, align }: { p: CmpPotentials | null; align: 'left' | 'right' }) {
  const right = align === 'right'
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
  if (!p) return <div className={cn('text-[.72rem] text-ink-faint', right && 'text-right')}>유망주 · 잠재력 없음</div>
  const none = p.main.length === 0 && !p.sub && p.dual.length === 0 && !p.dualSub
  return (
    <div className={cn('flex flex-col gap-1.5 min-w-0', right && 'items-end')}>
      {none && <span className="text-[.72rem] text-ink-faint">잠재력 없음</span>}
      {(p.main.length > 0 || p.sub) && (
        <div className={cn('flex flex-wrap gap-1', right && 'justify-end')}>
          {p.main.map((x) => (
            <Chip key={x} name={x} tone="green" />
          ))}
          {p.sub && <Chip name={`베테랑 ${p.sub}`} tone="purple" />}
        </div>
      )}
      {(p.dual.length > 0 || p.dualSub) && (
        <div className={cn('flex flex-wrap items-center gap-1', right && 'justify-end')}>
          <span className="text-[.62rem] font-bold text-[color:var(--gold)]">듀얼</span>
          {p.dual.map((x) => (
            <Chip key={x} name={x} tone="gold" />
          ))}
          {p.dualSub && <Chip name={`베테랑 ${p.dualSub}`} tone="purple" />}
        </div>
      )}
    </div>
  )
}
