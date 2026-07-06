import { useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

const HALF_W = 140 // max-w 280 의 절반 — 화면 밖으로 안 나가게 클램프

const BOX =
  'pointer-events-none fixed z-[100] max-w-[280px] rounded-lg border border-line-strong bg-surface px-2.5 py-2 text-left text-[.72rem] leading-relaxed text-ink shadow-[var(--shadow)]'

const clampX = (x: number) => Math.min(Math.max(x, HALF_W + 8), window.innerWidth - HALF_W - 8)

/** 마우스 오버 툴팁 — body 포털이라 카드 overflow-hidden 에 잘리지 않음.
 *  tip 이 없으면(undefined/null) 그냥 children 만 렌더. tint = 배경·보더 색조(CSS 색상). */
export function HoverTip({ tip, tint, children }: { tip?: ReactNode; tint?: string; children: ReactNode }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  if (tip == null) return <>{children}</>
  return (
    <span
      className="inline-flex min-w-0"
      onMouseEnter={(e) => {
        const r = e.currentTarget.getBoundingClientRect()
        setPos({ x: clampX(r.left + r.width / 2), y: r.top })
      }}
      onMouseLeave={() => setPos(null)}
    >
      {children}
      {pos &&
        createPortal(
          <div
            className={BOX}
            style={{
              left: pos.x,
              top: pos.y - 8,
              transform: 'translate(-50%, -100%)',
              ...(tint && {
                background: `color-mix(in srgb, ${tint} 14%, var(--surface))`,
                borderColor: `color-mix(in srgb, ${tint} 45%, transparent)`,
              }),
            }}
          >
            {tip}
          </div>,
          document.body,
        )}
    </span>
  )
}

/** 잘린(truncate) 텍스트만 마우스 오버 즉시 전체 표시 — 안 잘렸으면 아무것도 안 뜸.
 *  호출부 className 에 truncate(+폭 제한)를 넣을 것. */
export function TruncateTip({ text, className }: { text: string; className?: string }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  return (
    <>
      <span
        className={className}
        onMouseEnter={(e) => {
          const el = e.currentTarget
          if (el.scrollWidth <= el.clientWidth) return // 안 잘림 → 툴팁 불필요
          const r = el.getBoundingClientRect()
          setPos({ x: clampX(r.left + r.width / 2), y: r.top })
        }}
        onMouseLeave={() => setPos(null)}
      >
        {text}
      </span>
      {pos &&
        createPortal(
          <div className={BOX} style={{ left: pos.x, top: pos.y - 8, transform: 'translate(-50%, -100%)' }}>
            {text}
          </div>,
          document.body,
        )}
    </>
  )
}
