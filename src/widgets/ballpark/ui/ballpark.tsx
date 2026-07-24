import type { CSSProperties } from 'react'
import type { RosterPitcher, RosterSlot } from '@entities/roster'
import { positionFit, slotView } from '@entities/roster'
import { FIELD_POS, LINEUP_POSITIONS, type LineupPosition } from '@shared/config/roster'
import { gradeCssVar } from '@shared/config/grades'
import { cn } from '@shared/lib/cn'

/* ── 필드 색 (디자인 토큰에서 파생 — 라이트/다크 자동) ── */
const GRASS_FOUL = 'color-mix(in srgb, var(--green) 13%, var(--ground))' // 파울 지역(어두운 잔디)
const GRASS_FAIR = 'color-mix(in srgb, var(--green) 26%, var(--surface))' // 페어 지역
const GRASS_STRIPE = 'color-mix(in srgb, var(--green) 38%, var(--surface))' // 잔디 줄무늬
const DIRT = 'color-mix(in srgb, var(--clay) 42%, var(--surface))' // 내야 흙
const DIRT_STRONG = 'color-mix(in srgb, var(--clay) 58%, var(--surface))' // 마운드
const LINE = 'color-mix(in srgb, #fff 80%, transparent)' // 라인·베이스

/** 잔디 줄무늬: 홈(50,88) 중심 부채꼴 호 */
const stripe = (r: number) => {
  const off = r / Math.SQRT2
  return `M ${50 - off} ${88 - off} A ${r} ${r} 0 0 1 ${50 + off} ${88 - off}`
}

export function Ballpark({
  slots,
  editable,
  swapSel,
  mismatch,
  onChipClick,
  onRemove,
  onEmptyClick,
  moundPitcher = null,
  onMoundClick,
}: {
  slots: RosterSlot[]
  editable: boolean
  /** 타순 교환 대기 중인 슬롯 id (필드·타순 패널 공유) */
  swapSel: string | null
  /** 고정 포지션 ≠ 배치 포지션인 슬롯 id (경고 "!") */
  mismatch?: Set<string>
  onChipClick: (s: RosterSlot) => void
  onRemove: (s: RosterSlot) => void
  /** 빈 포지션 클릭 → 선수 선택 팝업 */
  onEmptyClick?: (pos: LineupPosition) => void
  /** 마운드 등판 선발 (없으면 대시 P) — 아래 「투수」 패널에서 지정 */
  moundPitcher?: RosterPitcher | null
  /** 마운드 클릭 → 아래 토글을 투수로 (편집자만) */
  onMoundClick?: () => void
}) {
  const byPos = new Map(slots.map((s) => [s.assigned_position, s]))

  return (
    <div className="relative w-full aspect-[100/46] select-none">
      {/* ── 야구장 (오늘 첫 버전 색감 · 너비 꽉 채우고 높이만 압축) ── */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full rounded-2xl border border-line shadow-[var(--shadow)]"
      >
        <rect x="0" y="0" width="100" height="100" fill={GRASS_FOUL} />
        <clipPath id="fairClip">
          <path d="M 50 88 L 2 40 A 82 82 0 0 1 98 40 Z" />
        </clipPath>
        {/* 페어 지역 + 잔디 줄무늬 */}
        <path d="M 50 88 L 2 40 A 82 82 0 0 1 98 40 Z" fill={GRASS_FAIR} />
        <g clipPath="url(#fairClip)" stroke={GRASS_STRIPE} strokeWidth="7" fill="none" opacity=".35">
          <path d={stripe(26)} />
          <path d={stripe(40)} />
          <path d={stripe(54)} />
          <path d={stripe(68)} />
        </g>
        {/* 외야 펜스(경고 트랙 느낌의 띠) */}
        <path d="M 2 40 A 82 82 0 0 1 98 40" fill="none" stroke={DIRT} strokeWidth="2.6" opacity=".8" />
        {/* 내야 흙(모서리 둥근 다이아몬드) + 내야 잔디 */}
        <path d="M 50 90 L 72 68 L 50 46 L 28 68 Z" fill={DIRT} stroke={DIRT} strokeWidth="7" strokeLinejoin="round" />
        <path d="M 50 84 L 66.5 67.5 L 50 51 L 33.5 67.5 Z" fill={GRASS_FAIR} />
        {/* 파울 라인 */}
        <g stroke={LINE} strokeWidth=".6">
          <path d="M 50 88 L 2 40" />
          <path d="M 50 88 L 98 40" />
        </g>
        {/* 베이스 라인 + 베이스 */}
        <path d="M 50 86 L 68 68 L 50 50 L 32 68 Z" fill="none" stroke={LINE} strokeWidth=".7" />
        {[
          [68, 68],
          [50, 50],
          [32, 68],
        ].map(([x, y]) => (
          <rect key={`${x}`} x={x - 1.3} y={y - 1.3} width="2.6" height="2.6" fill={LINE} transform={`rotate(45 ${x} ${y})`} />
        ))}
        <rect x={48.9} y={84.9} width="2.2" height="2.2" fill={LINE} transform="rotate(45 50 86)" />
        {/* 타석 */}
        <circle cx="44.6" cy="86" r="2.4" fill={DIRT} opacity=".65" />
        <circle cx="55.4" cy="86" r="2.4" fill={DIRT} opacity=".65" />
        {/* 마운드 */}
        <circle cx="50" cy="67" r="3.4" fill={DIRT_STRONG} />
        <rect x="49" y="66.7" width="2" height=".7" fill={LINE} opacity=".9" />
      </svg>

      {/* ── 야수 포지션 노드 ── */}
      {LINEUP_POSITIONS.map((pos) => {
        const s = byPos.get(pos)
        return s ? (
          <FilledChip
            key={pos}
            slot={s}
            editable={editable}
            selected={swapSel === s.id}
            mismatch={!!mismatch?.has(s.id)}
            onClick={() => onChipClick(s)}
            onRemove={() => onRemove(s)}
          />
        ) : (
          <EmptyNode key={pos} pos={pos} onClick={editable && onEmptyClick ? () => onEmptyClick(pos) : undefined} />
        )
      })}

      {/* ── 마운드 등판 투수 (아래 「투수」 패널에서 지정) — 클릭 = 투수 패널로 ── */}
      <MoundChip pitcher={moundPitcher} onClick={editable ? onMoundClick : undefined} />
    </div>
  )
}

/** 마운드 칩 — 선발 등판 투수(없으면 대시 P). 등급색 미니카드. onClick 있으면 클릭 가능. */
function MoundChip({ pitcher, onClick }: { pitcher: RosterPitcher | null; onClick?: () => void }) {
  const { x, y } = FIELD_POS.P
  const clickable = !!onClick
  const common = 'absolute -translate-x-1/2 -translate-y-1/2 z-10 transition'
  if (!pitcher || !pitcher.pitcher) {
    return (
      <div
        role={clickable ? 'button' : undefined}
        tabIndex={clickable ? 0 : undefined}
        onClick={onClick}
        onKeyDown={clickable ? (e) => (e.key === 'Enter' || e.key === ' ') && onClick?.() : undefined}
        className={cn(
          common,
          'w-9 h-9 rounded-full border-2 border-dashed flex items-center justify-center text-[.6rem] font-extrabold text-ink-soft bg-[color:var(--surface)]/45',
          clickable && 'cursor-pointer hover:scale-110 hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]',
        )}
        style={{ left: `${x}%`, top: `${y}%`, borderColor: 'color-mix(in srgb, var(--ink) 30%, transparent)' }}
        title={clickable ? '클릭 = 아래 투수에서 선발 등판 지정' : '등판 선발 미지정'}
      >
        P
      </div>
    )
  }
  const pit = pitcher.pitcher
  const gradeColor = `var(${gradeCssVar(pit.grade)})`
  const sheen = pit.grade === 'SG' || pit.grade === 'B' // 타자 칩과 동일한 광택
  const hands = `${pit.throw_hand}/${pit.bat_hand}`
  return (
    <div
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={clickable ? (e) => (e.key === 'Enter' || e.key === ' ') && onClick?.() : undefined}
      className={cn(
        common,
        'group rounded-lg border-2 px-1.5 py-1 w-[clamp(76px,9vw,110px)] shadow-[var(--shadow)]',
        sheen && 'chip-sheen',
        clickable && 'cursor-pointer hover:-translate-y-[calc(50%+2px)]',
      )}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        borderColor: gradeColor,
        background: `color-mix(in srgb, ${gradeColor} 14%, var(--surface))`,
        ...(pit.grade === 'B' ? { boxShadow: '0 0 0 1px rgba(255,255,255,.45), var(--shadow)' } : {}),
        ...(sheen ? { ['--shine']: pit.grade === 'SG' ? 'rgba(255,255,255,.75)' : 'rgba(255,214,90,.8)' } : {}),
      }}
      title="선발 등판"
    >
      <div className="relative z-[1]">
        <div className="flex items-center gap-1 leading-none">
          <span className="rounded bg-ink px-1 py-[1px] text-[.5rem] font-extrabold text-[color:var(--surface)]">선발</span>
          <span className="text-[.56rem] font-bold text-ink-faint tracking-tight">SP</span>
        </div>
        <div className="mt-0.5 text-[.72rem] font-extrabold truncate text-ink">{pit.name}</div>
        <div className="text-[.56rem] font-semibold leading-tight truncate text-ink-soft">
          {pit.year ? `${pit.year} · ${hands}` : hands}
        </div>
      </div>
    </div>
  )
}

function EmptyNode({ pos, onClick }: { pos: LineupPosition; onClick?: () => void }) {
  const { x, y } = FIELD_POS[pos]
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => (e.key === 'Enter' || e.key === ' ') && onClick() : undefined}
      className={cn(
        'absolute -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full border-2 border-dashed flex items-center justify-center text-[.66rem] font-extrabold text-ink-soft bg-[color:var(--surface)]/45 transition',
        onClick &&
          'cursor-pointer hover:scale-110 hover:border-solid hover:border-[color:var(--accent)] hover:text-[color:var(--accent)] hover:bg-[color:var(--surface)]/80',
      )}
      style={{ left: `${x}%`, top: `${y}%`, borderColor: 'color-mix(in srgb, var(--ink) 30%, transparent)' }}
      title={onClick ? `${pos} 자리에 선수 선택` : undefined}
    >
      {pos}
    </div>
  )
}

/** 배치된 선수 미니 카드 칩 — 등급색 테두리/틴트 + 타순 번호. 클릭 = 타순 교환 선택. */
function FilledChip({
  slot,
  editable,
  selected,
  mismatch,
  onClick,
  onRemove,
}: {
  slot: RosterSlot
  editable: boolean
  selected: boolean
  mismatch: boolean
  onClick: () => void
  onRemove: () => void
}) {
  const { x, y } = FIELD_POS[slot.assigned_position]
  const v = slotView(slot)
  const gradeColor = v.grade ? `var(${gradeCssVar(v.grade)})` : 'var(--green)' // 유망주 = 초록
  const sheen = v.grade === 'SG' || v.grade === 'B' // 배경+테두리에 걸쳐 광택 반짝
  const fit = positionFit({ position: v.mainPos, dual_position: v.dualPos }, slot.assigned_position)
  return (
    <div
      role={editable ? 'button' : undefined}
      tabIndex={editable ? 0 : undefined}
      onClick={editable ? onClick : undefined}
      onKeyDown={editable ? (e) => (e.key === 'Enter' || e.key === ' ') && onClick() : undefined}
      className={cn(
        'absolute -translate-x-1/2 -translate-y-1/2 z-10 group rounded-lg border-2 px-1.5 py-1 w-[clamp(76px,9vw,110px)] shadow-[var(--shadow)] transition',
        editable && 'cursor-pointer hover:-translate-y-[calc(50%+2px)]',
        sheen && 'chip-sheen',
        selected && 'outline outline-2 outline-offset-2 outline-[color:var(--accent)]',
      )}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        borderColor: gradeColor,
        background: `color-mix(in srgb, ${gradeColor} 14%, var(--surface))`,
        // B = 검정 테두리 바깥 흰 헤어라인 (어두운 필드 위 식별)
        ...(v.grade === 'B' ? { boxShadow: '0 0 0 1px rgba(255,255,255,.45), var(--shadow)' } : {}),
        ...(sheen ? { ['--shine']: v.grade === 'SG' ? 'rgba(255,255,255,.75)' : 'rgba(255,214,90,.8)' } : {}),
      } as CSSProperties}
      title={
        mismatch
          ? '포지션 고정과 다른 자리에 배치됨'
          : fit === 'off'
            ? '카드 포지션과 다른 자리 (수비 페널티)'
            : undefined
      }
    >
      <div className="relative z-[1]">
        <div className="flex items-center gap-1 leading-none">
          <span className="w-[15px] h-[15px] shrink-0 rounded-full bg-ink text-[color:var(--surface)] text-[.58rem] font-extrabold flex items-center justify-center tabular-nums">
            {slot.lineup_order}
          </span>
          <span className="text-[.56rem] font-bold text-ink-faint tracking-tight">
            {slot.assigned_position}
            {slot.use_dual && <span className="text-[color:var(--gold)]">·D</span>}
          </span>
          {mismatch && (
            <span className="ml-auto rounded bg-[color:var(--clay)] px-[3px] text-[.56rem] font-extrabold text-white leading-none">!</span>
          )}
          {!mismatch && fit === 'off' && <span className="text-[.6rem] text-[color:var(--clay)] font-extrabold">!</span>}
        </div>
        <div className="mt-0.5 text-[.72rem] font-extrabold truncate text-ink">{v.name}</div>
        <div className="text-[.56rem] font-semibold leading-tight truncate text-ink-soft">
          {v.year ? `${v.year} · ${v.hands}` : v.hands}
        </div>
        <div className="text-[.56rem] font-semibold leading-tight truncate text-ink-faint">{v.levelup}</div>
      </div>
      {editable && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="absolute -top-2 -right-2 hidden group-hover:flex w-[18px] h-[18px] rounded-full bg-ink text-[color:var(--surface)] text-[.6rem] items-center justify-center cursor-pointer"
          title="라인업에서 제거"
        >
          ✕
        </button>
      )}
    </div>
  )
}
