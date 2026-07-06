export type GradeCode = 'SG' | 'B' | 'FR' | 'E' | 'L' | 'R' | 'S'

/** 능력치 순서(높은→낮은). 엑셀 코드 순서와 동일. */
export const GRADES: { code: GradeCode; name: string }[] = [
  { code: 'SG', name: '시그니처' },
  { code: 'B', name: '블랙' },
  { code: 'FR', name: '프랜차이즈' },
  { code: 'E', name: '엘리트' },
  { code: 'L', name: '레전드' },
  { code: 'R', name: '레어' },
  { code: 'S', name: '스페셜' },
]

export const gradeName = (code: string) => GRADES.find((g) => g.code === code)?.name ?? code
export const gradeCssVar = (code: string) => `--g-${code.toLowerCase()}`

/** 카드 등급 바·뱃지 배경 — 시그니처=시안 홀로그램 · 블랙=검정+금장(실카드 금테) · 나머지 단색 */
export const gradeBarBg = (code: string) => {
  if (code === 'SG') return 'linear-gradient(100deg,#3ec3f0 0%,#a9ecff 25%,#5fd0fa 50%,#dff8ff 75%,#3ec3f0 100%)'
  if (code === 'B') return 'linear-gradient(100deg,#0b0b0d 0%,#2e2618 32%,#c9a54a 50%,#2e2618 68%,#0b0b0d 100%)'
  return `var(${gradeCssVar(code)})`
}

/** 카드 본체 배경 — 시그니처=홀로그램 틴트 · 블랙=검정에 가운데 금빛(바 금장과 이어짐) · 나머지 등급색 8% 틴트 */
export const gradeCardBg = (code: string) => {
  if (code === 'SG')
    return `linear-gradient(135deg,
        color-mix(in srgb,#3ec3f0 22%,var(--surface)) 0%,
        color-mix(in srgb,#b3ecff 36%,var(--surface)) 22%,
        color-mix(in srgb,#6fc9f2 16%,var(--surface)) 48%,
        color-mix(in srgb,#e6f9ff 38%,var(--surface)) 74%,
        color-mix(in srgb,#3ec3f0 24%,var(--surface)) 100%)`
  if (code === 'B')
    return `linear-gradient(100deg,
        color-mix(in srgb,#0b0b0d 18%,var(--surface)) 0%,
        color-mix(in srgb,#c9a54a 14%,var(--surface)) 50%,
        color-mix(in srgb,#0b0b0d 18%,var(--surface)) 100%)`
  return `color-mix(in srgb, var(${gradeCssVar(code)}) 8%, var(--surface))`
}
/** 밝은 액센트(하늘색/황금)엔 어두운 글자. */
export const GRADE_ACCENT_TEXT: Record<string, string> = { SG: '#06263a', L: '#3a2c02' }
