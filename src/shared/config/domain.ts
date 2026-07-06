/** 정적 도메인 상수 (enum 값 자체는 entities/enum 에서 Supabase로 로드) */

export const PITCH_KEYS = ['S', 'W', 'A', 'D', 'F', 'Z', 'X', 'C'] as const
export type PitchKey = (typeof PITCH_KEYS)[number]

/** 투수 레벨업 대상 = 채운 구종 중 S 제외 */
export const LEVELUP_PITCH_KEYS: PitchKey[] = ['W', 'A', 'D', 'F', 'Z', 'X', 'C']

/** 투수는 S(포심) 필수 + 최대 5 = 총 6 */
export const PITCH_MAX = 6

/** 키보드 배열 (그리드 area). S는 홈행 가운데. */
export const KEYBOARD_LAYOUT: { key: PitchKey; area: string }[] = [
  { key: 'W', area: 'kw' },
  { key: 'A', area: 'ka' }, { key: 'S', area: 'ks' }, { key: 'D', area: 'kd' }, { key: 'F', area: 'kf' },
  { key: 'Z', area: 'kz' }, { key: 'X', area: 'kx' }, { key: 'C', area: 'kc' },
]

export const WEATHERS = ['해', '구름', '비', '눈', '무속'] as const

export const THROW_HANDS = ['좌투', '우투'] as const
export const BAT_HANDS = ['좌타', '양타', '우타'] as const
export const LEVELUP1 = ['파워', '컨택트'] as const
export const LEVELUP2 = ['스피드', '쓰로잉', '수비력'] as const

export const BATTER_STATS = [
  { key: 'power', label: '파워' },
  { key: 'contact', label: '컨택트' },
  { key: 'speed', label: '스피드' },
  { key: 'throwing', label: '쓰로잉' },
  { key: 'defense', label: '수비력' },
  { key: 'clutch', label: '클러치' },
] as const

export const STAT_MIN = 1
export const STAT_MAX = 100
