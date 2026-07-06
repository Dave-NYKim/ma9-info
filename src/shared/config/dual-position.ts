/**
 * 듀얼 포지션 스탯 보정 (마구마구 규칙 · 사용자 확정) — **뷰잉 전용**.
 * 저장값 = 주(main = position) 기준. 부(sub = dual_position) 탭을 볼 때만 아래 보정을
 * "표시"에 적용한다. DB 값은 절대 바꾸지 않음.
 */

/** 스탯 키 → 증감. 없는 키는 0으로 취급. */
export type BatterStatDelta = Record<string, number>

/** 센터라인(수비 프리미엄) 포지션 */
const CENTERLINE = new Set(['C', '2B', 'SS', 'CF'])

/**
 * 타자: 주(main)→부(sub) 조합별 스탯 증감. (우선순위 순)
 *  1) 부 = DH                    → 올스탯 +1 (파워·컨택·스피드·쓰로잉·수비력)
 *  2) 부 = 센터라인(C·2B·SS·CF)  → 파워·컨택·수비 -1
 *  3) 주 = 1B 또는 DH            → 파워·컨택·수비 -1
 *  4) 그 외                       → 파워·컨택 +1
 */
export function batterDualDelta(main: string, sub: string): BatterStatDelta {
  if (sub === 'DH') return { power: 1, contact: 1, speed: 1, throwing: 1, defense: 1 }
  if (CENTERLINE.has(sub)) return { power: -1, contact: -1, defense: -1 }
  if (main === '1B' || main === 'DH') return { power: -1, contact: -1, defense: -1 }
  return { power: 1, contact: 1 }
}

export type PitcherStatDelta = { stamina: number; fastball: number }

const isRelief = (p: string) => p === 'RP' || p === 'CP'

/**
 * 투수: 주(main)→부(sub) 역할 전환 시 체력·포심(S) 증감.
 *  - 계투/마무리(RP·CP) → 선발(SP)      : 체력 +25, 포심 -2
 *  - 선발(SP) → 계투/마무리(RP·CP)      : 체력 -30
 *  - 그 외(같은 계열 등)                 : 변화 없음
 */
export function pitcherDualDelta(main: string, sub: string): PitcherStatDelta {
  if (isRelief(main) && sub === 'SP') return { stamina: 25, fastball: -2 }
  if (main === 'SP' && isRelief(sub)) return { stamina: -30, fastball: 0 }
  return { stamina: 0, fastball: 0 }
}
