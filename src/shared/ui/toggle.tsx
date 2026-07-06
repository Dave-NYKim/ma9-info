import type { ReactNode } from 'react'

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label?: ReactNode
}) {
  return (
    <label className="inline-flex items-center gap-[9px] cursor-pointer select-none text-[.83rem] font-semibold text-ink-soft">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        className="w-10 h-[23px] rounded-full bg-line-strong relative transition-colors flex-none
          peer-checked:bg-[color:var(--green)]
          after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:w-[17px] after:h-[17px]
          after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-[17px]"
      />
      {label}
    </label>
  )
}
