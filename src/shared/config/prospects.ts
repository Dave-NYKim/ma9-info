/**
 * 유망주(라이징스타) — 48조합 기본스탯 + 성장 상태 스키마 (전거: TEAM_STATS_ANALYSIS.md §3)
 * 기본스탯 = 포지션(8, DH 없음) × 유형1(2) × 유형2(3) 조합 lookup (타자계산기 '타자유망주 DB' 시트 그대로).
 * 라벨은 codes 표준(컨택트·스피드·쓰로잉·수비력)으로 정규화.
 */
import { z } from 'zod'
import { EQUIP_GRADES, EQUIP_KINDS, zeroStats, type Stats5 } from './team-stats'

export const PROSPECT_POSITIONS = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'] as const
export type ProspectPosition = (typeof PROSPECT_POSITIONS)[number]
export const PROSPECT_TYPE1 = ['파워', '컨택트'] as const
export const PROSPECT_TYPE2 = ['스피드', '쓰로잉', '수비력'] as const
export const GROW_STEP = ['-', '일반', '완벽'] as const
export type GrowStep = (typeof GROW_STEP)[number]

const num = (d = 0) => z.number().catch(d)
const stats5 = z.object({ power: num(), contact: num(), speed: num(), throwing: num(), defense: num() }).catch(zeroStats())

export const PROSPECT_BAT_HANDS = ['우타', '좌타', '양타'] as const
export const PROSPECT_THROW_HANDS = ['우투', '좌투'] as const

export const prospectSchema = z
  .object({
    // 정체성 (추가 시 설정) — 일반 카드의 신원과 동일 성격
    name: z.string().catch('유망주'),
    position: z.enum(PROSPECT_POSITIONS).catch('CF'),
    type1: z.enum(PROSPECT_TYPE1).catch('파워'),
    type2: z.enum(PROSPECT_TYPE2).catch('스피드'),
    bat_hand: z.enum(PROSPECT_BAT_HANDS).catch('우타'),
    throw_hand: z.enum(PROSPECT_THROW_HANDS).catch('우투'),
    weather: z.string().nullable().catch(null), // 주 날씨 (유망주는 부날씨 없음)
    // 육성 (별도 「육성」에서) — 일반 선수의 roster_growth 대응
    steps: z.array(z.enum(GROW_STEP)).length(7).catch(['-', '-', '-', '-', '-', '-', '-']),
    rising: z.boolean().catch(false), // 라이징스타 적용 (전 스탯 +2)
    roy_awaken: z.boolean().catch(false), // 풀각성 ROY (유형 일치 +4 / 불일치 +6)
    strength: z.enum(GROW_STEP).catch('-'), // 강점 훈련 (유형 일치 +1/+2)
    weakness: z.enum(GROW_STEP).catch('-'), // 약점 훈련 (유형 외 +1/+3)
    equip: z.object({ kind: z.enum(EQUIP_KINDS), grade: z.enum(EQUIP_GRADES) }).nullable().catch(null),
    coop: stats5, // 협동훈련
    extra: stats5, // 잠재력 등 기타
    body: stats5, // 특화훈련(유망주 체형)
  })
  .catch({
    name: '유망주',
    position: 'CF',
    type1: '파워',
    type2: '스피드',
    bat_hand: '우타',
    throw_hand: '우투',
    weather: null,
    steps: ['-', '-', '-', '-', '-', '-', '-'],
    rising: false,
    roy_awaken: false,
    strength: '-',
    weakness: '-',
    equip: null,
    coop: zeroStats(),
    extra: zeroStats(),
    body: zeroStats(),
  })
export type Prospect = z.infer<typeof prospectSchema>
export const parseProspect = (j: unknown): Prospect => prospectSchema.parse(j ?? {})
export const DEFAULT_PROSPECT: Prospect = parseProspect({})

/** 유망주 육성이 하나라도 설정됐는지 (풀 「육성」 요약용) */
export function prospectHasGrowth(p: Prospect): boolean {
  return (
    p.steps.some((s) => s !== '-') ||
    p.rising ||
    p.roy_awaken ||
    p.strength !== '-' ||
    p.weakness !== '-' ||
    !!p.equip ||
    [p.coop, p.extra, p.body].some((v) => Object.values(v).some((n) => n !== 0))
  )
}

/** 48조합 기본스탯 [파워, 컨택, 스핏, 쓰로, 수비] — 키 `포지션|유형1|유형2` */
const T: Record<string, [number, number, number, number, number]> = {
  'C|파워|스피드': [67, 62, 62, 70, 70],
  'C|파워|수비력': [69, 64, 61, 71, 71],
  'C|파워|쓰로잉': [68, 63, 61, 71, 71],
  'C|컨택트|스피드': [61, 68, 63, 70, 70],
  'C|컨택트|수비력': [63, 69, 62, 71, 71],
  'C|컨택트|쓰로잉': [62, 67, 62, 71, 71],
  '1B|파워|스피드': [68, 62, 63, 69, 71],
  '1B|파워|수비력': [69, 63, 60, 71, 72],
  '1B|파워|쓰로잉': [70, 64, 61, 71, 72],
  '1B|컨택트|스피드': [59, 68, 64, 69, 71],
  '1B|컨택트|수비력': [61, 69, 61, 71, 72],
  '1B|컨택트|쓰로잉': [63, 70, 62, 71, 72],
  '2B|파워|스피드': [66, 61, 67, 70, 71],
  '2B|파워|수비력': [67, 62, 65, 71, 72],
  '2B|파워|쓰로잉': [68, 63, 66, 71, 72],
  '2B|컨택트|스피드': [59, 67, 68, 70, 71],
  '2B|컨택트|수비력': [60, 68, 66, 71, 72],
  '2B|컨택트|쓰로잉': [62, 69, 67, 71, 72],
  '3B|파워|스피드': [68, 62, 63, 69, 71],
  '3B|파워|수비력': [69, 63, 60, 71, 72],
  '3B|파워|쓰로잉': [70, 64, 61, 71, 72],
  '3B|컨택트|스피드': [59, 68, 64, 69, 71],
  '3B|컨택트|수비력': [61, 69, 61, 71, 72],
  '3B|컨택트|쓰로잉': [63, 70, 62, 71, 72],
  'SS|파워|스피드': [66, 61, 67, 70, 71],
  'SS|파워|수비력': [67, 62, 65, 71, 72],
  'SS|파워|쓰로잉': [68, 63, 66, 71, 72],
  'SS|컨택트|스피드': [59, 67, 68, 70, 71],
  'SS|컨택트|수비력': [60, 68, 65, 71, 72],
  'SS|컨택트|쓰로잉': [62, 69, 66, 71, 72],
  'LF|파워|스피드': [66, 62, 71, 69, 71],
  'LF|파워|수비력': [67, 63, 69, 71, 72],
  'LF|파워|쓰로잉': [69, 64, 70, 71, 72],
  'LF|컨택트|스피드': [59, 68, 72, 69, 71],
  'LF|컨택트|수비력': [61, 69, 70, 71, 72],
  'LF|컨택트|쓰로잉': [63, 70, 71, 71, 72],
  'CF|파워|스피드': [66, 62, 71, 69, 71],
  'CF|파워|수비력': [67, 63, 71, 70, 72],
  'CF|파워|쓰로잉': [68, 64, 71, 71, 72],
  'CF|컨택트|스피드': [58, 68, 72, 69, 71],
  'CF|컨택트|수비력': [60, 69, 71, 70, 72],
  'CF|컨택트|쓰로잉': [62, 70, 71, 71, 72],
  'RF|파워|스피드': [66, 62, 71, 69, 71],
  'RF|파워|수비력': [67, 63, 69, 71, 72],
  'RF|파워|쓰로잉': [69, 64, 70, 71, 72],
  'RF|컨택트|스피드': [59, 68, 72, 69, 71],
  'RF|컨택트|수비력': [61, 69, 70, 71, 72],
  'RF|컨택트|쓰로잉': [63, 70, 70, 71, 72],
}

export function prospectBaseStats(p: Pick<Prospect, 'position' | 'type1' | 'type2'>): Stats5 {
  const row = T[`${p.position}|${p.type1}|${p.type2}`]
  if (!row) return zeroStats()
  const [power, contact, speed, throwing, defense] = row
  return { power, contact, speed, throwing, defense }
}
