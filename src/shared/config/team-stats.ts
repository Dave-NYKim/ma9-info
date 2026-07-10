/**
 * 팀 스탯 규칙 상수 + 저장 스키마 (SPEC §10 · 전거 = TEAM_STATS_ANALYSIS.md)
 * 계산기 엑셀(타자계산기 Ver.260210) 역공학 값 그대로. 계산은 shared/lib/stat-engine.ts.
 * 클러치는 계산 없음(표시만) — 여기의 모든 규칙은 5스탯(파워·컨택·스핏·쓰로·수비) 대상.
 */
import { z } from 'zod'

// ---------- 5스탯 ----------
export const STAT5 = ['power', 'contact', 'speed', 'throwing', 'defense'] as const
export type Stat5 = (typeof STAT5)[number]
export type Stats5 = Record<Stat5, number>
export const zeroStats = (): Stats5 => ({ power: 0, contact: 0, speed: 0, throwing: 0, defense: 0 })
export const STAT5_LABEL: Record<Stat5, string> = {
  power: '파워',
  contact: '컨택',
  speed: '스핏',
  throwing: '쓰로',
  defense: '수비',
}

/** 최종(적용) 스탯 구간 색 — 사용자 확정. 기본 스탯엔 쓰지 않는다. cls = 특수 연출(극한 샤이닝). */
export const STAT_TIERS: { min: number; label: string; color: string; cls?: string }[] = [
  { min: 120, label: '극한', color: 'var(--g-sg)', cls: 'stat-extreme' },
  { min: 110, label: '초월', color: 'var(--sun)' },
  { min: 100, label: '극상', color: 'var(--purple)' },
  { min: 91, label: '최상', color: 'var(--g-r)' },
  { min: 81, label: '상', color: 'var(--g-s)' },
  { min: -Infinity, label: '중', color: 'var(--blue)' },
]
export const statTier = (v: number) => STAT_TIERS.find((t) => v >= t.min)!

/** 스탯 ↔ 레벨업 유형 매칭 (codes 의 levelup1/levelup2 라벨 기준) */
export const STAT_TYPE_LABEL: Record<Stat5, string> = {
  power: '파워',
  contact: '컨택트',
  speed: '스피드',
  throwing: '쓰로잉',
  defense: '수비력',
}
/** 유형1 계열(파워·컨택) = 1, 유형2 계열(스핏·쓰로·수비) = 2 */
export const STAT_FAMILY: Record<Stat5, 1 | 2> = { power: 1, contact: 1, speed: 2, throwing: 2, defense: 2 }

/** 포지션 → 레벨업 유형2 (수비 관련) — 포지션 훈련 시스템(마구마구 26.08.21). 유형1(공격)은 포지션 무관. */
export const POSITION_TYPE2: Record<string, string> = {
  '1B': '수비력',
  '2B': '수비력',
  SS: '수비력',
  C: '쓰로잉',
  '3B': '쓰로잉',
  LF: '쓰로잉',
  CF: '쓰로잉',
  RF: '쓰로잉',
  DH: '스피드',
}

// ---------- 코스트 (총 300) ----------
export const TOTAL_COST = 300
export const GRADE_COST: Record<string, number> = { R: 8, L: 13, E: 22, FR: 24, B: 34 } // S=0 · SG=동적
/** SG 코스트: 라인업 내 [SG+풀각성] 수 3장↑=37 · 2장↑=39 · 그 외 45 */
export const sgCost = (sgAwakenCount: number) => (sgAwakenCount >= 3 ? 37 : sgAwakenCount >= 2 ? 39 : 45)
/** 특수포지션(1루/3루/지타) 배치 시 -3 (엑셀 O(-3) — 웹은 배치 포지션으로 자동) */
export const COST_DISCOUNT_POSITIONS = new Set(['1B', '3B', 'DH'])

// ---------- 카드 레벨 (Lv0~7, 유형 지정 스탯만) ----------
export const LEVEL_BONUS_T1 = [0, 1, 1, 2, 2, 3, 5, 7] // 유형1 스탯
export const LEVEL_BONUS_T2 = [0, 0, 1, 1, 2, 3, 5, 7] // 유형2 스탯

// ---------- 감독훈련 (개인) ----------
/** 고정 효과 훈련 → 스탯 증감. 목록에 있지만 효과 0인 훈련(잠재력 계열 등)은 여기 없음. */
export const TRAINING_FIXED: Record<string, Partial<Stats5>> = {
  파워훈련: { power: 2 },
  파워집중훈련: { power: 3, contact: -1 },
  컨택트훈련: { contact: 2 },
  컨택트집중훈련: { contact: 3, power: -1 },
  강타자훈련: { power: 1, contact: 1 },
  고급집중력훈련: { power: 1, contact: 1 },
  집중력훈련: { power: 1 },
  타격특화훈련: { power: 2, contact: 2, throwing: -1, defense: -1 },
  스피드훈련: { speed: 2 },
  스피드집중훈련: { speed: 3, defense: -1 },
  스로잉훈련: { throwing: 2 },
  수비력훈련: { defense: 2 },
  수비력집중훈련: { defense: 3, speed: -1 },
  기본수비훈련: { speed: 1, defense: 1 },
  무한펑고훈련: { defense: 5 },
}
/** 유형 상대 훈련(엔진에서 유형 일치/불일치로 처리): 강점집중훈련(+1 일치) · 약점보완훈련(+1 불일치) · 약점집중훈련(일치 -1 / 불일치 +2) */
export const TRAINING_RELATIVE = new Set(['강점집중훈련', '약점보완훈련', '약점집중훈련'])
/** 드롭다운 전체 목록 (계산기 DB 시트 순서) */
export const TRAININGS = [
  '해당없음',
  '강점집중훈련',
  '수비력훈련',
  '집중력훈련',
  '약점보완훈련',
  '파워훈련',
  '스로잉훈련',
  '강타자훈련',
  '스피드훈련',
  '컨택트훈련',
  '컨택트집중훈련',
  '스피드집중훈련',
  '타자잠재력강화',
  '고급집중력훈련',
  '수비력집중훈련',
  '순발력훈련',
  '파워집중훈련',
  '날씨적응훈련',
  '기본수비훈련',
  '약점집중훈련',
  '배트스피드훈련 I',
  '부잠재력강화',
  '수비스피드훈련',
  '배트스피드훈련 II',
  '특수수비훈련',
  '무한펑고훈련',
  '테이블세터훈련',
  '타격특화훈련',
  '배트컨트롤훈련',
  '어깨강화훈련',
  '타구발사각훈련',
] as const

// ---------- 장비 ----------
export const EQUIP_KINDS = ['배트', '장갑', '스파이크', '아대', '글러브'] as const
export const EQUIP_STAT: Record<string, Stat5> = {
  배트: 'power',
  장갑: 'contact',
  스파이크: 'speed',
  아대: 'throwing',
  글러브: 'defense',
}
export const EQUIP_GRADES = ['S', 'R', 'E', 'B'] as const
export const EQUIP_BONUS: Record<string, number> = { S: 1, R: 2, E: 3, B: 4 }

// ---------- 팀 버프 옵션 ----------
export const LEGEND_POTENTIAL_OPTIONS = ['미적용', '일반적용', '강화적용', '일반40/HOF', '강화40/HOF'] as const
/** 레전드 잠재: 파워/컨택 = 미적용 외 전부 +1 · 스핏 = 아래 표 · 쓰로/수비 없음 */
export const LEGEND_SPEED_BONUS: Record<string, number> = {
  미적용: 0,
  일반적용: 0,
  강화적용: 1,
  '일반40/HOF': 1,
  '강화40/HOF': 2,
}
export const CHEER_POS = ['미적용', '내야', '외야', '캐시'] as const
export const COACH_RUN = ['미적용', '일반', '완벽+'] as const // 감독 뛰는야구C: 기본 스핏 71~80 만 +2/+3
export const COACH_BAT = ['해당없음', '배트스윙훈련+', '공격특화훈련', '공격특화훈련+', '공격형키스톤', '공격형키스톤+'] as const
export const COACH_DEF = ['해당없음', '외야송구훈련', '외야송구훈련+', '내야수비훈련', '내야수비훈련+'] as const
export const CHIEF_FORM = ['미적용', '일반', '완벽+'] as const // 수석 특이폼공략: 파워+1(일반·완벽+) · 컨택+1(완벽+)
export const SPECIAL_TRAIN = ['-', '일반', '완벽'] as const // 스페셜 전용 강점/약점

export const INFIELD = new Set(['C', '1B', '2B', '3B', 'SS'])
export const OUTFIELD = new Set(['LF', 'CF', 'RF'])

// ---------- 저장 스키마 (jsonb ↔ Zod, 깨진 값은 필드별 기본값으로 복구) ----------
const num = (d = 0) => z.number().catch(d)
const stats5Schema = z
  .object({ power: num(), contact: num(), speed: num(), throwing: num(), defense: num() })
  .catch(zeroStats())

export const teamSettingsSchema = z
  .object({
    deck_bonus: stats5Schema,
    legend_potential: z.enum(LEGEND_POTENTIAL_OPTIONS).catch('미적용'),
    team_spirit_b: z.boolean().catch(false),
    maestro: z.number().int().min(0).max(6).catch(0),
    sig_awaken_keystone: z.boolean().catch(false),
    cheer: z
      .object({ pos: z.enum(CHEER_POS).catch('미적용'), stats: stats5Schema })
      .catch({ pos: '미적용', stats: zeroStats() }),
    coach_run: z.enum(COACH_RUN).catch('미적용'),
    coach_bat: z.enum(COACH_BAT).catch('해당없음'),
    coach_def: z.enum(COACH_DEF).catch('해당없음'),
    chief_awaken_b: z.boolean().catch(false),
    chief_form: z.enum(CHIEF_FORM).catch('미적용'),
  })
  .catch({
    deck_bonus: zeroStats(),
    legend_potential: '미적용',
    team_spirit_b: false,
    maestro: 0,
    sig_awaken_keystone: false,
    cheer: { pos: '미적용', stats: zeroStats() },
    coach_run: '미적용',
    coach_bat: '해당없음',
    coach_def: '해당없음',
    chief_awaken_b: false,
    chief_form: '미적용',
  })
export type TeamSettings = z.infer<typeof teamSettingsSchema>
export const parseTeamSettings = (j: unknown): TeamSettings => teamSettingsSchema.parse(j ?? {})

export const growthSchema = z
  .object({
    level: z.number().int().min(0).max(7).catch(0),
    awakening: z.boolean().catch(false), // 풀각성 스피릿
    veteran: z.boolean().catch(false), // 개인 베테랑
    team_veteran: z.boolean().catch(false), // 팀 베테랑 지정(B/SG 카드, 등급별 1명 — UI 강제)
    /** 포지션 고정(훈련) = 활성화한 단일 포지션. null=미고정(주포지션). 듀얼 카드·R/S 제외에만 유효. */
    fixed_position: z.string().nullable().catch(null),
    /** 선택한 주잠재 이름(3개 중 1개). 표시·기록용 — 수치는 extra 에 수동 입력. 베테랑 ON 시 부잠재 활성(표시). */
    selected_potential: z.string().nullable().catch(null),
    coach_training: z.string().catch('해당없음'),
    equip: z.object({ kind: z.enum(EQUIP_KINDS), grade: z.enum(EQUIP_GRADES) }).nullable().catch(null),
    special: z
      .object({ strength: z.enum(SPECIAL_TRAIN).catch('-'), weakness: z.enum(SPECIAL_TRAIN).catch('-') })
      .catch({ strength: '-', weakness: '-' }),
    coop: stats5Schema, // 협동훈련(위시)
    extra: stats5Schema, // 잠재력 등 기타
    body: stats5Schema, // 체형
    body_name: z.string().catch(''), // 체형 훈련 이름 (예: 휘젓기) — 라인업 표 표시용, 수치는 body 에
  })
  .catch({
    level: 0,
    awakening: false,
    veteran: false,
    team_veteran: false,
    fixed_position: null,
    selected_potential: null,
    coach_training: '해당없음',
    equip: null,
    special: { strength: '-', weakness: '-' },
    coop: zeroStats(),
    extra: zeroStats(),
    body: zeroStats(),
    body_name: '',
  })

/** 포지션 훈련 자격 = 듀얼 포지션 보유 + R/S 등급 아님 */
export const canTrainPosition = (grade: string, dualPosition: string | null | undefined) =>
  !!dualPosition && grade !== 'R' && grade !== 'S'
export type Growth = z.infer<typeof growthSchema>
export const parseGrowth = (j: unknown): Growth => growthSchema.parse(j ?? {})
export const DEFAULT_GROWTH: Growth = parseGrowth({})
export const DEFAULT_TEAM_SETTINGS: TeamSettings = parseTeamSettings({})
