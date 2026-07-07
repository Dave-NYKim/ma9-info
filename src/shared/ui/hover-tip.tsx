import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

const HALF_W = 140 // max-w 280 의 절반 — 화면 밖으로 안 나가게 클램프

const BOX =
  'pointer-events-none fixed z-[100] max-w-[280px] rounded-lg border border-line-strong bg-surface px-2.5 py-2 text-left text-[.72rem] leading-relaxed text-ink shadow-[var(--shadow)]'

const clampX = (x: number) => Math.min(Math.max(x, HALF_W + 8), window.innerWidth - HALF_W - 8)

/** 트리거 rect → 툴팁 위치. 위쪽 공간이 부족하면 아래로 플립(above=false). */
interface TipPos {
  x: number
  y: number
  above: boolean
}
function placeFrom(el: Element): TipPos {
  const r = el.getBoundingClientRect()
  const above = r.top > 140 // 위 공간 부족하면 아래로
  return { x: clampX(r.left + r.width / 2), y: above ? r.top : r.bottom, above }
}

/** 위/아래 플립 반영한 포털 박스 */
function TipBox({ pos, tint, children }: { pos: TipPos; tint?: string; children: ReactNode }) {
  return createPortal(
    <div
      className={BOX}
      style={{
        left: pos.x,
        top: pos.above ? pos.y - 8 : pos.y + 8,
        transform: pos.above ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
        ...(tint && {
          background: `color-mix(in srgb, ${tint} 14%, var(--surface))`,
          borderColor: `color-mix(in srgb, ${tint} 45%, transparent)`,
        }),
      }}
    >
      {children}
    </div>,
    document.body,
  )
}

/** 툴팁 — 마우스는 hover, 터치는 탭 토글(바깥 탭 시 닫힘). body 포털이라 overflow 에 안 잘리고, 공간 부족하면 아래로 플립.
 *  tip 이 없으면(undefined/null) 그냥 children 만 렌더. tint = 배경·보더 색조(CSS 색상). */
export function HoverTip({ tip, tint, children }: { tip?: ReactNode; tint?: string; children: ReactNode }) {
  const [pos, setPos] = useState<TipPos | null>(null)
  const ref = useRef<HTMLSpanElement>(null)

  // 터치로 열렸을 때: 바깥 탭 / 스크롤 시 닫기
  useEffect(() => {
    if (!pos) return
    const close = (e: Event) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setPos(null)
    }
    document.addEventListener('pointerdown', close)
    window.addEventListener('scroll', () => setPos(null), { once: true, capture: true })
    return () => document.removeEventListener('pointerdown', close)
  }, [pos])

  if (tip == null) return <>{children}</>
  return (
    <span
      ref={ref}
      className="inline-flex min-w-0"
      // 마우스: hover 로 열고 벗어나면 닫기
      onMouseEnter={(e) => pos === null && setPos(placeFrom(e.currentTarget))}
      onMouseLeave={() => setPos(null)}
      // 터치: 탭으로 토글 (트리거가 클릭 대상이어도 선택/이동과 겹치지 않게 전파 차단)
      onPointerDown={(e) => {
        if (e.pointerType === 'touch' || e.pointerType === 'pen') {
          e.stopPropagation()
          setPos((cur) => (cur ? null : placeFrom(e.currentTarget)))
        }
      }}
    >
      {children}
      {pos && (
        <TipBox pos={pos} tint={tint}>
          {tip}
        </TipBox>
      )}
    </span>
  )
}

/** 잘린(truncate) 텍스트만 전체 표시 — 안 잘렸으면 아무것도 안 뜸. 마우스 hover / 터치 탭 토글.
 *  호출부 className 에 truncate(+폭 제한)를 넣을 것. */
export function TruncateTip({ text, className }: { text: string; className?: string }) {
  const [pos, setPos] = useState<TipPos | null>(null)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!pos) return
    const close = (e: Event) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setPos(null)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [pos])

  const openIfClipped = (el: HTMLElement) => {
    if (el.scrollWidth <= el.clientWidth) return // 안 잘림 → 툴팁 불필요
    setPos(placeFrom(el))
  }

  return (
    <>
      <span
        ref={ref}
        className={className}
        onMouseEnter={(e) => pos === null && openIfClipped(e.currentTarget)}
        onMouseLeave={() => setPos(null)}
        onPointerDown={(e) => {
          if (e.pointerType === 'touch' || e.pointerType === 'pen') {
            e.stopPropagation()
            if (pos) setPos(null)
            else openIfClipped(e.currentTarget)
          }
        }}
      >
        {text}
      </span>
      {pos && <TipBox pos={pos}>{text}</TipBox>}
    </>
  )
}
