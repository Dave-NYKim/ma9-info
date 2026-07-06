/** 목록 상세검색 필터 — 타자·투수 공용 (컬럼 구조가 동일한 부분만) */

export interface StatRange {
  min?: number
  max?: number
}

export interface AdvancedFilters {
  /** 주날씨 일치 */
  weather?: string
  /** 부날씨 일치 */
  subWeather?: string
  /** 주·부 포지션 중 일치 */
  position?: string
  /** 잠재력 부분일치 — 주1~3 + 베테랑 + 듀얼 4종 전체에서 검색 */
  potential?: string
  /** 스탯 컬럼 → 이상/이하 범위 */
  stats?: Record<string, StatRange>
}

const POTENTIAL_COLS = [
  'potential1',
  'potential2',
  'potential3',
  'sub_potential',
  'dual_potential1',
  'dual_potential2',
  'dual_potential3',
  'dual_sub_potential',
]

/** PostgREST eq()/or()/gte()/lte() 를 가진 쿼리빌더에 상세필터 적용 (체이닝 유지) */
export function applyAdvancedFilters<
  Q extends {
    eq(col: string, v: string): Q
    or(filters: string): Q
    gte(col: string, v: number): Q
    lte(col: string, v: number): Q
  },
>(q: Q, f: AdvancedFilters): Q {
  if (f.weather) q = q.eq('weather', f.weather)
  if (f.subWeather) q = q.eq('sub_weather', f.subWeather)
  if (f.position) q = q.or(`position.eq.${f.position},dual_position.eq.${f.position}`)
  const pot = f.potential?.trim().replace(/[,()%]/g, '') // or() 구문 예약문자 제거
  if (pot) q = q.or(POTENTIAL_COLS.map((c) => `${c}.ilike.%${pot}%`).join(','))
  for (const [col, r] of Object.entries(f.stats ?? {})) {
    if (r.min != null) q = q.gte(col, r.min)
    if (r.max != null) q = q.lte(col, r.max)
  }
  return q
}
