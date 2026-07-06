import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@shared/lib/cn'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'outline' | 'ghost'
}

export function Button({ variant = 'outline', className, ...rest }: Props) {
  return (
    <button
      {...rest}
      className={cn(
        'font-semibold text-[.86rem] rounded-lg px-4 py-2 cursor-pointer transition disabled:opacity-40 disabled:cursor-not-allowed',
        variant === 'outline' && 'border border-line-strong bg-surface text-ink hover:bg-surface-2',
        variant === 'primary' &&
          'border text-[color:var(--accent-tx)] border-[color:var(--accent)] bg-[color:var(--accent)] hover:brightness-105',
        variant === 'ghost' && 'text-ink-soft hover:bg-surface-2',
        className,
      )}
    />
  )
}
