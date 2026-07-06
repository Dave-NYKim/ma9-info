import { useState } from 'react'
import { codeLabel, codeValues, teamsByLeague, type CodeMap } from '@entities/code'
import { useBatterPotentials, usePitcherPotentials } from '@entities/potential'
import { PotentialInput } from '@features/potential-autocomplete'
import type { AdvancedFilters, StatRange } from '@shared/api/advanced-filters'
import {
  BATTER_STATS,
  PITCHER_STATS,
  PITCHER_POSITION_CODES,
  PITCH_KEYS,
  LEVELUP_PITCH_KEYS,
  LEVELUP1,
  LEVELUP2,
  WEATHERS,
  STAT_MIN,
  STAT_MAX,
} from '@shared/config/domain'
import { Button, Input, Labeled, Select } from '@shared/ui'

export interface Filters extends AdvancedFilters {
  league?: string
  team?: string
  grade?: string
  q?: string
  /** 타자: 레벨업 1유형(파워/컨택트) · 2유형(스피드/쓰로잉/수비력, 듀얼 포함) */
  levelup1?: string
  levelup2?: string
  /** 투수: 레벨업(성장) 구종 키 · 구종 구위 범위 */
  levelupPitch?: string
  pitches?: Record<string, StatRange>
}

/** 범위(이상~이하) 레코드 갱신 — 둘 다 비면 키 제거(쿼리키 청결 유지) */
function mergeRange(
  rec: Record<string, StatRange> | undefined,
  key: string,
  part: Partial<StatRange>,
): Record<string, StatRange> | undefined {
  const cur = { ...(rec?.[key] ?? {}), ...part }
  const next = { ...(rec ?? {}) }
  if (cur.min == null && cur.max == null) delete next[key]
  else next[key] = cur
  return Object.keys(next).length ? next : undefined
}

const activeRanges = (rec: Record<string, StatRange> | undefined) =>
  Object.values(rec ?? {}).filter((r) => r.min != null || r.max != null).length

export function FilterBar({
  kind,
  enums,
  value,
  onChange,
}: {
  kind: 'batter' | 'pitcher'
  enums: CodeMap | undefined
  value: Filters
  onChange: (f: Filters) => void
}) {
  const [open, setOpen] = useState(false)
  const { data: batterPots } = useBatterPotentials()
  const { data: pitcherPots } = usePitcherPotentials()

  const set = (patch: Partial<Filters>) => onChange({ ...value, ...patch })

  const isPitcher = kind === 'pitcher'
  const potOptions = (isPitcher ? pitcherPots : batterPots) ?? []
  const stats = isPitcher ? PITCHER_STATS : BATTER_STATS
  const pitcherPos = PITCHER_POSITION_CODES as readonly string[]
  const positions = codeValues(enums, 'position').filter((c) => pitcherPos.includes(c) === isPitcher)

  const numOrUndef = (s: string) => (s === '' ? undefined : Number(s))

  // 활성 상세조건 수 (접혀 있어도 뱃지로 보이게)
  const advCount =
    (value.weather ? 1 : 0) +
    (value.subWeather ? 1 : 0) +
    (value.position ? 1 : 0) +
    (value.potential?.trim() ? 1 : 0) +
    (value.levelup1 ? 1 : 0) +
    (value.levelup2 ? 1 : 0) +
    (value.levelupPitch ? 1 : 0) +
    activeRanges(value.stats) +
    activeRanges(value.pitches)

  const clearAdvanced = () =>
    set({
      weather: undefined,
      subWeather: undefined,
      position: undefined,
      potential: undefined,
      levelup1: undefined,
      levelup2: undefined,
      levelupPitch: undefined,
      stats: undefined,
      pitches: undefined,
    })

  /** 이상~이하 입력 쌍 */
  const RangeInputs = ({ range, onPart }: { range: StatRange | undefined; onPart: (p: Partial<StatRange>) => void }) => (
    <div className="flex items-center gap-1">
      <Input
        type="number"
        min={STAT_MIN}
        max={STAT_MAX}
        placeholder="이상"
        className="w-[60px]"
        value={range?.min ?? ''}
        onChange={(e) => onPart({ min: numOrUndef(e.target.value) })}
      />
      <span className="text-ink-faint">~</span>
      <Input
        type="number"
        min={STAT_MIN}
        max={STAT_MAX}
        placeholder="이하"
        className="w-[60px]"
        value={range?.max ?? ''}
        onChange={(e) => onPart({ max: numOrUndef(e.target.value) })}
      />
    </div>
  )

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2 items-center">
        <Select
          className="w-auto"
          value={value.league ?? ''}
          onChange={(e) => set({ league: e.target.value || undefined, team: undefined })}
        >
          <option value="">전체 리그</option>
          {codeValues(enums, 'league').map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Select>
        <Select className="w-auto" value={value.team ?? ''} onChange={(e) => set({ team: e.target.value || undefined })}>
          <option value="">전체 팀</option>
          {teamsByLeague(enums, value.league).map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Select>
        <Select className="w-auto" value={value.grade ?? ''} onChange={(e) => set({ grade: e.target.value || undefined })}>
          <option value="">전체 등급</option>
          {codeValues(enums, 'grade').map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Select>
        <Input
          type="text"
          placeholder="이름 검색"
          className="w-auto flex-1 min-w-[140px]"
          value={value.q ?? ''}
          onChange={(e) => set({ q: e.target.value || undefined })}
        />
        <Button variant={open || advCount > 0 ? 'primary' : 'outline'} onClick={() => setOpen((o) => !o)}>
          {open ? '−' : '+'} 상세{advCount > 0 && ` (${advCount})`}
        </Button>
      </div>

      {open && (
        <div className="flex flex-col gap-2.5 rounded-xl border border-line bg-surface p-3">
          {/* 조건 셀렉트 + 잠재력 */}
          <div className="flex flex-wrap gap-2.5 items-end">
            <Labeled label="주날씨">
              <Select className="w-auto" value={value.weather ?? ''} onChange={(e) => set({ weather: e.target.value || undefined })}>
                <option value="">전체</option>
                {WEATHERS.map((w) => (
                  <option key={w}>{w}</option>
                ))}
              </Select>
            </Labeled>
            <Labeled label="부날씨">
              <Select
                className="w-auto"
                value={value.subWeather ?? ''}
                onChange={(e) => set({ subWeather: e.target.value || undefined })}
              >
                <option value="">전체</option>
                {WEATHERS.map((w) => (
                  <option key={w}>{w}</option>
                ))}
              </Select>
            </Labeled>
            <Labeled label="포지션 · 듀얼 포함">
              <Select className="w-auto" value={value.position ?? ''} onChange={(e) => set({ position: e.target.value || undefined })}>
                <option value="">전체</option>
                {positions.map((c) => (
                  <option key={c} value={c}>
                    {codeLabel(enums, 'position', c) || c}
                  </option>
                ))}
              </Select>
            </Labeled>
            {isPitcher ? (
              <Labeled label="레벨업 구종">
                <Select
                  className="w-auto"
                  value={value.levelupPitch ?? ''}
                  onChange={(e) => set({ levelupPitch: e.target.value || undefined })}
                >
                  <option value="">전체</option>
                  {LEVELUP_PITCH_KEYS.map((k) => (
                    <option key={k}>{k}</option>
                  ))}
                </Select>
              </Labeled>
            ) : (
              <>
                <Labeled label="레벨업 1유형">
                  <Select className="w-auto" value={value.levelup1 ?? ''} onChange={(e) => set({ levelup1: e.target.value || undefined })}>
                    <option value="">전체</option>
                    {LEVELUP1.map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </Select>
                </Labeled>
                <Labeled label="레벨업 2유형 · 듀얼 포함">
                  <Select className="w-auto" value={value.levelup2 ?? ''} onChange={(e) => set({ levelup2: e.target.value || undefined })}>
                    <option value="">전체</option>
                    {LEVELUP2.map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </Select>
                </Labeled>
              </>
            )}
            <div className="w-[220px]">
              <Labeled label="잠재력 · 베테랑/듀얼 포함">
                <PotentialInput
                  value={value.potential ?? ''}
                  onChange={(v) => set({ potential: v || undefined })}
                  options={potOptions}
                  placeholder="이름 부분일치"
                />
              </Labeled>
            </div>
          </div>

          {/* 스탯 범위 */}
          <div className="flex flex-wrap gap-2.5 items-end">
            {stats.map((s) => (
              <Labeled key={s.key} label={s.label}>
                <RangeInputs range={value.stats?.[s.key]} onPart={(p) => set({ stats: mergeRange(value.stats, s.key, p) })} />
              </Labeled>
            ))}
            {isPitcher &&
              PITCH_KEYS.map((k) => (
                <Labeled key={k} label={k === 'S' ? 'S · 포심' : `${k} 구종`}>
                  <RangeInputs range={value.pitches?.[k]} onPart={(p) => set({ pitches: mergeRange(value.pitches, k, p) })} />
                </Labeled>
              ))}
            <Button variant="ghost" disabled={advCount === 0} onClick={clearAdvanced}>
              초기화
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
