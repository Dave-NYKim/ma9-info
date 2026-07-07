import { useState } from 'react'
import type { RosterSlot } from '@entities/roster'
import { positionFit, slotView } from '@entities/roster'
import { LINEUP_SIZE } from '@shared/config/roster'
import { gradeBarBg, GRADE_ACCENT_TEXT } from '@shared/config/grades'
import { Badge, Panel } from '@shared/ui'
import { cn } from '@shared/lib/cn'

/** 타순 1~9 — 정보만(등급·연도·이름·팀·투타·포지션). 순서 변경 = 드래그앤드랍. 유망주는 「유망」 뱃지 + 설정 버튼.
 *  육성·스탯·유망주 추가는 여기 없음(전부 풀 패널). */
export function BattingOrder({
  slots,
  editable,
  mismatch,
  onMove,
  onRemove,
  onEditProspect,
}: {
  slots: RosterSlot[]
  editable: boolean
  /** 고정 포지션 ≠ 배치 포지션인 슬롯 id (경고 "!") */
  mismatch?: Set<string>
  /** dragged 를 targetOrder 자리로 (targetSlot = 그 자리에 있던 선수, 빈 자리면 null) */
  onMove: (dragged: RosterSlot, targetOrder: number, targetSlot: RosterSlot | null) => void
  onRemove: (s: RosterSlot) => void
  /** 유망주 슬롯 설정 열기 */
  onEditProspect?: (s: RosterSlot) => void
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
              className={cn(
                'group flex items-center gap-2 rounded-lg border border-line bg-surface px-2.5 py-[6px] transition',
                editable && 'cursor-grab active:cursor-grabbing',
                dragId === s.id && 'opacity-40',
                isOver && 'border-[color:var(--accent)] outline outline-1 outline-[color:var(--accent)]',
              )}
            >
              {editable && <span className="text-ink-faint text-[.7rem] leading-none select-none">⠿</span>}
              <span className="w-5 text-right font-mono font-extrabold tabular-nums text-[.85rem] text-ink-faint">{order}</span>
              {v.grade ? (
                <Badge color={gradeBarBg(v.grade)} text={GRADE_ACCENT_TEXT[v.grade] ?? '#fff'}>
                  {v.grade}
                </Badge>
              ) : (
                <Badge color="var(--green)">유망</Badge>
              )}
              {v.year != null && (
                <span className="shrink-0 rounded border border-line-strong bg-surface px-1 py-[1px] text-[.66rem] font-bold tabular-nums text-ink-soft">
                  {v.year}
                </span>
              )}
              <span className="min-w-0 truncate font-bold text-[.86rem]">{v.name}</span>
              {v.team && <span className="shrink-0 text-[.72rem] text-ink-soft">{v.team}</span>}
              {v.hands && <span className="shrink-0 text-[.72rem] text-ink-faint tabular-nums">{v.hands}</span>}
              {mismatch?.has(s.id) && (
                <span
                  className="shrink-0 rounded bg-[color:var(--clay)] px-1 text-[.66rem] font-extrabold text-white"
                  title="포지션 고정과 다른 자리에 배치됨"
                >
                  !
                </span>
              )}
              <span
                className={cn(
                  'ml-auto shrink-0 rounded border px-1.5 py-[1px] text-[.68rem] font-bold',
                  fit === 'main' && 'border-line-strong text-ink-soft bg-surface-2',
                  fit === 'dual' && 'border-[color:var(--gold)] text-[color:var(--gold)]',
                  fit === 'off' && 'border-[color:var(--clay)] text-[color:var(--clay)]',
                )}
                title={fit === 'off' ? '카드 포지션과 다른 자리 (수비 페널티)' : fit === 'dual' ? '듀얼 포지션으로 기용' : undefined}
              >
                {s.assigned_position}
              </span>
              {editable && v.isProspect && onEditProspect && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEditProspect(s)
                  }}
                  className="shrink-0 rounded border border-[color:var(--green)] px-1.5 py-[2px] text-[.66rem] font-bold text-[color:var(--green)] cursor-pointer"
                  title="유망주 설정 (성장·라이징·특화)"
                >
                  설정
                </button>
              )}
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
            </div>
          )
        })}
      </div>
    </Panel>
  )
}
