/**
 * 팀 스탯 계산 엔진 — 타자계산기 엑셀 수식의 1:1 이식 (전거: TEAM_STATS_ANALYSIS.md · SPEC §10)
 * 순수 함수. 클러치 계산 없음(5스탯). 각 보너스는 breakdown(출처·증감)으로 남긴다.
 */
import { prospectBaseStats, type Prospect } from '@shared/config/prospects'
import {
  COST_DISCOUNT_POSITIONS,
  EQUIP_BONUS,
  EQUIP_STAT,
  GRADE_COST,
  INFIELD,
  LEGEND_SPEED_BONUS,
  LEVEL_BONUS_T1,
  LEVEL_BONUS_T2,
  OUTFIELD,
  STAT5,
  STAT_FAMILY,
  STAT_TYPE_LABEL,
  TOTAL_COST,
  TRAINING_FIXED,
  sgCost,
  zeroStats,
  type Growth,
  type Stat5,
  type Stats5,
  type TeamSettings,
} from '@shared/config/team-stats'

/** 엔진이 필요로 하는 타자 필드(구조적 타입 — entities/batter 의 Batter 와 호환) */
export interface EngineBatter {
  name?: string
  grade: string
  position: string
  dual_position: string | null
  levelup_type1: string | null
  levelup_type2: string | null
  dual_levelup_type2: string | null
  power: number | null
  contact: number | null
  speed: number | null
  throwing: number | null
  defense: number | null
}

/** 포지션 고정(훈련) 반영 — growth.fixed_position 이 소스(육성에서 지정).
 *  **고정 ≠ 그냥 듀포**: 고정하면 레벨업 유형2 변경 + 듀얼 패널티 제거 + 코너 -3. 미고정 듀얼은 그대로.
 *  (전거: 마구마구 포지션 훈련 시스템) */
export interface ActiveState {
  fixed: boolean // 포지션 고정됨
  fixedPosition: string | null // 고정 포지션
  levelupType2: string | null // 활성 유형2 (부 고정이면 dual_levelup_type2, 그 외 주 유형2)
  fixedToSub: boolean // 부 포지션으로 고정됨(유형2 변경)
}
export function activeState(b: EngineBatter, fixedPosition: string | null | undefined): ActiveState {
  const fixed = fixedPosition != null
  const fixedToSub = fixed && fixedPosition === b.dual_position
  return {
    fixed,
    fixedPosition: fixedPosition ?? null,
    levelupType2: fixedToSub ? b.dual_levelup_type2 ?? b.levelup_type2 : b.levelup_type2,
    fixedToSub,
  }
}

export interface EngineSlot {
  batter: EngineBatter
  assigned_position: string
  growth: Growth // growth.fixed_position 이 포지션 고정
}

/** 듀얼 포지션 패널티(미훈련 듀얼 카드) — 공지 미명시 수치, 사용자 확인값(파워/컨택/수비 -1). 고정하면 제외(⑥). */
export const DUAL_PENALTY = { power: -1, contact: -1, defense: -1 }

/** 라인업 파생 컨텍스트 — 팀 버프 게이트 */
export interface TeamCtx {
  hasLegend: boolean // L 타자 존재 → 레전드 잠재(HOF) 발동 가능
  blackVet: boolean // 블랙 카드 팀 베테랑 지정됨
  sigVet: boolean // 시그 카드 팀 베테랑 지정됨
  sgAwakenCount: number // SG+풀각성 수 → SG 코스트 할인
}

export function computeTeamCtx(slots: EngineSlot[]): TeamCtx {
  return {
    hasLegend: slots.some((s) => s.batter.grade === 'L'),
    blackVet: slots.some((s) => s.batter.grade === 'B' && s.growth.team_veteran),
    sigVet: slots.some((s) => s.batter.grade === 'SG' && s.growth.team_veteran),
    sgAwakenCount: slots.filter((s) => s.batter.grade === 'SG' && s.growth.awakening).length,
  }
}

// ---------- 코스트 ----------
export interface CostLine {
  grade: string
  count: number
  unit: number // 장당 코스트 (SG 는 풀각성 수에 따라 45/39/37)
  sum: number
}
export interface TeamCost {
  total: number
  remain: number
  per: number[] // slots 와 같은 순서
  lines: CostLine[] // 등급별 내역 (능력치순)
  discount: { count: number; sum: number; names: string[] } // 1루/3루/지타 -3 감면
  sgAwakenCount: number
}

const GRADE_ORDER = ['SG', 'B', 'FR', 'E', 'L', 'R', 'S']

/** -3 감면 자격 = 카드의 확정 포지션이 1B/3B/DH. (포지션 훈련 시스템)
 *  - 단일 포지션 카드: 그 포지션이 코너면 자격.
 *  - 듀얼 카드: **고정(fixed_position)한 포지션**이 코너일 때만. 미고정 듀얼은 코너를 가져도 감면 없음(④).
 *  자리가 1B·3B·DH 3개뿐 → 팀 전체 최대 -9. 반환값 = 자격 포지션(없으면 null). */
function discountPosition(s: EngineSlot): string | null {
  const b = s.batter
  if (!b.dual_position) return COST_DISCOUNT_POSITIONS.has(b.position) ? b.position : null // 단일
  const fixed = s.growth.fixed_position
  return fixed && COST_DISCOUNT_POSITIONS.has(fixed) ? fixed : null // 듀얼 = 고정 필요
}

export function computeCost(slots: EngineSlot[], ctx: TeamCtx): TeamCost {
  const unitOf = (g: string) => (g === 'SG' ? sgCost(ctx.sgAwakenCount) : GRADE_COST[g] ?? 0)
  const per = slots.map((s) => {
    const unit = unitOf(s.batter.grade)
    return unit === 0 ? 0 : unit + (discountPosition(s) ? -3 : 0)
  })
  const lines: CostLine[] = GRADE_ORDER.map((grade) => {
    const count = slots.filter((s) => s.batter.grade === grade).length
    const unit = unitOf(grade)
    return { grade, count, unit, sum: unit * count }
  }).filter((l) => l.count > 0)
  const discounted = slots.filter((s) => unitOf(s.batter.grade) > 0 && discountPosition(s))
  const total = per.reduce((a, b) => a + b, 0)
  return {
    total,
    remain: TOTAL_COST - total,
    per,
    lines,
    discount: {
      count: discounted.length,
      sum: discounted.length * -3,
      names: discounted.map((s) => `${s.batter.name ?? '?'}(${discountPosition(s)})`),
    },
    sgAwakenCount: ctx.sgAwakenCount,
  }
}

// ---------- 슬롯 최종 스탯 ----------
export interface BreakdownItem {
  label: string
  delta: number
}
export interface SlotStats {
  base: Stats5
  final: Stats5
  /** 스탯별 0이 아닌 기여 목록 (기본 스탯 제외) */
  breakdown: Record<Stat5, BreakdownItem[]>
}

// 유형2 는 활성(훈련) 포지션 기준 — 유형1(공격)은 포지션 무관하게 b.levelup_type1
const typeOf = (b: EngineBatter, lt2: string | null, k: Stat5) => (STAT_FAMILY[k] === 1 ? b.levelup_type1 : lt2)
/** 이 스탯이 카드의 (활성) 레벨업 유형과 일치하는가 */
const typeMatch = (b: EngineBatter, lt2: string | null, k: Stat5) => typeOf(b, lt2, k) === STAT_TYPE_LABEL[k]
/** 유형 불일치(단 유형 자체는 입력돼 있어야 — 엑셀 `$F<>""` 게이트) */
const typeMiss = (b: EngineBatter, lt2: string | null, k: Stat5) =>
  !!typeOf(b, lt2, k) && typeOf(b, lt2, k) !== STAT_TYPE_LABEL[k]

export function computeSlotStats(slot: EngineSlot, ts: TeamSettings, ctx: TeamCtx): SlotStats {
  const { batter: b, assigned_position: pos, growth: g } = slot
  const act = activeState(b, g.fixed_position)
  const lt2 = act.levelupType2 // 활성 유형2 (부 고정이면 dual_levelup_type2)
  // 듀얼 포지션 패널티(⑥): 미훈련(미고정) 듀얼 카드는 파워/컨택/수비 -1, 고정하면 제외.
  const dualPenalty = !act.fixed && !!b.dual_position
  const base: Stats5 = {
    power: (b.power ?? 0) + (dualPenalty ? DUAL_PENALTY.power : 0),
    contact: (b.contact ?? 0) + (dualPenalty ? DUAL_PENALTY.contact : 0),
    speed: b.speed ?? 0,
    throwing: b.throwing ?? 0,
    defense: (b.defense ?? 0) + (dualPenalty ? DUAL_PENALTY.defense : 0),
  }
  const breakdown = {} as Record<Stat5, BreakdownItem[]>
  const final = zeroStats()

  for (const k of STAT5) {
    const items: BreakdownItem[] = []
    const add = (label: string, delta: number) => {
      if (delta !== 0) items.push({ label, delta })
    }

    // 자유 입력 4종
    add('덱보너스', ts.deck_bonus[k])
    add('협동훈련', g.coop[k])
    add('잠재력·기타', g.extra[k])
    add('체형', g.body[k])

    // 풀각성(스피릿) — S 제외 · 유형1/2 모두 입력돼 있어야. L 은 일치+4/불일치+6
    if (g.awakening && b.grade !== 'S' && b.levelup_type1 && lt2) {
      if (b.grade === 'L') add('풀각성(레전드)', typeMatch(b, lt2, k) ? 4 : 6)
      else if (['SG', 'B', 'FR', 'E', 'R'].includes(b.grade)) add('풀각성', 2)
    }

    // 개인 베테랑 — S 제외 · SG/B +2 · FR/E +1 · R/L 유형 불일치만 +1
    if (g.veteran && b.grade !== 'S') {
      if (b.grade === 'SG' || b.grade === 'B') add('베테랑', 2)
      else if (b.grade === 'FR' || b.grade === 'E') add('베테랑', 1)
      else if ((b.grade === 'R' || b.grade === 'L') && !typeMatch(b, lt2, k)) add('베테랑', 1)
    }

    // 카드 레벨 — 유형 지정 스탯만
    if (typeMatch(b, lt2, k)) add(`Lv${g.level}`, (STAT_FAMILY[k] === 1 ? LEVEL_BONUS_T1 : LEVEL_BONUS_T2)[g.level])

    // 감독훈련 — 고정표 + 유형 상대 3종
    const t = g.coach_training
    add(`훈련(${t})`, TRAINING_FIXED[t]?.[k] ?? 0)
    if (t === '강점집중훈련' && typeMatch(b, lt2, k)) add('훈련(강점집중)', 1)
    if (t === '약점보완훈련' && typeMiss(b, lt2, k)) add('훈련(약점보완)', 1)
    if (t === '약점집중훈련') add('훈련(약점집중)', typeMatch(b, lt2, k) ? -1 : typeMiss(b, lt2, k) ? 2 : 0)

    // 스페셜 전용 강점/약점
    if (b.grade === 'S') {
      if (typeMatch(b, lt2, k)) add('강점훈련', g.special.strength === '일반' ? 1 : g.special.strength === '완벽' ? 2 : 0)
      if (typeMiss(b, lt2, k)) add('약점훈련', g.special.weakness === '일반' ? 1 : g.special.weakness === '완벽' ? 3 : 0)
    }

    // 장비
    if (g.equip && EQUIP_STAT[g.equip.kind] === k) add(`장비(${g.equip.kind} ${g.equip.grade})`, EQUIP_BONUS[g.equip.grade])

    // (듀얼 포지션 스탯은 위 base 의 posDelta 로 반영 · 훈련 시 듀얼 패널티 없음 — 포지션 훈련 시스템)

    // ---- 팀 버프 ----
    // 레전드 잠재(HOF) — 라인업에 L 카드가 있어야 발동
    if (ctx.hasLegend && ts.legend_potential !== '미적용') {
      if (k === 'power' || k === 'contact') add('레전드 잠재', 1)
      if (k === 'speed') add('레전드 잠재', LEGEND_SPEED_BONUS[ts.legend_potential])
    }
    // 블테랑/식테랑
    add('팀 베테랑', (ctx.blackVet ? 1 : 0) + (ctx.sigVet ? 1 : 0))
    // 팀스피릿 B
    if (ts.team_spirit_b && (k === 'power' || k === 'contact')) add('팀스피릿B', 1)
    // 마에스트로 — 외야 배치만 쓰로
    if (k === 'throwing' && OUTFIELD.has(pos)) add('마에스트로', ts.maestro * 3)
    // 시그 각성 키스톤 — 2B/SS 의 SG 한정(사용자 확정) · 무한펑고와 중복 불가
    if (
      k === 'defense' &&
      ts.sig_awaken_keystone &&
      b.grade === 'SG' &&
      (pos === '2B' || pos === 'SS') &&
      t !== '무한펑고훈련'
    )
      add('키스톤 각성', 5)
    // 치어리더
    if (
      ts.cheer.pos === '캐시' ||
      (ts.cheer.pos === '내야' && INFIELD.has(pos)) ||
      (ts.cheer.pos === '외야' && OUTFIELD.has(pos))
    )
      add('치어리더', ts.cheer.stats[k])
    // 감독 뛰는야구C — 기본 스핏 71~80
    if (k === 'speed' && base.speed > 70 && base.speed < 81)
      add('뛰는야구C', ts.coach_run === '일반' ? 2 : ts.coach_run === '완벽+' ? 3 : 0)
    // 타격 코치 (배치 포지션 기준)
    const cb = ts.coach_bat
    if (cb === '배트스윙훈련+' && k === 'power' && (pos === 'DH' || pos === '1B')) add('타격코치', 1)
    if ((cb === '공격특화훈련' || cb === '공격특화훈련+') && ['DH', '1B', '3B'].includes(pos)) {
      if (k === 'power' || k === 'contact') add('타격코치', 2)
      if (cb === '공격특화훈련' && (k === 'throwing' || k === 'defense')) add('타격코치', -1)
    }
    if ((cb === '공격형키스톤' || cb === '공격형키스톤+') && (pos === 'SS' || pos === '2B')) {
      if (k === 'power' || k === 'contact') add('타격코치', 1)
      if (cb === '공격형키스톤' && k === 'throwing') add('타격코치', -1)
    }
    // 수비 코치
    if (k === 'throwing' && OUTFIELD.has(pos))
      add('수비코치', ts.coach_def === '외야송구훈련' ? 1 : ts.coach_def === '외야송구훈련+' ? 2 : 0)
    if (k === 'defense' && INFIELD.has(pos))
      add('수비코치', ts.coach_def === '내야수비훈련' ? 1 : ts.coach_def === '내야수비훈련+' ? 2 : 0)
    // 수석 — 잠재력각성B+ (스페셜만) · 특이폼공략
    if (ts.chief_awaken_b && b.grade === 'S' && (k === 'power' || k === 'contact')) add('수석(잠재각성B+)', 1)
    if (k === 'power' && (ts.chief_form === '일반' || ts.chief_form === '완벽+')) add('수석(특이폼)', 1)
    if (k === 'contact' && ts.chief_form === '완벽+') add('수석(특이폼)', 1)

    breakdown[k] = items
    final[k] = base[k] + items.reduce((a, it) => a + it.delta, 0)
  }

  return { base, final, breakdown }
}

// ---------- 유망주(라이징스타) — 엑셀 유망주 계산기 수식 이식 ----------
// 팀 버프 중 유망주에 적용되는 것: 레전드잠재·팀스피릿·특이폼(파워/컨택)·블/식테랑·치어리더·타격/수비 코치·장비.
// (마에스트로·뛰는야구C·키스톤·수석 잠재각성B 는 유망주 수식에 없음 — 미적용)
export function computeProspectStats(p: Prospect, pos: string, ts: TeamSettings, ctx: TeamCtx): SlotStats {
  const base = prospectBaseStats(p)
  const breakdown = {} as Record<Stat5, BreakdownItem[]>
  const final = zeroStats()
  const typeOfP = (k: Stat5) => (STAT_FAMILY[k] === 1 ? p.type1 : p.type2)
  const match = (k: Stat5) => typeOfP(k) === STAT_TYPE_LABEL[k]

  for (const k of STAT5) {
    const items: BreakdownItem[] = []
    const add = (label: string, delta: number) => {
      if (delta !== 0) items.push({ label, delta })
    }

    add('덱보너스', ts.deck_bonus[k])
    add('협동훈련', p.coop[k])
    add('잠재력·기타', p.extra[k])
    add('특화훈련', p.body[k])

    // 풀각성 ROY — 유형 일치 +4 / 불일치 +6
    if (p.roy_awaken) add('풀각성 ROY', match(k) ? 4 : 6)
    // 라이징스타 적용 — 전 스탯 +2
    if (p.rising) add('라이징스타', 2)

    // 성장 7단계 — 4·5단계(2배): 일반 일치2/불일치1 · 완벽 일치4/불일치2. 그 외: 일반 1 · 완벽 일치2/불일치1
    p.steps.forEach((step, i) => {
      if (step === '-') return
      const heavy = i === 3 || i === 4
      const delta = heavy
        ? step === '일반'
          ? match(k) ? 2 : 1
          : match(k) ? 4 : 2
        : step === '일반'
          ? 1
          : match(k) ? 2 : 1
      add(`성장 ${i + 1}단계(${step})`, delta)
    })
    // 완벽 개수 보너스
    const perfect = p.steps.filter((s) => s === '완벽').length
    add(`${perfect}완벽 보너스`, perfect === 5 ? 2 : perfect === 6 ? 3 : perfect === 7 ? 4 : 0)

    // 강점/약점 훈련
    if (match(k)) add('강점훈련', p.strength === '일반' ? 1 : p.strength === '완벽' ? 2 : 0)
    else add('약점훈련', p.weakness === '일반' ? 1 : p.weakness === '완벽' ? 3 : 0)

    // 장비
    if (p.equip && EQUIP_STAT[p.equip.kind] === k) add(`장비(${p.equip.kind} ${p.equip.grade})`, EQUIP_BONUS[p.equip.grade])

    // ---- 팀 버프 (유망주 대상만) ----
    if (ctx.hasLegend && ts.legend_potential !== '미적용') {
      if (k === 'power' || k === 'contact') add('레전드 잠재', 1)
      if (k === 'speed') add('레전드 잠재', LEGEND_SPEED_BONUS[ts.legend_potential])
    }
    add('팀 베테랑', (ctx.blackVet ? 1 : 0) + (ctx.sigVet ? 1 : 0))
    if (ts.team_spirit_b && (k === 'power' || k === 'contact')) add('팀스피릿B', 1)
    if (k === 'power' && (ts.chief_form === '일반' || ts.chief_form === '완벽+')) add('수석(특이폼)', 1)
    if (k === 'contact' && ts.chief_form === '완벽+') add('수석(특이폼)', 1)
    if (
      ts.cheer.pos === '캐시' ||
      (ts.cheer.pos === '내야' && INFIELD.has(pos)) ||
      (ts.cheer.pos === '외야' && OUTFIELD.has(pos))
    )
      add('치어리더', ts.cheer.stats[k])
    const cb = ts.coach_bat
    if (cb === '배트스윙훈련+' && k === 'power' && (pos === 'DH' || pos === '1B')) add('타격코치', 1)
    if ((cb === '공격특화훈련' || cb === '공격특화훈련+') && ['DH', '1B', '3B'].includes(pos)) {
      if (k === 'power' || k === 'contact') add('타격코치', 2)
      if (cb === '공격특화훈련' && (k === 'throwing' || k === 'defense')) add('타격코치', -1)
    }
    if ((cb === '공격형키스톤' || cb === '공격형키스톤+') && (pos === 'SS' || pos === '2B')) {
      if (k === 'power' || k === 'contact') add('타격코치', 1)
      if (cb === '공격형키스톤' && k === 'throwing') add('타격코치', -1)
    }
    if (k === 'throwing' && OUTFIELD.has(pos))
      add('수비코치', ts.coach_def === '외야송구훈련' ? 1 : ts.coach_def === '외야송구훈련+' ? 2 : 0)
    if (k === 'defense' && INFIELD.has(pos))
      add('수비코치', ts.coach_def === '내야수비훈련' ? 1 : ts.coach_def === '내야수비훈련+' ? 2 : 0)

    breakdown[k] = items
    final[k] = base[k] + items.reduce((a, it) => a + it.delta, 0)
  }

  return { base, final, breakdown }
}
