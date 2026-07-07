import type { TeamCost, TeamCtx } from '@shared/lib/stat-engine'
import { TOTAL_COST, type TeamSettings } from '@shared/config/team-stats'
import { gradeCssVar } from '@shared/config/grades'
import { Button, HoverTip } from '@shared/ui'
import { cn } from '@shared/lib/cn'

/** 빌더 상단 팀 스탯 바 — 코스트 게이지 + 활성 버프 칩 + 팀 설정 토글 */
export function TeamStatBar({
  cost,
  ts,
  ctx,
  editable,
  settingsOpen,
  onToggleSettings,
}: {
  cost: TeamCost
  ts: TeamSettings
  ctx: TeamCtx
  editable: boolean
  settingsOpen: boolean
  onToggleSettings: () => void
}) {
  const over = cost.remain < 0
  const pct = Math.min(100, (cost.total / TOTAL_COST) * 100)

  const chips: { label: string; on: boolean; warn?: boolean }[] = [
    {
      label: `HOF ${ts.legend_potential}`,
      on: ts.legend_potential !== '미적용' && ctx.hasLegend,
      warn: ts.legend_potential !== '미적용' && !ctx.hasLegend,
    },
    { label: '블테랑', on: ctx.blackVet },
    { label: '식테랑', on: ctx.sigVet },
    { label: '팀스피릿B', on: ts.team_spirit_b },
    { label: `마에스트로 ${ts.maestro}`, on: ts.maestro > 0 },
    { label: '키스톤 각성', on: ts.sig_awaken_keystone },
    { label: `치어(${ts.cheer.pos})`, on: ts.cheer.pos !== '미적용' },
    { label: `뛰는야구C ${ts.coach_run}`, on: ts.coach_run !== '미적용' },
    { label: ts.coach_bat, on: ts.coach_bat !== '해당없음' },
    { label: ts.coach_def, on: ts.coach_def !== '해당없음' },
    { label: '잠재각성B+', on: ts.chief_awaken_b },
    { label: `특이폼 ${ts.chief_form}`, on: ts.chief_form !== '미적용' },
  ]

  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2 shadow-[var(--shadow)] flex items-center gap-3 flex-wrap">
      {/* 코스트 게이지 — 호버 = 등급별 내역 + 특수포지션 감면 */}
      <HoverTip
        tip={
          <div className="flex flex-col gap-[3px] min-w-[190px]">
            <div className="text-[.66rem] font-bold uppercase tracking-[.06em] text-ink-faint">코스트 내역</div>
            {cost.lines.map((l) => (
              <div key={l.grade} className="flex items-center justify-between gap-3">
                <span>
                  <b style={{ color: `var(${gradeCssVar(l.grade)})` }}>{l.grade}</b> × {l.count}
                  <span className="text-ink-faint">
                    {' '}
                    · 장당 {l.unit}
                    {l.grade === 'SG' && cost.sgAwakenCount >= 2 && ` (풀각성 ${cost.sgAwakenCount}장 할인)`}
                    {l.grade === 'S' && ' (무료)'}
                  </span>
                </span>
                <b className="font-mono tabular-nums">{l.sum}</b>
              </div>
            ))}
            {cost.discount.count > 0 && (
              <div className="flex items-center justify-between gap-3">
                <span>
                  1루/3루/지타 감면 × {cost.discount.count}
                  <span className="block text-ink-faint text-[.66rem]">{cost.discount.names.join(' · ')}</span>
                </span>
                <b className="font-mono tabular-nums text-[color:var(--green)]">{cost.discount.sum}</b>
              </div>
            )}
            <div className="mt-[2px] border-t border-line pt-[3px] flex items-center justify-between gap-3 font-bold">
              <span>합계 · 잔여</span>
              <span className="font-mono tabular-nums">
                {cost.total} · <span className={cost.remain < 0 ? 'text-[color:var(--clay)]' : 'text-[color:var(--green)]'}>{cost.remain}</span>
              </span>
            </div>
          </div>
        }
      >
        <div className="flex items-center gap-2 min-w-[220px] cursor-help">
          <span className="text-[.64rem] font-bold uppercase tracking-[.08em] text-ink-faint">코스트</span>
          <div className="relative h-2.5 w-[110px] rounded-full bg-surface-2 border border-line overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all"
              style={{ width: `${pct}%`, background: over ? 'var(--clay)' : 'var(--green)' }}
            />
          </div>
          <span className={cn('font-mono tabular-nums text-[.82rem] font-extrabold', over && 'text-[color:var(--clay)]')}>
            {cost.total}
            <span className="text-ink-faint font-normal">/{TOTAL_COST}</span>
          </span>
          <span className={cn('text-[.72rem] tabular-nums', over ? 'text-[color:var(--clay)] font-bold' : 'text-ink-faint')}>
            잔여 {cost.remain}
          </span>
        </div>
      </HoverTip>

      {/* 활성 버프 칩 */}
      <div className="flex items-center gap-1 flex-wrap min-w-0">
        {chips
          .filter((c) => c.on || c.warn)
          .map((c) => (
            <span
              key={c.label}
              className={cn(
                'rounded-full border px-2 py-[2px] text-[.66rem] font-bold whitespace-nowrap',
                c.warn
                  ? 'border-[color:var(--clay)] text-[color:var(--clay)]'
                  : 'border-[color:var(--green)] text-[color:var(--green)] bg-[color:color-mix(in_srgb,var(--green)_8%,transparent)]',
              )}
              title={c.warn ? '라인업에 레전드(L) 타자가 없어 미발동' : undefined}
            >
              {c.warn ? `${c.label} (L 없음)` : c.label}
            </span>
          ))}
        {chips.every((c) => !c.on && !c.warn) && <span className="text-[.72rem] text-ink-faint">활성 버프 없음</span>}
      </div>

      {editable && (
        <Button variant={settingsOpen ? 'primary' : 'outline'} className="ml-auto !px-3 !py-1.5 !text-[.78rem]" onClick={onToggleSettings}>
          팀 설정 {settingsOpen ? '닫기' : '열기'}
        </Button>
      )}
    </div>
  )
}
