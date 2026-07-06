import { useId } from 'react'
import { Input } from '@shared/ui'

/** 잠재력 자동완성 입력 (마스터 카탈로그 datalist).
 *  onBlur = 입력을 벗어날 때 (값, 재포커스 콜백) 전달 — 새 잠재력 즉시 등록 확인용. */
export function PotentialInput({
  value,
  onChange,
  options,
  placeholder,
  onBlur,
}: {
  value: string
  onChange: (v: string) => void
  options: string[]
  placeholder?: string
  onBlur?: (v: string, refocus: () => void) => void
}) {
  const id = useId()
  return (
    <>
      <Input
        list={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => {
          const el = e.currentTarget
          onBlur?.(value, () => setTimeout(() => el.focus(), 0))
        }}
        placeholder={placeholder}
        type="text"
      />
      <datalist id={id}>
        {options.map((o) => (
          <option key={o} value={o} />
        ))}
      </datalist>
    </>
  )
}
