import { useState } from 'react'
import {
  CHEER_POS,
  CHIEF_FORM,
  COACH_BAT,
  COACH_DEF,
  COACH_RUN,
  LEGEND_POTENTIAL_OPTIONS,
  STAT5,
  STAT5_LABEL,
  type Stat5,
  type Stats5,
  type TeamSettings,
} from '@shared/config/team-stats'
import type { TeamCtx } from '@shared/lib/stat-engine'
import { Labeled, Panel, Select, Toggle } from '@shared/ui'

/** 팀 전역 설정 폼 — 변경 즉시 저장(셀렉트·토글), 숫자칸은 blur 커밋.
 *  HOF·팀 베테랑·키스톤은 "해당 카드에서" 지정하는 게 원칙 — 여기선 상태 표시 + 게이트 안내만. */
export function TeamSettingsPanel({
  ts,
  ctx,
  veteranNames,
  onPatch,
}: {
  ts: TeamSettings
  ctx: TeamCtx
  /** 팀 베테랑 지정 현황 표시용 */
  veteranNames: { black: string | null; sig: string | null }
  onPatch: (patch: Partial<TeamSettings>) => void
}) {
  return (
    <Panel title="팀 설정 (전 타자 적용)" className="min-w-0">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {/* 덱 보너스 */}
        <div className="lg:col-span-3">
          <StatsRow
            label="덱 보너스 + 스태프 합계 (인게임 팀 정보의 증가 스탯량)"
            value={ts.deck_bonus}
            onCommit={(v) => onPatch({ deck_bonus: v })}
          />
        </div>

        {/* 팀 버프 */}
        <Labeled label={`레전드 잠재 (HOF) ${ctx.hasLegend ? '' : '— 라인업에 L 타자 없음(미발동)'}`}>
          <Select value={ts.legend_potential} onChange={(e) => onPatch({ legend_potential: e.target.value as TeamSettings['legend_potential'] })}>
            {LEGEND_POTENTIAL_OPTIONS.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </Select>
        </Labeled>
        <Labeled label="팀스피릿 B (파워·컨택 +1)">
          <Toggle checked={ts.team_spirit_b} onChange={(v) => onPatch({ team_spirit_b: v })} label={ts.team_spirit_b ? '적용' : '미적용'} />
        </Labeled>
        <Labeled label="마에스트로 (외야수 쓰로 +3×n)">
          <Select value={String(ts.maestro)} onChange={(e) => onPatch({ maestro: Number(e.target.value) })}>
            {[0, 1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n === 0 ? '해당없음' : `${n}적용 (+${n * 3})`}
              </option>
            ))}
          </Select>
        </Labeled>
        <Labeled label="시그 각성 — 키스톤(2B/SS 의 SG 수비 +5)">
          <Toggle
            checked={ts.sig_awaken_keystone}
            onChange={(v) => onPatch({ sig_awaken_keystone: v })}
            label={ts.sig_awaken_keystone ? '적용' : '해당없음'}
          />
        </Labeled>
        <Labeled label="팀 베테랑 현황 (지정은 블랙/시그 카드의 육성에서)">
          <div className="text-[.8rem] py-[7px] text-ink-soft">
            블랙: <b className="text-ink">{veteranNames.black ?? '미지정'}</b> · 시그:{' '}
            <b className="text-ink">{veteranNames.sig ?? '미지정'}</b>
          </div>
        </Labeled>

        {/* 스태프 */}
        <Labeled label="감독 — 뛰는야구C (기본 스핏 71~80 만 +2/+3)">
          <Select value={ts.coach_run} onChange={(e) => onPatch({ coach_run: e.target.value as TeamSettings['coach_run'] })}>
            {COACH_RUN.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </Select>
        </Labeled>
        <Labeled label="타격 코치">
          <Select value={ts.coach_bat} onChange={(e) => onPatch({ coach_bat: e.target.value as TeamSettings['coach_bat'] })}>
            {COACH_BAT.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </Select>
        </Labeled>
        <Labeled label="수비 코치">
          <Select value={ts.coach_def} onChange={(e) => onPatch({ coach_def: e.target.value as TeamSettings['coach_def'] })}>
            {COACH_DEF.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </Select>
        </Labeled>
        <Labeled label="수석 — 잠재력각성B+ (스페셜 카드 파워·컨택 +1)">
          <Toggle checked={ts.chief_awaken_b} onChange={(v) => onPatch({ chief_awaken_b: v })} label={ts.chief_awaken_b ? '적용' : '미적용'} />
        </Labeled>
        <Labeled label="수석 — 특이폼공략">
          <Select value={ts.chief_form} onChange={(e) => onPatch({ chief_form: e.target.value as TeamSettings['chief_form'] })}>
            {CHIEF_FORM.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </Select>
        </Labeled>

        {/* 치어리더 */}
        <div className="lg:col-span-3 grid gap-2 sm:grid-cols-[180px_minmax(0,1fr)] items-end">
          <Labeled label="치어리더 포지션">
            <Select
              value={ts.cheer.pos}
              onChange={(e) => onPatch({ cheer: { ...ts.cheer, pos: e.target.value as TeamSettings['cheer']['pos'] } })}
            >
              {CHEER_POS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </Select>
          </Labeled>
          <StatsRow label="치어리더 스탯" value={ts.cheer.stats} onCommit={(v) => onPatch({ cheer: { ...ts.cheer, stats: v } })} />
        </div>
      </div>
    </Panel>
  )
}

/** 5스탯 숫자 입력 한 줄 — blur/Enter 커밋 */
function StatsRow({ label, value, onCommit }: { label: string; value: Stats5; onCommit: (v: Stats5) => void }) {
  const [draft, setDraft] = useState<Record<Stat5, string> | null>(null)
  const shown = (k: Stat5) => (draft ? draft[k] : String(value[k] ?? 0))
  const commit = () => {
    if (!draft) return
    const next = { ...value }
    for (const k of STAT5) next[k] = Number(draft[k]) || 0
    setDraft(null)
    onCommit(next)
  }
  return (
    <label className="flex flex-col gap-1 min-w-0">
      <span className="text-[.61rem] font-bold uppercase tracking-[.03em] text-ink-faint">{label}</span>
      <div className="grid grid-cols-5 gap-1">
        {STAT5.map((k) => (
          <div key={k} className="flex flex-col gap-[2px]">
            <span className="text-[.58rem] text-ink-faint text-center">{STAT5_LABEL[k]}</span>
            <input
              type="number"
              className="w-full rounded-lg border border-line-strong bg-surface-2 text-ink px-1 py-[5px] text-[.8rem] text-center font-mono tabular-nums outline-none focus:border-[color:var(--accent)]"
              value={shown(k)}
              onChange={(e) =>
                setDraft({ ...(draft ?? (Object.fromEntries(STAT5.map((s) => [s, String(value[s] ?? 0)])) as Record<Stat5, string>)), [k]: e.target.value })
              }
              onBlur={commit}
              onKeyDown={(e) => e.key === 'Enter' && commit()}
            />
          </div>
        ))}
      </div>
    </label>
  )
}
