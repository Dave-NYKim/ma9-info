import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Batter } from '@entities/batter'
import { codeLabel, type CodeMap } from '@entities/code'
import { useBatterPotentialMap, PotentialTipBody, hasPotentialTip } from '@entities/potential'
import { WeatherIcon, WEATHER_COLOR } from '@features/weather-picker/ui/icons'
import { AddToPoolButton } from '@features/add-to-pool'
import { gradeBarBg, gradeCardBg, gradeCssVar, gradeName, GRADE_ACCENT_TEXT } from '@shared/config/grades'
import { LEAGUE_COLOR } from '@shared/config/leagues'
import { batterDualDelta } from '@shared/config/dual-position'
import { Badge, HoverTip, NameWing, StatTile, TeamWatermark, TruncateTip } from '@shared/ui'

/** 스탯 배치 = 게임 고급카드 순서 (열: 파워/컨택 · 스피드/스로잉 · 수비력/클러치) */
const STAT_CELLS: { label: string; key: keyof Batter }[] = [
  { label: '파워', key: 'power' },
  { label: '스피드', key: 'speed' },
  { label: '수비력', key: 'defense' },
  { label: '컨택트', key: 'contact' },
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

  const nav = useNavigate()
  const { data: potMap } = useBatterPotentialMap()
  const potTip = (name: string, accent?: string) => {
    const info = potMap?.[name]
    return hasPotentialTip(info) ? <PotentialTipBody info={info} accent={accent} /> : undefined
  }
  // 잠재력 뱃지 클릭 → 관리 표에서 해당 잠재력 보기 (카드 열림과 분리)
  const goPotential = (e: React.MouseEvent, name: string) => {
    e.stopPropagation()
    nav(`/potentials?kind=batter&q=${encodeURIComponent(name)}`)
  }

  const gradeColor = `var(${gradeCssVar(b.grade)})`
  const gradeTx = GRADE_ACCENT_TEXT[b.grade] ?? '#fff'
  const leagueColor = LEAGUE_COLOR[b.league_code] ?? 'var(--ink-soft)'
  const weathers = [b.weather, b.sub_weather].filter((w): w is string => !!w)

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
  // 레벨업 유형 1·2 (2유형은 듀얼 탭 기준) — 이름줄엔 두 글자 축약, 해당 스탯 타일 라벨엔 ↑
  const LEVELUP_SHORT: Record<string, string> = { 파워: '파워', 컨택트: '컨택', 스피드: '스핏', 쓰로잉: '쓰로', 수비력: '수비' }
  const levelups = [b.levelup_type1, eff.levelup2].filter((v): v is string => !!v)
  const LEVELUP_KEY: Record<string, string> = { 파워: 'power', 컨택트: 'contact', 스피드: 'speed', 쓰로잉: 'throwing', 수비력: 'defense' }
  const growthKeys = new Set(levelups.map((v) => LEVELUP_KEY[v]).filter(Boolean))
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
        background: gradeCardBg(b.grade),
        borderColor: gradeColor,
        // B = 검정 테두리 바깥 흰 헤어라인 (다크 배경에서 테두리 식별)
        ...(b.grade === 'B' ? { boxShadow: '0 0 0 1px rgba(255,255,255,.45), var(--shadow)' } : {}),
      }}
    >
      {/* 팀 로고 워터마크 (배경) */}
      <TeamWatermark code={b.team_code} />
      {/* 등급 색 바 — 한눈에 등급 식별 (시그니처는 홀로그램 그라데이션) */}
      <div className="h-1.5 w-full" style={{ background: gradeBarBg(b.grade) }} />
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
          <Badge color={gradeBarBg(b.grade)} text={gradeTx}>
            {b.grade} · {gradeName(b.grade)}
          </Badge>
        </div>
      </div>

      {/* 이름 · 투타 / 타입 */}
      <div className="mt-2 flex items-baseline gap-2">
        {/* 한 줄 고정 — 이름이 남는 폭을 다 쓰고 잘림(… + 오버 즉시 전체), 투타·유형은 절대 안 내려감.
            시그니처·블랙은 실카드처럼 이름 양옆 날개 장식 */}
        <h3 className="min-w-0 flex-1 flex items-center gap-1 text-[1.15rem] font-extrabold leading-tight">
          {(b.grade === 'SG' || b.grade === 'B') && <NameWing variant={b.grade} className="shrink-0" />}
          <TruncateTip text={b.name} className="block min-w-0 truncate" />
          {(b.grade === 'SG' || b.grade === 'B') && <NameWing variant={b.grade} flip className="shrink-0" />}
        </h3>
        <span className="shrink-0 text-[.72rem] text-ink-faint tabular-nums">
          {b.throw_hand}/{b.bat_hand}
        </span>
        {levelups.length > 0 && (
          <span className="shrink-0 text-[.72rem] font-semibold whitespace-nowrap text-ink">
            {levelups.map((v) => LEVELUP_SHORT[v] ?? v).join('/')}형
          </span>
        )}
      </div>

      {/* 팀 · 연도 / 포지션(듀얼=선택 토글) */}
      <div className="mt-0.5 flex items-center gap-2 text-[.76rem]">
        <span className="text-ink-soft">{codeLabel(codes, 'team', b.team_code) || b.team_code}</span>
        {b.year != null && (
          <span className="rounded border border-line-strong bg-surface px-1.5 py-[1px] text-[.68rem] font-bold tabular-nums text-ink">
            {b.year}
          </span>
        )}
        <span className="ml-auto flex items-center">
          {hasDual ? (
            // 세그먼트 토글 — 그룹 전체 클릭 전파 차단(카드 편집 안 열림)
            <span
              className="inline-flex overflow-hidden rounded-md border border-line-strong"
              onClick={(e) => e.stopPropagation()}
            >
              <PosTab label={posLabel(b.position)} active={active === 'base'} onSelect={() => setSlot('base')} />
              <PosTab label={posLabel(b.dual_position!)} active={active === 'dual'} hit={posDualHit} onSelect={() => setSlot('dual')} />
            </span>
          ) : (
            <span className="font-semibold">{posLabel(b.position)}</span>
          )}
        </span>
      </div>

      {/* 스탯 타일 3열 × 2행 (투수 카드와 동일 타일) — 부포지션 선택 시 보정 반영(표시 전용) */}
      <div className="mt-2.5 grid grid-cols-3 gap-1">
        {STAT_CELLS.map((s) => (
          <StatTile
            key={s.key as string}
            label={s.label}
            value={b[s.key] as number | null}
            growth={growthKeys.has(s.key as string)}
            delta={statDelta[s.key as string] ?? 0}
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
                {potentials.map((p) => (
                  <HoverTip key={p} tip={potTip(p)} tint="var(--green)">
                    <span
                      onClick={(e) => goPotential(e, p)}
                      className="truncate rounded border px-1.5 py-[1px] text-[.7rem] font-semibold cursor-pointer text-[color:var(--green)]"
                      style={
                        hit(p)
                          ? { borderColor: 'var(--gold)', color: 'var(--gold)' }
                          : {
                              borderColor: 'color-mix(in srgb, var(--green) 45%, transparent)',
                              background: 'color-mix(in srgb, var(--green) 8%, var(--surface))',
                            }
                      }
                    >
                      {p}
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
      <AddToPoolButton kind="batter" id={b.id} name={b.name} />
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
