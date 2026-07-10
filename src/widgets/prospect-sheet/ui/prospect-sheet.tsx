import { useState } from 'react'
import {
  PROSPECT_BAT_HANDS,
  PROSPECT_POSITIONS,
  PROSPECT_THROW_HANDS,
  PROSPECT_TYPE1,
  PROSPECT_TYPE2,
  prospectBaseStats,
  type Prospect,
} from '@shared/config/prospects'
import { STAT5, STAT5_LABEL } from '@shared/config/team-stats'
import { WEATHERS } from '@shared/config/domain'
import { WeatherIcon, WEATHER_COLOR } from '@features/weather-picker/ui/icons'
import { Badge, Button, Labeled, Panel } from '@shared/ui'
import { cn } from '@shared/lib/cn'

/** 유망주 추가/편집 — 정체성만(이름·포지션·유형·투타). 라인업 배치는 풀의 포지션 칩, 세부 육성은 「육성」에서. */
export function ProspectSheet({
  initial,
  mode,
  onSave,
  onClose,
}: {
  initial: Prospect
  mode: 'create' | 'edit'
  onSave: (p: Prospect) => void
  onClose: () => void
}) {
  const [p, setP] = useState<Prospect>(initial)
  const set = (patch: Partial<Prospect>) => setP((prev) => ({ ...prev, ...patch }))
  const base = prospectBaseStats(p)

  const chip = (active: boolean) =>
    cn(
      'rounded-lg border px-2.5 py-[5px] text-[.78rem] font-bold cursor-pointer transition',
      active ? 'bg-ink text-[color:var(--surface)] border-ink' : 'bg-surface-2 text-ink-soft border-line-strong hover:border-ink',
    )

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/75 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-[560px] my-6" onClick={(e) => e.stopPropagation()}>
        <Panel
          title={
            <span className="normal-case tracking-normal text-[.9rem] flex items-center gap-2">
              <Badge color="var(--green)">유망주</Badge>
              <b className="text-ink text-[1rem]">{mode === 'create' ? '유망주 추가' : p.name}</b>
            </span>
          }
          right={
            <div className="flex gap-2">
              <Button variant="ghost" className="!px-3 !py-1" onClick={onClose}>
                취소
              </Button>
              <Button variant="primary" className="!px-3 !py-1" onClick={() => onSave(p)}>
                저장
              </Button>
            </div>
          }
        >
          <div className="flex flex-col gap-3">
            {/* 이름 · 잠재력 */}
            <div className="grid grid-cols-2 gap-2">
              <Labeled label="이름">
                <input
                  className="w-full rounded-lg border border-line-strong bg-surface-2 text-ink px-[9px] py-[7px] text-[.85rem] outline-none focus:border-[color:var(--accent)]"
                  value={p.name}
                  onChange={(e) => set({ name: e.target.value })}
                />
              </Labeled>
              <Labeled label="잠재력 (직접 입력 · 라인업 표 표시용)">
                <input
                  className="w-full rounded-lg border border-line-strong bg-surface-2 text-ink px-[9px] py-[7px] text-[.85rem] outline-none focus:border-[color:var(--accent)]"
                  value={p.potential}
                  placeholder="예: 정교한타격"
                  onChange={(e) => set({ potential: e.target.value })}
                />
              </Labeled>
            </div>

            {/* 유망주 포지션 (기본스탯 결정) */}
            <Labeled label="유망주 포지션 (기본스탯 결정 · DH 없음)">
              <div className="flex flex-wrap gap-1">
                {PROSPECT_POSITIONS.map((o) => (
                  <button key={o} type="button" className={chip(p.position === o)} onClick={() => set({ position: o })}>
                    {o}
                  </button>
                ))}
              </div>
            </Labeled>

            {/* 레벨업 유형 */}
            <div className="grid grid-cols-2 gap-2">
              <Labeled label="레벨업 유형 1">
                <div className="flex gap-1">
                  {PROSPECT_TYPE1.map((o) => (
                    <button key={o} type="button" className={chip(p.type1 === o)} onClick={() => set({ type1: o })}>
                      {o}
                    </button>
                  ))}
                </div>
              </Labeled>
              <Labeled label="레벨업 유형 2">
                <div className="flex gap-1">
                  {PROSPECT_TYPE2.map((o) => (
                    <button key={o} type="button" className={chip(p.type2 === o)} onClick={() => set({ type2: o })}>
                      {o}
                    </button>
                  ))}
                </div>
              </Labeled>
            </div>

            {/* 투구/타석 */}
            <div className="grid grid-cols-2 gap-2">
              <Labeled label="투구">
                <div className="flex gap-1">
                  {PROSPECT_THROW_HANDS.map((o) => (
                    <button key={o} type="button" className={chip(p.throw_hand === o)} onClick={() => set({ throw_hand: o })}>
                      {o}
                    </button>
                  ))}
                </div>
              </Labeled>
              <Labeled label="타석">
                <div className="flex gap-1">
                  {PROSPECT_BAT_HANDS.map((o) => (
                    <button key={o} type="button" className={chip(p.bat_hand === o)} onClick={() => set({ bat_hand: o })}>
                      {o}
                    </button>
                  ))}
                </div>
              </Labeled>
            </div>

            {/* 날씨 (유망주 = 주 날씨만, 부날씨 없음) */}
            <Labeled label="날씨 (재클릭 해제)">
              <div className="flex gap-[6px]">
                {WEATHERS.map((w) => {
                  const active = p.weather === w
                  return (
                    <button
                      key={w}
                      type="button"
                      title={w}
                      onClick={() => set({ weather: active ? null : w })}
                      style={{ color: WEATHER_COLOR[w] }}
                      className={cn(
                        'flex-1 h-12 rounded-[11px] border-[1.5px] bg-surface-2 flex flex-col items-center justify-center cursor-pointer transition',
                        active ? 'border-[color:var(--clay)] shadow-[0_0_0_1px_var(--clay)]' : 'border-line-strong hover:border-ink-faint',
                      )}
                    >
                      <WeatherIcon name={w} />
                      <span className="text-[.53rem] font-bold text-ink-faint">{w}</span>
                    </button>
                  )
                })}
              </div>
            </Labeled>

            {/* 기본스탯 자동 미리보기 */}
            <div className="flex items-center gap-3 rounded-lg border border-line bg-surface-2 px-3 py-2 flex-wrap">
              <span className="text-[.64rem] font-bold uppercase tracking-[.08em] text-ink-faint">기본 스탯 (자동)</span>
              {STAT5.map((k) => (
                <span key={k} className="flex items-baseline gap-1">
                  <span className="text-[.66rem] text-ink-faint">{STAT5_LABEL[k]}</span>
                  <b className="font-mono tabular-nums">{base[k]}</b>
                </span>
              ))}
            </div>

            <p className="m-0 text-[.72rem] text-ink-faint">
              추가하면 풀에 담깁니다. 라인업 배치는 풀의 포지션 칩, 세부 육성(성장·라이징·장비)은 「육성」에서 (일반 선수와 동일).
            </p>
          </div>
        </Panel>
      </div>
    </div>
  )
}
