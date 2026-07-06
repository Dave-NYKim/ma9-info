import { useEffect, useRef, useState } from 'react'
import { Button, Input } from '@shared/ui'

/**
 * 이름 자동완성 입력.
 * 타이핑하면 부모가 넘긴 후보(items)를 드롭다운으로 보여주고,
 * 항목을 고르면 "정보를 불러오겠습니까?" 확인 후 onPick 호출.
 * 값 자체는 부모(폼 상태)가 소유하는 controlled 컴포넌트.
 */
export function NameAutocomplete<T>({
  value,
  onChange,
  items,
  getName,
  getHint,
  onPick,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  items: T[]
  getName: (t: T) => string
  getHint: (t: T) => string
  onPick: (t: T) => void
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState<T | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setPending(null)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const close = () => {
    setOpen(false)
    setPending(null)
  }

  const show = open && value.trim() !== '' && (items.length > 0 || pending)

  return (
    <div ref={ref} className="relative">
      <Input
        type="text"
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
          setPending(null)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => e.key === 'Escape' && close()}
      />
      {show && (
        <div className="absolute z-30 mt-1 w-full min-w-[220px] rounded-lg border border-line-strong bg-surface shadow-[var(--shadow)] overflow-hidden">
          {pending ? (
            <div className="p-2.5 flex flex-col gap-2">
              <div className="text-[.82rem]">
                <b>{getName(pending)}</b> 정보를 불러오겠습니까?
              </div>
              <div className="text-[.7rem] text-ink-faint -mt-1">{getHint(pending)}</div>
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" className="px-3 py-1" onClick={() => setPending(null)}>
                  취소
                </Button>
                <Button
                  variant="primary"
                  className="px-3 py-1"
                  onClick={() => {
                    onPick(pending)
                    close()
                  }}
                >
                  불러오기
                </Button>
              </div>
            </div>
          ) : (
            <ul className="max-h-[240px] overflow-auto py-1">
              {items.map((it, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => setPending(it)}
                    className="w-full text-left px-2.5 py-1.5 hover:bg-surface-2 flex items-center gap-2"
                  >
                    <span className="font-semibold text-[.82rem]">{getName(it)}</span>
                    <span className="ml-auto text-[.7rem] text-ink-faint tabular-nums">{getHint(it)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
