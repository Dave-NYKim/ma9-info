import type { ReactNode } from 'react'
import { cn } from '@shared/lib/cn'

export interface Column<T> {
  key: string
  label: string
  align?: 'left' | 'right'
  render?: (row: T) => ReactNode
}

export function DataTable<T extends { id: string }>({
  rows,
  columns,
  onRow,
}: {
  rows: T[]
  columns: Column<T>[]
  onRow: (id: string) => void
}) {
  return (
    <div className="rounded-xl border border-line bg-surface overflow-x-auto shadow-[var(--shadow)]">
      <table className="w-full text-[.83rem] border-collapse whitespace-nowrap [&_th]:px-3 [&_th]:py-2 [&_td]:px-3 [&_td]:py-[7px]">
        <thead>
          <tr className="text-[.63rem] uppercase tracking-[.06em] text-ink-faint border-b border-line-strong bg-surface-2">
            {columns.map((c) => (
              <th key={c.key} className={c.align === 'right' ? 'text-right' : 'text-left'}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.id}
              onClick={() => onRow(r.id)}
              className="border-t border-line hover:bg-surface-2 cursor-pointer"
            >
              {columns.map((c) => (
                <td key={c.key} className={cn(c.align === 'right' && 'text-right font-mono tabular-nums text-ink-soft')}>
                  {c.render ? c.render(r) : ((r as Record<string, unknown>)[c.key] as ReactNode) ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <div className="p-8 text-center text-ink-faint text-[.85rem]">선수 없음</div>}
    </div>
  )
}
