import type { ReactNode } from 'react'
import { cn } from '@shared/lib/cn'

export function Chip({
  active,
  onClick,
  children,
  color = 'var(--gold)',
  textColor = '#fff',
}: {
  active?: boolean
  onClick?: () => void
  children: ReactNode
  color?: string
  textColor?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-[6px] text-[.8rem] font-semibold cursor-pointer transition',
        !active && 'text-ink-soft bg-surface-2 border-line-strong',
      )}
      style={active ? { background: color, borderColor: color, color: textColor } : undefined}
    >
      {children}
    </button>
  )
}
