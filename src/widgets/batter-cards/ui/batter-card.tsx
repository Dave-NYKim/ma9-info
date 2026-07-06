import { useEffect, useState } from 'react'
import type { Batter } from '@entities/batter'
import { codeLabel, type CodeMap } from '@entities/code'
import { WeatherIcon, WEATHER_COLOR } from '@features/weather-picker/ui/icons'
import { gradeCssVar, gradeName, GRADE_ACCENT_TEXT } from '@shared/config/grades'
import { LEAGUE_COLOR } from '@shared/config/leagues'
import { batterDualDelta } from '@shared/config/dual-position'
import { Badge, TeamWatermark } from '@shared/ui'

/** 스탯 배치 = 게임 고급카드 순서 (열: 파워/컨택 · 스피드/스로잉 · 수비력/클러치) */
const STAT_CELLS: { label: string; key: keyof Batter }[] = [
  { label: '파워', key: 'power' },
  { label: '스피드', key: 'speed' },
  { label: '수비력', key: 'defense' },
  { label: '컨택', key: 'contact' },
  { label: '스로잉', key: 'throwing' },
  { label: '클러치', key: 'clutch' },
]

export function BatterCard({
  b,
  codes,
  potentialQuery,
  positionQuery,
  onClick,
}: {
  b: Batter
  codes: CodeMap | undefined
  potentialQuery?: string
  positionQuery?: string
  onClick: () => void
}) {
  const hasDual = !!b.dual_position

  // 검색 매칭이 듀얼 쪽에서만 걸린 카드는 듀얼 탭으로 자동 전환(왜 걸렸는지 보이게)
  const pq = potentialQuery?.trim() ?? ''
  const hit = (x: string | null | undefined) => !!pq && !!x && x.includes(pq)
  const potDualOnly =
    hasDual &&
    ![b.potential1, b.potential2, b.potential3, b.sub_potential].some(hit) &&
    [b.dual_potential1, b.dual_potential2, b.dual_potential3, b.dual_sub_potential].some(hit)
  const posDualHit = hasDual && !!positionQuery && b.dual_position === positionQuery
  const dualOnlyMatch = potDualOnly || (posDualHit && b.position !== positionQuery)

  const [slot, setSlot] = useState<'base' | 'dual'>(dualOnlyMatch ? 'dual' : 'base')
  useEffect(() => {
    if (dualOnlyMatch) setSlot('dual')
  }, [dualOnlyMatch])
  const active = hasDual ? slot : 'base'

  const gradeColor = `var(${gradeCssVar(b.grade)})`
  const gradeTx = GRADE_ACCENT_TEXT[b.grade] ?? '#fff'
  const leagueColor = LEAGUE_COLOR[b.league_code] ?? 'var(--ink-soft)'
  const weathers = [b.weather, b.sub_weather].filter((w): w is string => !!w && w !== '무속')

  // 듀얼로 갈리는 값 = 레벨업유형2 · 잠재력(4슬롯). 듀얼 필드 null 이면 기본과 동일(폴백).
  const eff =
    active === 'dual'
      ? {
          levelup2: b.dual_levelup_type2 ?? b.levelup_type2,
          potentials: [b.dual_potential1 ?? b.potential1, b.dual_potential2 ?? b.potential2, b.dual_potential3 ?? b.potential3],
          sub: b.dual_sub_potential ?? b.sub_potential,
        }
      : {
          levelup2: b.levelup_type2,
          potentials: [b.potential1, b.potential2, b.potential3],
          sub: b.sub_potential,
        }
  const type = [b.levelup_type1, eff.levelup2].filter(Boolean).join(',')
  const potentials = eff.potentials.filter((p): p is string => !!p)

  const posLabel = (code: string) => codeLabel(codes, 'position', code) || code

  // 부포지션 탭을 볼 때만 스탯 보정(표시 전용). 저장값은 그대로.
  const statDelta: Record<string, number> =
    active === 'dual' && b.dual_position ? batterDualDelta(b.position, b.dual_position) : {}

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
      className="relative text-left rounded-xl border-2 overflow-hidden shadow-[var(--shadow)] transition hover:brightness-[1.02] hover:-translate-y-px cursor-pointer focus-visible:outline-2 focus-visible:outline-[color:var(--accent)]"
      style={{
        background: `color-mix(in srgb, ${gradeColor} 8%, var(--surface))`,
        borderColor: gradeColor,
      }}
    >
      {/* 팀 로고 워터마크 (배경) */}
      <TeamWatermark code={b.team_code} />
      {/* 등급 색 바 — 한눈에 등급 식별 */}
      <div className="h-1.5 w-full" style={{ background: gradeColor }} />
      <div className="relative z-10 p-3">
      {/* 헤더: 리그·특이폼 / 날씨·등급 */}
      <div className="flex items-center gap-1.5">
        <Badge color={leagueColor}>{codeLabel(codes, 'league', b.league_code) || b.league_code}</Badge>
        {b.special_form && <Badge color="var(--clay)">특이폼</Badge>}
        <div className="ml-auto flex items-center gap-1.5">
          {weathers.map((w, i) => (
            <span key={i} style={{ color: WEATHER_COLOR[w] }} title={w}>
              <WeatherIcon name={w} />
            </span>
          ))}
          <Badge color={gradeColor} text={gradeTx}>
            {b.grade} · {gradeName(b.grade)}
          </Badge>
        </div>
      </div>

      {/* 이름 · 투타 / 타입 */}
      <div className="mt-2 flex items-baseline gap-2">
        <h3 className="text-[1.05rem] font-extrabold leading-tight">{b.name}</h3>
        <span className="text-[.72rem] text-ink-faint tabular-nums">
          {b.throw_hand}/{b.bat_hand}
        </span>
        {type && <span className="ml-auto text-[.72rem] font-semibold text-ink-soft">{type}형</span>}
      </div>

      {/* 팀 / 포지션(듀얼=선택 토글) · 연도 */}
      <div className="mt-0.5 flex items-center gap-2 text-[.76rem]">
        <span className="text-ink-soft">{codeLabel(codes, 'team', b.team_code) || b.team_code}</span>
        <span className="ml-auto flex items-center gap-1">
          {hasDual ? (
            <>
              <PosTab label={posLabel(b.position)} active={active === 'base'} onSelect={() => setSlot('base')} />
              <span className="text-ink-faint">/</span>
              <PosTab label={posLabel(b.dual_position!)} active={active === 'dual'} hit={posDualHit} onSelect={() => setSlot('dual')} />
            </>
          ) : (
            <span className="font-semibold">{posLabel(b.position)}</span>
          )}
        </span>
        {b.year != null && <span className="text-ink-faint tabular-nums">{b.year}</span>}
      </div>

      {/* 스탯 3열 × 2행 — 부포지션 선택 시 보정 반영(표시 전용) */}
      <div className="mt-2.5 grid grid-cols-3 gap-x-3 gap-y-1.5 rounded-lg bg-surface-2 px-2.5 py-2">
        {STAT_CELLS.map((s) => {
          const raw = b[s.key] as number | null
          const d = statDelta[s.key as string] ?? 0
          const shown = raw == null ? null : Math.max(1, Math.min(100, raw + d))
          const dc = d > 0 ? 'var(--green)' : 'var(--g-r)'
          return (
            <div key={s.key as string} className="flex items-center justify-between">
              <span className="text-[.7rem] text-ink-faint">{s.label}</span>
              <span className="flex items-baseline gap-0.5">
                <span className="font-mono font-bold tabular-nums text-[.82rem]" style={d ? { color: dc } : undefined}>
                  {shown ?? '—'}
                </span>
                {d !== 0 && (
                  <span className="text-[.58rem] font-bold tabular-nums" style={{ color: dc }}>
                    {d > 0 ? `+${d}` : d}
                  </span>
                )}
              </span>
            </div>
          )
        })}
      </div>

      {/* 잠재력 / 베테랑 (선택 포지션 기준) */}
      {(potentials.length > 0 || eff.sub) && (
        <div className="mt-2 flex flex-col gap-1">
          {potentials.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span
                className="text-[.64rem] font-bold uppercase tracking-[.08em] min-w-[42px] shrink-0"
                style={{ color: active === 'dual' ? 'var(--gold)' : 'var(--ink-faint)' }}
              >
                {active === 'dual' ? '듀얼 잠재력' : '잠재력'}
              </span>
              <div className="flex flex-wrap gap-1">
                {potentials.map((p) => (
                  <span
                    key={p}
                    className="rounded border border-line-strong bg-surface px-1.5 py-[1px] text-[.7rem] text-ink-soft"
                    style={hit(p) ? { borderColor: 'var(--gold)', color: 'var(--gold)', fontWeight: 700 } : undefined}
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}
          {eff.sub && (
            <div className="flex items-center gap-1.5">
              <span
                className="text-[.64rem] font-bold uppercase tracking-[.08em] min-w-[42px] shrink-0"
                style={{ color: active === 'dual' ? 'var(--gold)' : 'var(--ink-faint)' }}
              >
                {active === 'dual' ? '듀얼 베테랑' : '베테랑'}
              </span>
              <span
                className="rounded border px-1.5 py-[1px] text-[.7rem] font-semibold text-[color:var(--purple)]"
                style={
                  hit(eff.sub)
                    ? { borderColor: 'var(--gold)', color: 'var(--gold)' }
                    : { borderColor: 'color-mix(in srgb, var(--purple) 45%, transparent)' }
                }
              >
                {eff.sub}
              </span>
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  )
}

/** 듀얼 포지션 선택 탭 (카드 열림과 분리 — 클릭 전파 차단). hit = 포지션 검색 매칭 강조 */
function PosTab({ label, active, hit, onSelect }: { label: string; active: boolean; hit?: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
      className="font-semibold cursor-pointer transition"
      style={{
        ...(active
          ? { color: 'var(--gold)', borderBottom: '2px solid var(--gold)' }
          : { color: 'var(--ink-faint)', borderBottom: '2px solid transparent' }),
        ...(hit
          ? { color: 'var(--gold)', background: 'color-mix(in srgb, var(--gold) 16%, transparent)', borderRadius: 4, padding: '0 4px' }
          : {}),
      }}
    >
      {label}
    </button>
  )
}
