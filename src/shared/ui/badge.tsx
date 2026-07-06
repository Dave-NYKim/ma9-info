import type { ReactNode } from 'react'

/** 카드 상단의 작은 라벨 배지 (리그·특이폼·등급 등). */
export function Badge({ color, text = '#fff', children }: { color: string; text?: string; children: ReactNode }) {
  return (
    <span
      className="rounded-md px-1.5 py-[2px] text-[.66rem] font-bold leading-none tracking-tight"
      style={{ background: color, color: text }}
    >
      {children}
    </span>
  )
}
