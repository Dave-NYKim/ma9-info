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
/** 밝은 액센트(하늘색/황금)엔 어두운 글자. */
export const GRADE_ACCENT_TEXT: Record<string, string> = { SG: '#06263a', L: '#3a2c02' }
