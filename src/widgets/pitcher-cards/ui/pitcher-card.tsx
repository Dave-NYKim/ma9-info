import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { PitcherWithPitches } from '@entities/pitcher'
import { codeLabel, type CodeMap } from '@entities/code'
import { usePitcherPotentialMap, PotentialTipBody, hasPotentialTip } from '@entities/potential'
import { WeatherIcon, WEATHER_COLOR } from '@features/weather-picker/ui/icons'
import { gradeBarBg, gradeCardBg, gradeCssVar, gradeName, GRADE_ACCENT_TEXT } from '@shared/config/grades'
import { LEAGUE_COLOR } from '@shared/config/leagues'
import { PITCH_KEYS } from '@shared/config/domain'
import { pitcherDualDelta } from '@shared/config/dual-position'
import { Badge, HoverTip, NameWing, StatTile, TeamWatermark, TruncateTip } from '@shared/ui'

/** 구종 표시명 = 특이구종이면 고유명, 아니면 계열명 */
const pitchLabel = (p: { pitch_type: string; is_special: boolean; special_name: string | null }) =>
  p.is_special ? p.special_name || p.pitch_type : p.pitch_type


export function PitcherCard({
  p,
  codes,
  potentialQuery,
  positionQuery,
  onClick,
}: {
  p: PitcherWithPitches
  codes: CodeMap | undefined
  potentialQuery?: string
  positionQuery?: string
  onClick: () => void
}) {
  const hasDual = !!p.dual_position

  // 검색 매칭이 듀얼 쪽에서만 걸린 카드는 듀얼 탭으로 자동 전환(왜 걸렸는지 보이게)
  const pq = potentialQuery?.trim() ?? ''
  const hit = (x: string | null | undefined) => !!pq && !!x && x.includes(pq)
  const potDualOnly =
    hasDual &&
    ![p.potential1, p.potential2, p.potential3, p.sub_potential].some(hit) &&
    [p.dual_potential1, p.dual_potential2, p.dual_potential3, p.dual_sub_potential].some(hit)
  const posDualHit = hasDual && !!positionQuery && p.dual_position === positionQuery
  const dualOnlyMatch = potDualOnly || (posDualHit && p.position !== positionQuery)

  const [slot, setSlot] = useState<'base' | 'dual'>(dualOnlyMatch ? 'dual' : 'base')
  useEffect(() => {
    if (dualOnlyMatch) setSlot('dual')
  }, [dualOnlyMatch])
  const active = hasDual ? slot : 'base'

  const nav = useNavigate()
  const { data: potMap } = usePitcherPotentialMap()
  const potTip = (name: string, accent?: string) => {
    const info = potMap?.[name]
    return hasPotentialTip(info) ? <PotentialTipBody info={info} accent={accent} /> : undefined
  }
  // 잠재력 뱃지 클릭 → 관리 표에서 해당 잠재력 보기 (카드 열림과 분리)
  const goPotential = (e: React.MouseEvent, name: string) => {
    e.stopPropagation()
    nav(`/potentials?kind=pitcher&q=${encodeURIComponent(name)}`)
  }

  const gradeColor = `var(${gradeCssVar(p.grade)})`
  const gradeTx = GRADE_ACCENT_TEXT[p.grade] ?? '#fff'
  const leagueColor = LEAGUE_COLOR[p.league_code] ?? 'var(--ink-soft)'
  const weathers = [p.weather, p.sub_weather].filter((w): w is string => !!w)

  // 투수는 레벨업(성장구종) 공통 · 듀얼로 갈리는 건 잠재력(4슬롯)뿐. null 이면 기본과 동일(폴백).
  const eff =
    active === 'dual'
      ? {
          potentials: [p.dual_potential1 ?? p.potential1, p.dual_potential2 ?? p.potential2, p.dual_potential3 ?? p.potential3],
          sub: p.dual_sub_potential ?? p.sub_potential,
        }
      : { potentials: [p.potential1, p.potential2, p.potential3], sub: p.sub_potential }
  const potentials = eff.potentials.filter((x): x is string => !!x)

  // 구종 6개: 키 순서(S,W,A,D,F,Z,X,C)로 정렬
  const pitches = [...(p.pitcher_pitches ?? [])].sort(
    (a, b) => PITCH_KEYS.indexOf(a.key as (typeof PITCH_KEYS)[number]) - PITCH_KEYS.indexOf(b.key as (typeof PITCH_KEYS)[number]),
  )

  const posLabel = (code: string) => codeLabel(codes, 'position', code) || code

  // 부포지션(선발↔계투/마무리) 탭을 볼 때만 체력·포심 보정(표시 전용). 저장값은 그대로.
  const pDelta =
    active === 'dual' && p.dual_position ? pitcherDualDelta(p.position, p.dual_position) : { stamina: 0, fastball: 0 }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
      className="relative text-left rounded-xl border-2 overflow-hidden shadow-[var(--shadow)] transition hover:brightness-[1.02] hover:-translate-y-px cursor-pointer focus-visible:outline-2 focus-visible:outline-[color:var(--accent)]"
      style={{
        background: gradeCardBg(p.grade),
        borderColor: gradeColor,
      }}
    >
      {/* 팀 로고 워터마크 (배경) */}
      <TeamWatermark code={p.team_code} />
      {/* 등급 색 바 — 한눈에 등급 식별 (시그니처는 홀로그램 그라데이션) */}
      <div className="h-1.5 w-full" style={{ background: gradeBarBg(p.grade) }} />
      <div className="relative z-10 p-3">
        {/* 헤더: 리그·특이폼 / 날씨·등급 */}
        <div className="flex items-center gap-1.5">
          <Badge color={leagueColor}>{codeLabel(codes, 'league', p.league_code) || p.league_code}</Badge>
          {p.special_form && <Badge color="var(--clay)">특이폼</Badge>}
          <div className="ml-auto flex items-center gap-1.5">
            {weathers.map((w, i) => (
              <span key={i} style={{ color: WEATHER_COLOR[w] }} title={w}>
                <WeatherIcon name={w} />
              </span>
            ))}
            <Badge color={gradeBarBg(p.grade)} text={gradeTx}>
              {p.grade} · {gradeName(p.grade)}
            </Badge>
          </div>
        </div>

        {/* 이름 · 투타 / 성장구종 */}
        <div className="mt-2 flex items-baseline gap-2">
          {/* 한 줄 고정 — 이름이 남는 폭을 다 쓰고 잘림(… + 오버 즉시 전체), 투타·유형은 절대 안 내려감.
              시그니처·블랙은 실카드처럼 이름 양옆 날개 장식 */}
          <h3 className="min-w-0 flex-1 flex items-center gap-1 text-[1.15rem] font-extrabold leading-tight">
            {(p.grade === 'SG' || p.grade === 'B') && <NameWing variant={p.grade} className="shrink-0" />}
            <TruncateTip text={p.name} className="block min-w-0 truncate" />
            {(p.grade === 'SG' || p.grade === 'B') && <NameWing variant={p.grade} flip className="shrink-0" />}
          </h3>
          <span className="shrink-0 text-[.72rem] text-ink-faint tabular-nums">
            {p.throw_hand}/{p.bat_hand}
          </span>
          {p.levelup_pitch && (
            <span className="shrink-0 text-[.72rem] font-semibold whitespace-nowrap text-ink">{p.levelup_pitch}형</span>
          )}
        </div>

        {/* 팀 · 연도 / 포지션(듀얼=선택 토글) */}
        <div className="mt-0.5 flex items-center gap-2 text-[.76rem]">
          <span className="text-ink-soft">{codeLabel(codes, 'team', p.team_code) || p.team_code}</span>
          {p.year != null && (
            <span className="rounded border border-line-strong bg-surface px-1.5 py-[1px] text-[.68rem] font-bold tabular-nums text-ink">
              {p.year}
            </span>
          )}
          <span className="ml-auto flex items-center">
            {hasDual ? (
              // 세그먼트 토글 — 그룹 전체 클릭 전파 차단(카드 편집 안 열림)
              <span
                className="inline-flex overflow-hidden rounded-md border border-line-strong"
                onClick={(e) => e.stopPropagation()}
              >
                <PosTab label={posLabel(p.position)} active={active === 'base'} onSelect={() => setSlot('base')} />
                <PosTab label={posLabel(p.dual_position!)} active={active === 'dual'} hit={posDualHit} onSelect={() => setSlot('dual')} />
              </span>
            ) : (
              <span className="font-semibold">{posLabel(p.position)}</span>
            )}
          </span>
        </div>

        {/* 스탯: 체력·제구 + 구종 6 (4열 × 2행) — 부포지션 선택 시 체력·포심 보정(표시 전용) */}
        <div className="mt-2.5 grid grid-cols-4 gap-1">
          <StatTile label="체력" value={p.stamina} delta={pDelta.stamina} />
          {pitches.slice(0, 3).map((pt) => (
            <StatTile
              key={pt.key}
              label={pitchLabel(pt)}
              value={pt.value}
              growth={pt.key === p.levelup_pitch}
              special={pt.is_special}
              delta={pt.key === 'S' ? pDelta.fastball : 0}
            />
          ))}
          <StatTile label="제구" value={p.control} />
          {pitches.slice(3, 6).map((pt) => (
            <StatTile
              key={pt.key}
              label={pitchLabel(pt)}
              value={pt.value}
              growth={pt.key === p.levelup_pitch}
              special={pt.is_special}
              delta={pt.key === 'S' ? pDelta.fastball : 0}
            />
          ))}
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
                {/* 한 줄 고정 — 넘치면 각 뱃지가 줄어들며 … 처리 */}
                <div className="flex min-w-0 gap-1 overflow-hidden">
                  {potentials.map((x) => (
                    <HoverTip key={x} tip={potTip(x)} tint="var(--green)">
                      <span
                        onClick={(e) => goPotential(e, x)}
                        className="truncate rounded border px-1.5 py-[1px] text-[.7rem] font-semibold cursor-pointer text-[color:var(--green)]"
                        style={
                          hit(x)
                            ? { borderColor: 'var(--gold)', color: 'var(--gold)' }
                            : {
                                borderColor: 'color-mix(in srgb, var(--green) 45%, transparent)',
                                background: 'color-mix(in srgb, var(--green) 8%, var(--surface))',
                              }
                        }
                      >
                        {x}
                      </span>
                    </HoverTip>
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
                <HoverTip tip={potTip(eff.sub, 'var(--purple)')} tint="var(--purple)">
                  <span
                    onClick={(e) => goPotential(e, eff.sub!)}
                    className="rounded border px-1.5 py-[1px] text-[.7rem] font-semibold cursor-pointer text-[color:var(--purple)]"
                    style={
                      hit(eff.sub)
                        ? { borderColor: 'var(--gold)', color: 'var(--gold)' }
                        : { borderColor: 'color-mix(in srgb, var(--purple) 45%, transparent)' }
                    }
                  >
                    {eff.sub}
                  </span>
                </HoverTip>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/** 듀얼 포지션 세그먼트 탭 — 활성=금색 채움, 클릭 범위 넓게(패딩). hit = 포지션 검색 매칭 강조 */
function PosTab({ label, active, hit, onSelect }: { label: string; active: boolean; hit?: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
      className="px-2.5 py-1 text-[.72rem] font-semibold cursor-pointer transition whitespace-nowrap"
      style={{
        background: active
          ? 'var(--gold)'
          : hit
            ? 'color-mix(in srgb, var(--gold) 16%, transparent)'
            : 'var(--surface)',
        color: active ? 'var(--surface)' : hit ? 'var(--gold)' : 'var(--ink-faint)',
      }}
    >
      {label}
    </button>
  )
}
