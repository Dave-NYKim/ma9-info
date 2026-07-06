import type { CodeMap } from '../model/types'

export const codeValues = (map: CodeMap | undefined, cat: string): string[] =>
  (map?.[cat] ?? []).map((r) => r.code)

export const codeLabel = (map: CodeMap | undefined, cat: string, code: string | null): string =>
  !code ? '' : (map?.[cat] ?? []).find((r) => r.code === code)?.label ?? code

/** 리그에 속한 팀 코드 */
export const teamsByLeague = (map: CodeMap | undefined, league: string | undefined): string[] =>
  (map?.['team'] ?? []).filter((r) => !league || r.parent === league).map((r) => r.code)

/** 키(S/W/…)에 배정 가능한 계열 구종(특이구종 placeholder 제외) */
export const pitchesByKey = (map: CodeMap | undefined, key: string): string[] =>
  (map?.['pitch'] ?? []).filter((r) => r.parent === key && r.code !== '특이구종').map((r) => r.code)
