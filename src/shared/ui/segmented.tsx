import { cn } from '@shared/lib/cn'

export function Segmented({
  options,
  value,
  onChange,
}: {
  options: readonly string[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex rounded-lg border border-line-strong overflow-hidden bg-surface-2">
      {options.map((o, i) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className={cn(
            'flex-1 px-3 py-[7px] text-[.82rem] font-semibold cursor-pointer',
            i > 0 && 'border-l border-line-strong',
            value === o ? 'text-[color:var(--surface)] bg-ink' : 'text-ink-soft',
          )}
        >
          {o}
        </button>
      ))}
    </div>
  )
}
