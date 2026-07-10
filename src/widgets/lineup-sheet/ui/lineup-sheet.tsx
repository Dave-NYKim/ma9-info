import type { CSSProperties } from 'react'
import { slotView, type RosterSlot } from '@entities/roster'
import { gradeBarBg, gradeCardBgSoft, gradeCssVar } from '@shared/config/grades'
import { parseProspect } from '@shared/config/prospects'
import { LINEUP_SIZE } from '@shared/config/roster'
import { statTier, STAT5, type Stat5, type Stats5, type Growth } from '@shared/config/team-stats'
import { GradeMark, NameWing } from '@shared/ui'
import type { SlotStats } from '@shared/lib/stat-engine'

/* ── 전체 라인업(1~9번) 표 — 사이트 테마 연동. 카드 배경/등급색은 선수 카드와 동일 체계. ── */

/** 스탯 라벨 (파워·컨택트·스피드·스로잉·수비력) */
const FULL_LABEL: Record<Stat5, string> = {
  power: '파워',
  contact: '컨택트',
  speed: '스피드',
  throwing: '스로잉',
  defense: '수비력',
}
/** 체형 델타용 2글자 라벨 (파워+2 스핏+3 형식) */
const SHORT_LABEL: Record<Stat5, string> = {
  power: '파워',
  contact: '컨택',
  speed: '스핏',
  throwing: '쓰로',
  defense: '수비',
}
/** 체형 스탯 델타 텍스트 — 예: "파워+2 스핏+3" */
const stats5Text = (v: Stats5 | undefined) =>
  v
    ? STAT5.filter((k) => (v[k] ?? 0) !== 0)
        .map((k) => `${SHORT_LABEL[k]}${v[k] > 0 ? '+' : ''}${v[k]}`)
        .join(' ')
    : ''

// 행 높이(px) — 라벨열·선수열이 동일 높이를 써야 정렬됨
const H = { head: 24, ident: 74, stat: 24, text: 22 }

// 라벨열·선수열 공통 텍스트 행
const TEXT_ROWS = ['잠재력', '베테랑', '감독훈련', '장비', '체형', '각성'] as const
// 잠재력=초록 · 베테랑(부잠재)=보라 (선수 카드 리스트와 동일)
const ROW_COLOR: Record<number, string> = { 0: 'var(--green)', 1: 'var(--purple)' }

const gradeBar = (g: string | null) => (g ? gradeBarBg(g) : 'var(--green)')
const cardBg = (g: string | null) => (g ? gradeCardBgSoft(g) : 'color-mix(in srgb, var(--green) 9%, var(--surface))')
const cardBorder = (g: string | null) => (g ? `var(${gradeCssVar(g)})` : 'var(--green)')

interface Col {
  order: number
  filled: boolean
  grade: string | null // 카드 등급코드(SG·B·FR·E·L·R·S) · 유망주 null
  name: string
  pos: string
  hands: string
  levelup: string // 레벨업 유형 (예: 파워/쓰로잉)
  final: Stats5 | null
  potential: string // 잠재력 행 = 선택된 주잠재(유망주는 설정의 잠재력)
  veteranPot: string // 베테랑 행 = 베테랑 체크 시 부잠재, 아니면 '-'
  awaken: string // 각성 행 = 'O' 또는 '-'
  coach: string
  equip: { kind: string; grade: string } | null // 장비 — 등급별 색
  body: string // 체형 훈련 이름 (예: 휘젓기)
}

/** 좌측 라벨열 */
function LabelColumn() {
  const cell = (h: number, text: string, color: string) => (
    <div
      style={{ height: h, color }}
      className="flex items-center justify-end pr-2 text-[.72rem] font-bold whitespace-nowrap"
    >
      {text}
    </div>
  )
  return (
    <div className="shrink-0 w-[54px]">
      {/* 헤더 + 선수정보 박스 높이만큼 "선수 정보" (노란색) */}
      <div
        style={{ height: H.head + H.ident, color: 'var(--gold)' }}
        className="flex flex-col items-center justify-center text-[.72rem] font-extrabold leading-tight"
      >
        <span>선수</span>
        <span>정보</span>
      </div>
      {STAT5.map((k) => cell(H.stat, FULL_LABEL[k], 'var(--ink-soft)'))}
      {TEXT_ROWS.map((t, i) => cell(H.text, t, ROW_COLOR[i] ?? 'var(--ink-soft)'))}
    </div>
  )
}

/** 스탯 막대 + 숫자 (막대 색 = 값 등급 STAT_TIERS · 초월/극한은 광택+글로우) */
function StatBar({ v }: { v: number | null }) {
  if (v == null) return <div style={{ height: H.stat }} />
  const t = statTier(v)
  const shine = t.label === '극한' || t.label === '초월'
  const w = Math.max(4, Math.min(100, (v / 130) * 100))
  return (
    <div style={{ height: H.stat }} className="flex items-center gap-1 px-1.5">
      <div className="flex-1 h-[8px] rounded-sm" style={{ background: 'color-mix(in srgb, var(--ink) 12%, transparent)' }}>
        <div
          className={`h-full rounded-sm${shine ? ' lineup-bar-shine' : ''}`}
          style={{ width: `${w}%`, background: t.color, boxShadow: shine ? `0 0 6px ${t.color}` : undefined }}
        />
      </div>
      <span className="w-6 shrink-0 text-right font-mono tabular-nums text-[.7rem] font-bold" style={{ color: 'var(--ink)' }}>
        {v}
      </span>
    </div>
  )
}

/** 장비 셀 — 종류 + 선수 풀과 동일한 등급 마크(GradeMark) */
function EquipCell({ equip }: { equip: { kind: string; grade: string } | null }) {
  if (!equip) return <span style={{ color: 'var(--ink-faint)' }}>-</span>
  return (
    <span className="inline-flex items-center gap-1 max-w-full">
      <GradeMark grade={equip.grade} />
      <span style={{ color: 'var(--ink-soft)' }} className="text-[.62rem] truncate">
        {equip.kind}
      </span>
    </span>
  )
}

/** 선수 한 컬럼(카드) */
function PlayerColumn({ c }: { c: Col }) {
  const isSpecial = c.grade === 'SG' || c.grade === 'B' // 이름 날개 + 글로우 + 배경 전체 광택
  // 배경 광택 스윕: 시그=흰색(아주 옅게, 안튀게) · 블랙=금색 — 세기를 서로 비슷하게 맞춤
  const shineColor = c.grade === 'SG' ? 'rgba(255,255,255,.22)' : c.grade === 'B' ? 'rgba(255,214,90,.5)' : undefined
  const cardStyle: CSSProperties = c.filled
    ? {
        background: cardBg(c.grade),
        border: `1px solid ${cardBorder(c.grade)}`,
        boxShadow: c.grade === 'SG' ? '0 0 10px rgba(98,211,255,.25)' : c.grade === 'B' ? '0 0 10px rgba(201,165,74,.22)' : undefined,
        ...(shineColor ? { ['--shine']: shineColor } : {}),
      }
    : { background: 'var(--surface)', border: '1px solid var(--line)' }

  return (
    // SG·B = 카드 배경 전체가 반짝(grade-shine) · 콘텐츠는 z-1 로 그 위 → 글자 선명
    <div
      className={`relative flex-1 min-w-[82px] rounded-md overflow-hidden${isSpecial ? ' grade-shine' : ''}`}
      style={cardStyle}
    >
      {/* 상단 등급 바 (absolute — 행 정렬에 영향 없음) */}
      {c.filled && <div className="absolute top-0 left-0 right-0 h-[3px] z-[3]" style={{ background: gradeBar(c.grade) }} />}
      <div className="relative z-[1]">
        {/* 헤더 N번 타자 (노란색) */}
        <div
          style={{ height: H.head, color: 'var(--gold)', borderBottom: '1px solid color-mix(in srgb, var(--ink) 14%, transparent)' }}
          className="flex items-center justify-center text-[.7rem] font-extrabold"
        >
          {c.order}번 타자
        </div>
        {/* 선수 정보 박스 — 포지션 · 이름(시그/블랙 = 날개) · 좌투우타 · 레벨업 */}
        <div style={{ height: H.ident }} className="p-1">
          <div
            className="h-full rounded flex flex-col items-center justify-center"
            style={{ border: '1px dashed color-mix(in srgb, var(--ink) 24%, transparent)' }}
          >
            {c.filled ? (
              <>
                <span style={{ color: 'var(--ink)' }} className="text-[.82rem] font-extrabold leading-none">
                  {c.pos}
                </span>
                <span className="mt-1 flex items-center gap-0.5 max-w-full">
                  {isSpecial && <NameWing variant={c.grade as 'SG' | 'B'} className="shrink-0" />}
                  <span style={{ color: 'var(--ink)' }} className="text-[.7rem] font-bold leading-none truncate">
                    {c.name}
                  </span>
                  {isSpecial && <NameWing variant={c.grade as 'SG' | 'B'} flip className="shrink-0" />}
                </span>
                <span style={{ color: 'var(--ink-soft)' }} className="mt-1 text-[.6rem] font-semibold leading-none">
                  {c.hands}
                </span>
                <span style={{ color: 'var(--ink-soft)' }} className="mt-0.5 text-[.6rem] font-semibold leading-none max-w-full truncate px-1">
                  {c.levelup}
                </span>
              </>
            ) : (
              <>
                <span style={{ color: 'var(--ink-soft)' }} className="text-[.74rem] font-bold leading-none">
                  포지션
                </span>
                <span style={{ color: 'var(--ink-faint)' }} className="mt-1 text-[.6rem] leading-none">
                  클릭하여 설정
                </span>
              </>
            )}
          </div>
        </div>
        {/* 5스탯 */}
        {STAT5.map((k) => (
          <StatBar key={k} v={c.final ? c.final[k] : null} />
        ))}
        {/* 잠재력 · 베테랑 · 감독훈련 · 장비 · 체형 · 각성 */}
        {TEXT_ROWS.map((_, i) => {
          const divider = i === 0
          const base: CSSProperties = {
            height: H.text,
            boxShadow: divider ? 'inset 0 1px 0 color-mix(in srgb, var(--ink) 14%, transparent)' : undefined,
          }
          let node: React.ReactNode = <span style={{ color: 'var(--ink-faint)' }}>-</span>
          if (c.filled) {
            if (i === 0) node = <span className="font-semibold" style={{ color: c.potential === '-' ? 'var(--ink-faint)' : ROW_COLOR[0] }}>{c.potential}</span>
            else if (i === 1) node = <span className="font-semibold" style={{ color: c.veteranPot === '-' ? 'var(--ink-faint)' : ROW_COLOR[1] }}>{c.veteranPot}</span>
            else if (i === 2) node = <span style={{ color: c.coach === '-' ? 'var(--ink-faint)' : 'var(--ink-soft)' }}>{c.coach}</span>
            else if (i === 3) node = <EquipCell equip={c.equip} />
            else if (i === 4) node = <span style={{ color: c.body === '-' ? 'var(--ink-faint)' : 'var(--ink-soft)' }}>{c.body}</span>
            else node = <span className="font-bold" style={{ color: c.awaken === '-' ? 'var(--ink-faint)' : 'var(--ink)' }}>{c.awaken}</span>
          }
          return (
            <div key={TEXT_ROWS[i]} style={base} className="flex items-center justify-center text-[.7rem] text-center px-1 leading-tight">
              {node}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** 전체 라인업(1~9번) 최종 스탯 — 팀 페이지 맨 아래. */
export function LineupSheet({
  entries,
  growthMap,
}: {
  entries: { slot: RosterSlot; stats: SlotStats }[]
  growthMap: Map<string, Growth>
}) {
  const byOrder = new Map(entries.map((e) => [e.slot.lineup_order, e]))
  const cols: Col[] = Array.from({ length: LINEUP_SIZE }, (_, i) => i + 1).map((order) => {
    const e = byOrder.get(order)
    if (!e)
      return {
        order,
        filled: false,
        grade: null,
        name: '',
        pos: '',
        hands: '',
        levelup: '',
        final: null,
        potential: '-',
        veteranPot: '-',
        awaken: '-',
        coach: '-',
        equip: null,
        body: '-',
      }
    const s = e.slot
    const view = slotView(s)
    const isProspect = view.isProspect
    const growth = s.batter_id ? growthMap.get(s.batter_id) : undefined
    const prospect = s.prospect ? parseProspect(s.prospect.data) : null
    const bat = s.batter
    // 이 슬롯이 부(듀얼) 포지션으로 뛰면 부잠재도 듀얼 쪽을 사용
    const toSub = !!bat?.dual_position && s.assigned_position === bat.dual_position
    const subPot = bat ? (toSub ? bat.dual_sub_potential : bat.sub_potential) : null
    const awakened = isProspect ? !!prospect?.roy_awaken : !!growth?.awakening
    const coach = isProspect ? prospect?.coach_training : growth?.coach_training
    return {
      order,
      filled: true,
      grade: view.grade,
      name: view.name,
      pos: s.assigned_position,
      hands: view.hands ?? '',
      levelup: view.levelup ?? '',
      final: e.stats.final,
      potential: (isProspect ? prospect?.potential : growth?.selected_potential) || '-',
      veteranPot: !isProspect && growth?.veteran ? subPot ?? '-' : '-',
      awaken: awakened ? 'O' : '-',
      coach: coach && coach !== '해당없음' ? coach : '-',
      equip: (isProspect ? prospect?.equip : growth?.equip) ?? null,
      body: (isProspect ? stats5Text(prospect?.body) : stats5Text(growth?.body)) || '-',
    }
  })

  return (
    <div className="rounded-xl p-3 sm:p-4" style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}>
      <div className="overflow-x-auto">
        <div className="flex gap-1.5 min-w-[860px] items-start">
          <LabelColumn />
          {cols.map((c) => (
            <PlayerColumn key={c.order} c={c} />
          ))}
        </div>
      </div>
    </div>
  )
}
