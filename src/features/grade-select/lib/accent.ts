import { GRADE_ACCENT_TEXT, gradeCssVar } from '@shared/config/grades'

/** 선택 등급 색을 폼 전역 액센트(--accent)로 반영. 카드 틴트·포커스·버튼 등이 따라 바뀐다. */
export function applyGradeAccent(code: string) {
  const root = document.documentElement
  const color = getComputedStyle(root).getPropertyValue(gradeCssVar(code)).trim()
  root.style.setProperty('--accent', color || 'var(--clay)')
  root.style.setProperty('--accent-tx', GRADE_ACCENT_TEXT[code] ?? '#fff')
}

export function resetAccent() {
  const root = document.documentElement
  root.style.removeProperty('--accent')
  root.style.removeProperty('--accent-tx')
}
