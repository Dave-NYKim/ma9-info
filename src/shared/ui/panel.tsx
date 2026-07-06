import type { ReactNode } from 'react'
import { cn } from '@shared/lib/cn'

/** 카드. 등급 액센트(--accent)로 은은히 틴트된다. */
export function Panel({
  title,
  accentColor = 'var(--accent)',
  right,
  children,
  className,
}: {
  title?: ReactNode
  accentColor?: string
  right?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn('rounded-xl border p-[14px] shadow-[var(--shadow)]', className)}
      style={{
        background: 'color-mix(in srgb, var(--accent) 5%, var(--surface))',
        borderColor: 'color-mix(in srgb, var(--accent) 24%, var(--line))',
      }}
    >
      {title && (
        <header className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-[3px]" style={{ background: accentColor }} />
          <h2 className="text-[.64rem] uppercase tracking-[.12em] text-ink-faint font-bold m-0">{title}</h2>
          {right && <div className="ml-auto">{right}</div>}
        </header>
      )}
      {children}
    </section>
  )
}
