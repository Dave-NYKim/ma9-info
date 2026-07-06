import type { InputHTMLAttributes, SelectHTMLAttributes, ReactNode } from 'react'
import { cn } from '@shared/lib/cn'

const base =
  'w-full rounded-lg border border-line-strong bg-surface-2 text-ink px-[9px] py-[7px] text-[.85rem] outline-none focus:border-[color:var(--accent)] focus:bg-surface disabled:opacity-40'

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...rest} className={cn(base, 'font-mono tabular-nums', rest.type !== 'number' && 'font-sans', className)} />
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...rest} className={cn(base, 'cursor-pointer', className)}>
      {children}
    </select>
  )
}

/** 라벨 위, 컨트롤 아래 */
export function Labeled({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 min-w-0">
      <span className="text-[.61rem] font-bold uppercase tracking-[.03em] text-ink-faint">{label}</span>
      {children}
    </label>
  )
}
