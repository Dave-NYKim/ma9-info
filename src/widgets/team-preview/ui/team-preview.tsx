import { STAT5, STAT5_LABEL, TOTAL_COST, type Stats5, type TeamSettings } from '@shared/config/team-stats'
import type { TeamCost, TeamCtx } from '@shared/lib/stat-engine'
import { Panel } from '@shared/ui'
import { cn } from '@shared/lib/cn'

const stats5Text = (v: Stats5) =>
  STAT5.filter((k) => (v[k] ?? 0) !== 0)
    .map((k) => `${STAT5_LABEL[k]}${v[k] > 0 ? '+' : ''}${v[k]}`)
    .join(' · ')

/** 팀 미리보기 — 설정된 팀 정보만 골라 읽기 요약 (타순 아래, 남는 높이 채움) */
export function TeamPreview({
  ts,
  ctx,
  cost,
  veteranNames,
  className,
}: {
  ts: TeamSettings
  ctx: TeamCtx
  cost: TeamCost
  veteranNames: { black: string | null; sig: string | null }
  className?: string
}) {
  const rows: { label: string; value: React.ReactNode; warn?: boolean }[] = []
  const deck = stats5Text(ts.deck_bonus)
  if (deck) rows.push({ label: '덱 보너스', value: deck })
  if (ts.legend_potential !== '미적용')
    rows.push({
      label: '레전드 잠재 (HOF)',
      value: ctx.hasLegend ? ts.legend_potential : `${ts.legend_potential} — L 카드 없음(미발동)`,
      warn: !ctx.hasLegend,
    })
  if (veteranNames.black || veteranNames.sig)
    rows.push({
      label: '팀 베테랑',
      value: [veteranNames.black && `블랙 ${veteranNames.black}`, veteranNames.sig && `시그 ${veteranNames.sig}`]
        .filter(Boolean)
        .join(' · '),
    })
  if (ts.team_spirit_b) rows.push({ label: '팀스피릿 B', value: '파워·컨택 +1' })
  if (ts.maestro > 0) rows.push({ label: '마에스트로', value: `${ts.maestro}적용 — 외야수 쓰로 +${ts.maestro * 3}` })
  if (ts.sig_awaken_keystone) rows.push({ label: '시그 각성', value: '키스톤 — 2B/SS 의 SG 수비 +5' })
  if (ts.cheer.pos !== '미적용') rows.push({ label: '치어리더', value: `${ts.cheer.pos} · ${stats5Text(ts.cheer.stats) || '스탯 미입력'}` })
  if (ts.coach_run !== '미적용') rows.push({ label: '감독 뛰는야구C', value: `${ts.coach_run} — 기본 스핏 71~80 +${ts.coach_run === '일반' ? 2 : 3}` })
  if (ts.coach_bat !== '해당없음') rows.push({ label: '타격 코치', value: ts.coach_bat })
  if (ts.coach_def !== '해당없음') rows.push({ label: '수비 코치', value: ts.coach_def })
  if (ts.chief_awaken_b) rows.push({ label: '수석 잠재력각성B+', value: '스페셜 파워·컨택 +1' })
  if (ts.chief_form !== '미적용') rows.push({ label: '수석 특이폼공략', value: ts.chief_form })

  return (
    <Panel
      title="팀 미리보기"
      right={
        <span className="text-[.72rem] font-bold tabular-nums text-ink-soft">
          코스트 {cost.total}
          <span className="text-ink-faint font-normal">/{TOTAL_COST}</span>
          <span className={cn('ml-1.5', cost.remain < 0 ? 'text-[color:var(--clay)]' : 'text-ink-faint')}>잔여 {cost.remain}</span>
        </span>
      }
      className={cn('overflow-auto', className)}
    >
      {rows.length === 0 ? (
        <p className="m-0 text-[.8rem] text-ink-faint">설정된 팀 버프·스태프가 없습니다 — 「팀 설정 열기」에서 구성하세요.</p>
      ) : (
        <div className="flex flex-col gap-1">
          {rows.map((r) => (
            <div key={r.label} className="flex items-baseline gap-2 rounded-lg bg-surface px-2.5 py-[6px] border border-line">
              <span className="shrink-0 text-[.66rem] font-bold uppercase tracking-[.04em] text-ink-faint w-[118px]">{r.label}</span>
              <span className={cn('min-w-0 text-[.8rem] font-semibold', r.warn ? 'text-[color:var(--clay)]' : 'text-ink')}>
                {r.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </Panel>
  )
}
