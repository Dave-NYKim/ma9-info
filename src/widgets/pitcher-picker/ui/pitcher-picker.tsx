import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import type { Pitcher } from '@entities/pitcher'
import { usePitchers } from '@entities/pitcher'
import { usePool, useAddToPool } from '@entities/pool'
import type { PitcherRole } from '@entities/roster'
import { WeatherIcon, WEATHER_COLOR } from '@features/weather-picker/ui/icons'
import { GRADES, gradeBarBg, GRADE_ACCENT_TEXT } from '@shared/config/grades'
import { useDebounced } from '@shared/lib/use-debounced'
import { cn } from '@shared/lib/cn'
import { Badge, Button, Input, Panel, Toggle } from '@shared/ui'

const gradeRank = (code: string) => GRADES.findIndex((g) => g.code === code)

/** 투수진 빈 칸 클릭 → 투수 선택 팝업.
 *  기본 = 내 풀의 투수 · 「전체 선수」 = 전체 DB 검색(선택 시 풀 자동 등록). 이미 투수진에 있는 투수는 비활성. */
export function PitcherPicker({
  role,
  slotOrder,
  staffIds,
  onPick,
  onClose,
}: {
  role: PitcherRole
  slotOrder: number
  /** 이미 투수진에 편성된 pitcher_id (중복 방지) */
  staffIds: Set<string>
  onPick: (p: Pitcher) => void
  onClose: () => void
}) {
  const [q, setQ] = useState('')
  const dq = useDebounced(q)
  const [allMode, setAllMode] = useState(false)
  const { data: pool = [] } = usePool()
  const addPool = useAddToPool()
  const poolIds = useMemo(() => new Set(pool.filter((r) => r.pitcher_id).map((r) => r.pitcher_id as string)), [pool])
  const { data: allData, isLoading } = usePitchers({ q: dq || undefined, page: 0, size: 100 })

  const rows = useMemo(() => {
    let items: Pitcher[]
    if (allMode) {
      items = allData?.items ?? []
    } else {
      const seen = new Set<string>()
      items = []
      for (const r of pool) {
        const p = r.pitcher
        if (!p || seen.has(p.id)) continue
        if (dq && !p.name.includes(dq.trim())) continue
        seen.add(p.id)
        items.push(p)
      }
    }
    return [...items].sort((a, b) => {
      const g = gradeRank(a.grade) - gradeRank(b.grade)
      if (g !== 0) return g
      return a.name.localeCompare(b.name, 'ko')
    })
  }, [allMode, allData, pool, dq])

  const pick = (p: Pitcher) => {
    if (staffIds.has(p.id)) return
    if (allMode && !poolIds.has(p.id))
      addPool.mutate({ pitcher_id: p.id }, { onSuccess: () => toast(`「${p.name}」 풀에 자동 등록`), onError: (e) => toast.error(e.message) })
    onPick(p)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/75 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-[640px] my-8" onClick={(e) => e.stopPropagation()}>
        <Panel
          title={
            <span className="normal-case tracking-normal text-[.9rem]">
              <b className="text-[color:var(--accent)] text-[1rem]">{role} {slotOrder}</b> <b className="text-ink">자리에 넣을 투수 선택</b>
              <span className="ml-2 text-ink-faint text-[.74rem] font-normal">
                {allMode ? `전체 ${allData?.total ?? 0}명` : `내 풀 ${rows.length}명`}
              </span>
            </span>
          }
          right={
            <Button variant="ghost" className="!px-3 !py-1" onClick={onClose}>
              닫기
            </Button>
          }
        >
          <div className="flex items-center gap-3 mb-2">
            <Input autoFocus placeholder="이름 검색…" value={q} onChange={(e) => setQ(e.target.value)} className="flex-1" />
            <Toggle
              checked={allMode}
              onChange={setAllMode}
              label={<span className="whitespace-nowrap">전체 선수 (선택 시 풀 자동 등록)</span>}
            />
          </div>

          <div className="max-h-[60vh] overflow-auto rounded-lg border border-line">
            {allMode && isLoading ? (
              <div className="p-6 text-center text-ink-faint text-[.85rem]">불러오는 중…</div>
            ) : rows.length === 0 ? (
              <div className="p-6 text-center text-ink-faint text-[.85rem]">
                {allMode ? '해당 투수 없음' : '풀에 투수가 없어요 — 「전체 선수」를 켜보세요'}
              </div>
            ) : (
              rows.map((p) => {
                const inStaff = staffIds.has(p.id)
                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={inStaff}
                    onClick={() => pick(p)}
                    className={cn(
                      'flex w-full items-center gap-2 border-b border-line px-2.5 py-[7px] text-left text-[.8rem] transition cursor-pointer',
                      inStaff ? 'opacity-40 cursor-not-allowed' : 'hover:bg-surface-2',
                    )}
                  >
                    <Badge color={gradeBarBg(p.grade)} text={GRADE_ACCENT_TEXT[p.grade] ?? '#fff'}>
                      {p.grade}
                    </Badge>
                    <span className="min-w-0 truncate font-bold">{p.name}</span>
                    {p.year != null && <span className="shrink-0 text-[.68rem] tabular-nums text-ink-faint">{p.year}</span>}
                    <span className="shrink-0 text-[.72rem] text-ink-soft">{p.team_code}</span>
                    <span className="shrink-0 rounded border border-line-strong px-1 text-[.64rem] font-bold text-ink-soft">{p.position}</span>
                    <span className="shrink-0 text-[.68rem] tabular-nums text-ink-soft">{p.throw_hand}/{p.bat_hand}</span>
                    <span className="flex shrink-0 items-center gap-1">
                      {[p.weather, p.sub_weather].filter((w): w is string => !!w).map((w, i) => (
                        <span key={i} style={{ color: WEATHER_COLOR[w] }} title={w}>
                          <WeatherIcon name={w} />
                        </span>
                      ))}
                    </span>
                    <span className="ml-auto flex items-center gap-2 shrink-0 font-mono tabular-nums text-[.72rem] text-ink-soft">
                      <span><span className="text-ink-faint text-[.6rem]">체력</span> {p.stamina ?? '—'}</span>
                      <span><span className="text-ink-faint text-[.6rem]">제구</span> {p.control ?? '—'}</span>
                    </span>
                    {inStaff && <Badge color="var(--ink-faint)">편성됨</Badge>}
                    {!inStaff && allMode && poolIds.has(p.id) && <Badge color="var(--blue)">풀</Badge>}
                  </button>
                )
              })
            )}
          </div>
          <p className="mt-1.5 mb-0 text-[.66rem] text-ink-faint">
            이미 투수진에 편성된 투수는 회색 · 라인업 선수 선택 = 배치 · 전체 선수에서 고르면 내 풀에 자동 등록
          </p>
        </Panel>
      </div>
    </div>
  )
}
