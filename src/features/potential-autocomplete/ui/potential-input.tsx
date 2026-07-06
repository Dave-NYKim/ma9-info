import { useId } from 'react'
import { Input } from '@shared/ui'

/** 잠재력 자동완성 입력 (마스터 카탈로그 datalist). 목록에 없어도 입력 가능(소프트 카탈로그). */
export function PotentialInput({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  options: string[]
  placeholder?: string
}) {
  const id = useId()
  return (
    <>
      <Input
        list={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
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
