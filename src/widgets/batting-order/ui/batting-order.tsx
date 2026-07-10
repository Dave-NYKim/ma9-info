import { useState, type CSSProperties } from 'react'
import type { RosterSlot } from '@entities/roster'
import { positionFit, slotView } from '@entities/roster'
import { gradeBarBg, gradeCardBgSoft } from '@shared/config/grades'
import { LINEUP_SIZE } from '@shared/config/roster'
import { GradeMark, Panel } from '@shared/ui'
import { cn } from '@shared/lib/cn'

/** 타순 1~9 — 정보만(등급·연도·이름·팀·투타·포지션). 순서 변경 = 드래그앤드랍.
 *  순수 타순 관리만: 드래그 순서 변경 + 라인업 제거. 육성·스탯·유망주 설정은 전부 풀 패널. */
export function BattingOrder({
  slots,
  editable,
  mismatch,
  onMove,
  onRemove,
}: {
  slots: RosterSlot[]
  editable: boolean
  /** 고정 포지션 ≠ 배치 포지션인 슬롯 id (경고 "!") */
  mismatch?: Set<string>
  /** dragged 를 targetOrder 자리로 (targetSlot = 그 자리에 있던 선수, 빈 자리면 null) */
  onMove: (dragged: RosterSlot, targetOrder: number, targetSlot: RosterSlot | null) => void
  onRemove: (s: RosterSlot) => void
}) {
  const byOrder = new Map(slots.map((s) => [s.lineup_order, s]))
  const [dragId, setDragId] = useState<string | null>(null)
  const [overOrder, setOverOrder] = useState<number | null>(null)

  const drop = (order: number) => {
    const dragged = slots.find((s) => s.id === dragId)
    setDragId(null)
    setOverOrder(null)
    if (!dragged || dragged.lineup_order === order) return
    onMove(dragged, order, byOrder.get(order) ?? null)
  }

  return (
    <Panel
      title="타순"
      right={
        <span className="flex items-center gap-2 text-[.72rem] font-bold tabular-nums text-ink-soft">
          {editable && <span className="font-normal text-ink-faint">드래그로 순서 변경</span>}
          <span>
            {slots.length}/{LINEUP_SIZE}
            {slots.length < LINEUP_SIZE && <span className="ml-1.5 text-[color:var(--gold)]">미완성</span>}
          </span>
        </span>
      }
    >
      <div className="flex flex-col gap-1">
        {Array.from({ length: LINEUP_SIZE }, (_, i) => i + 1).map((order) => {
          const s = byOrder.get(order)
          const isOver = overOrder === order && dragId != null && byOrder.get(order)?.id !== dragId
          const dropProps = editable
            ? {
                onDragOver: (e: React.DragEvent) => {
                  if (dragId) {
                    e.preventDefault()
                    setOverOrder(order)
                  }
                },
                onDragLeave: () => setOverOrder((v) => (v === order ? null : v)),
                onDrop: (e: React.DragEvent) => {
                  e.preventDefault()
                  drop(order)
                },
              }
            : {}
          if (!s) {
            return (
              <div
                key={order}
                {...dropProps}
                className={cn(
                  'flex items-center gap-2 rounded-lg border border-dashed border-line px-2.5 py-[7px] text-[.78rem] text-ink-faint transition',
                  isOver && 'border-[color:var(--accent)] bg-[color:color-mix(in_srgb,var(--accent)_8%,transparent)]',
                )}
              >
                <span className="w-5 text-right font-mono font-bold tabular-nums">{order}</span>
                비어 있음
              </div>
            )
          }
          const v = slotView(s)
          const fit = positionFit({ position: v.mainPos, dual_position: v.dualPos }, s.assigned_position)
          const grade = v.grade // 카드 등급코드 · 유망주는 null
          const isShiny = grade === 'SG' || grade === 'B'
          // 배경 광택 스윕: 시그=흰색(아주 옅게) · 블랙=금색 — 세기 비슷하게 · 배경 전체 반짝
          const shineColor = grade === 'SG' ? 'rgba(255,255,255,.22)' : grade === 'B' ? 'rgba(255,214,90,.5)' : undefined
          const rowBg = grade ? gradeCardBgSoft(grade) : 'color-mix(in srgb, var(--green) 8%, var(--surface))'
          const accent = grade ? gradeBarBg(grade) : 'var(--green)'
          const rowStyle = {
            background: rowBg,
            borderColor: grade === 'SG' ? 'rgba(95,208,250,.55)' : grade === 'B' ? 'rgba(201,165,74,.6)' : 'var(--line)',
            boxShadow: grade === 'SG' ? '0 0 10px rgba(62,195,240,.18)' : grade === 'B' ? '0 0 10px rgba(201,165,74,.16)' : undefined,
            ...(shineColor ? { ['--shine']: shineColor } : {}),
          } as CSSProperties
          return (
            <div
              key={order}
              draggable={editable}
              onDragStart={(e) => {
                setDragId(s.id)
                e.dataTransfer.effectAllowed = 'move'
              }}
              onDragEnd={() => {
                setDragId(null)
                setOverOrder(null)
              }}
              {...dropProps}
              style={rowStyle}
              className={cn(
                'group relative overflow-hidden flex items-center gap-2 rounded-lg border px-2.5 py-[6px] transition',
                isShiny && 'grade-shine',
                editable && 'cursor-grab active:cursor-grabbing',
                dragId === s.id && 'opacity-40',
                isOver && 'outline outline-1 outline-[color:var(--accent)]',
              )}
            >
              {/* 좌측 등급 accent 바 */}
              <span className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: accent }} />
              {/* 콘텐츠 — 광택 스윕(z-auto) 위로 또렷하게 */}
              <span className="relative z-[1] flex flex-1 min-w-0 items-center gap-2 pl-1">
                {editable && <span className="shrink-0 text-ink-faint text-[.7rem] leading-none select-none">⠿</span>}
                <span className="w-5 shrink-0 text-right font-mono font-extrabold tabular-nums text-[.85rem] text-ink-faint">{order}</span>
                <GradeMark grade={v.grade ?? null} className="shrink-0" />
                <span className="flex-1 min-w-0 flex items-baseline gap-1.5">
                  <span className="truncate font-bold text-[.86rem]">{v.name}</span>
                  {v.team && <span className="shrink-0 text-[.7rem] text-ink-soft">{v.team}</span>}
                </span>
                <span className="w-9 shrink-0 text-right font-mono tabular-nums text-[.72rem] text-ink-soft">{v.year ?? ''}</span>
                <span className="w-[46px] shrink-0 text-center text-[.7rem] font-semibold text-ink-soft">{v.levelup ?? ''}</span>
                <span className="w-[52px] shrink-0 text-right text-[.72rem] text-ink-faint tabular-nums">{v.hands ?? ''}</span>
                <span className="w-3 shrink-0 text-center">
                  {mismatch?.has(s.id) && (
                    <span className="text-[.72rem] font-extrabold text-[color:var(--clay)]" title="포지션 고정과 다른 자리에 배치됨">
                      !
                    </span>
                  )}
                </span>
                <span
                  className={cn(
                    'w-11 shrink-0 rounded border py-[1px] text-center text-[.68rem] font-bold',
                    fit === 'main' && 'border-line-strong text-ink-soft bg-surface-2',
                    fit === 'dual' && 'border-[color:var(--gold)] text-[color:var(--gold)]',
                    fit === 'off' && 'border-[color:var(--clay)] text-[color:var(--clay)]',
                  )}
                  title={fit === 'off' ? '카드 포지션과 다른 자리 (수비 페널티)' : fit === 'dual' ? '듀얼 포지션으로 기용' : undefined}
                >
                  {s.assigned_position}
                </span>
                {editable && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onRemove(s)
                    }}
                    className="shrink-0 w-5 h-5 rounded-full text-[.65rem] text-ink-faint hover:bg-ink hover:text-[color:var(--surface)] cursor-pointer opacity-0 group-hover:opacity-100 transition"
                    title="라인업에서 제거"
                  >
                    ✕
                  </button>
                )}
              </span>
            </div>
          )
        })}
      </div>
    </Panel>
  )
}
