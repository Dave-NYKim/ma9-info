import { useEffect } from 'react'
import { GRADES, GRADE_ACCENT_TEXT, gradeCssVar, gradeName, type GradeCode } from '@shared/config/grades'
import { applyGradeAccent } from '../lib/accent'

export function GradeChips({ value, onChange }: { value: GradeCode; onChange: (v: GradeCode) => void }) {
  useEffect(() => {
    applyGradeAccent(value)
  }, [value])

  return (
    <div className="flex flex-wrap gap-[5px] items-center">
      {GRADES.map((g) => {
        const active = g.code === value
        const color = `var(${gradeCssVar(g.code)})`
        const style: React.CSSProperties = active
          ? g.code === 'SG'
            ? { background: 'linear-gradient(135deg,#6fd3f5,#2ea6e0 55%,#7b8fe8)', borderColor: '#3fb0e6', color: '#06263a' }
            : { background: color, borderColor: color, color: GRADE_ACCENT_TEXT[g.code] ?? '#fff' }
          : { color, borderColor: color, background: 'transparent' }
        return (
          <button
            key={g.code}
            type="button"
            title={g.name}
            onClick={() => onChange(g.code)}
            style={style}
            className="text-[.77rem] font-extrabold min-w-[44px] text-center px-2 py-[5px] rounded-[7px] border-[1.5px] cursor-pointer transition"
          >
            {g.code}
          </button>
        )
      })}
      <span className="text-[.7rem] font-bold" style={{ color: `var(${gradeCssVar(value)})` }}>
        {gradeName(value)}
      </span>
    </div>
  )
}
