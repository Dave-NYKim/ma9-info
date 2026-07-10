/** 팀 빌더(SPEC §9 v2) — 라인업 배치 포지션(야수 8 + DH). 투수(P)는 범위 밖, 마운드는 비워둔다. */
export const LINEUP_POSITIONS = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'] as const
export type LineupPosition = (typeof LINEUP_POSITIONS)[number]

export const LINEUP_SIZE = 9

/** 야구장 오버레이 좌표 — widgets/ballpark viewBox(0 0 100 100) % 기준.
 *  컨테이너는 aspect-[100/46] + preserveAspectRatio="none" 으로 y만 압축되므로 % 좌표는 그대로 유효. */
export const FIELD_POS: Record<LineupPosition | 'P', { x: number; y: number }> = {
  C: { x: 50, y: 92 },
  '1B': { x: 70.5, y: 62 },
  '2B': { x: 60, y: 49 },
  '3B': { x: 29.5, y: 62 },
  SS: { x: 40, y: 49 },
  LF: { x: 22, y: 32 },
  CF: { x: 50, y: 26 },
  RF: { x: 78, y: 32 },
  DH: { x: 88.5, y: 90 },
  P: { x: 50, y: 67 },
}
