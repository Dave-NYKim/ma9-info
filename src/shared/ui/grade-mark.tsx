import type { CSSProperties } from 'react'
import { gradeCssVar, GRADE_ACCENT_TEXT } from '@shared/config/grades'
import { cn } from '@shared/lib/cn'

/**
 * 등급 마크 — 풀·타순 공통. 채워진 뱃지, 모든 등급 동일 너비(한 글자도 두 글자 폭에 맞춤).
 *  SG = 파란 배경 + 흰 광택 반짝 · B = 검정 배경 + 노란 광택 반짝 · 나머지 = 단색 등급색.
 *  grade 가 null/undefined = 유망주 → 초록 U.
 */
export function GradeMark({ grade, className }: { grade?: string | null; className?: string }) {
  const base =
    'inline-flex items-center justify-center rounded-md min-w-[2rem] px-1 py-[2px] text-[.66rem] font-extrabold leading-none tracking-tight'

  if (!grade)
    return (
      <span className={cn(base, className)} style={{ background: 'var(--green)', color: 'var(--surface)' }} title="유망주">
        U
      </span>
    )

  // SG(파랑 배경 + 흰 광택 반짝) · B(검정 배경 + 노란 광택 반짝) — 배경은 그대로, 광택만 흐른다.
  if (grade === 'SG' || grade === 'B') {
    const isSg = grade === 'SG'
    const style = {
      background: isSg ? '#3ec3f0' : '#14171c',
      color: isSg ? '#06263a' : '#fff',
      ['--shine']: isSg ? 'rgba(255,255,255,.9)' : 'rgba(255,214,90,.95)',
    } as CSSProperties
    return (
      <span className={cn(base, 'grade-shine', className)} style={style} title={grade}>
        <span className="relative z-[1]">{grade}</span>
      </span>
    )
  }

  return (
    <span
      className={cn(base, className)}
      style={{ background: `var(${gradeCssVar(grade)})`, color: GRADE_ACCENT_TEXT[grade] ?? '#fff' }}
      title={grade}
    >
      {grade}
    </span>
  )
}
