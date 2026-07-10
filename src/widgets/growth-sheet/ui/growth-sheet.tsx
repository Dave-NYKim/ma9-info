import { useState } from 'react'
import type { Batter } from '@entities/batter'
import {
  canTrainPosition,
  EQUIP_GRADES,
  EQUIP_KINDS,
  EQUIP_STAT,
  LEGEND_POTENTIAL_OPTIONS,
  POSITION_TYPE2,
  SPECIAL_TRAIN,
  STAT5,
  STAT5_LABEL,
  TRAININGS,
  type Growth,
  type Stat5,
  type Stats5,
  type TeamSettings,
} from '@shared/config/team-stats'
import { COST_DISCOUNT_POSITIONS } from '@shared/config/team-stats'
import { gradeBarBg, gradeName, GRADE_ACCENT_TEXT } from '@shared/config/grades'
import { useBatterPotentialMap } from '@entities/potential'
import { Badge, Button, Labeled, Panel, Select, Toggle } from '@shared/ui'
import { cn } from '@shared/lib/cn'

/** 카드 육성 시트 — 팀 × 선수 단위(라인업 등록 여부 무관). 등급 조건부 노출.
 *  L 카드 = HOF 선택(팀 설정에 저장) · B/SG = 팀 베테랑 지정 · S = 강점/약점 + 각성/베테랑 없음. */
export function GrowthSheet({
  batter: b,
  lineup,
  growth,
  teamSettings,
  onSave,
  onClose,
}: {
  batter: Batter
  /** 라인업에 있으면 타순·배치 포지션 */
  lineup: { order: number; position: string } | null
  growth: Growth
  teamSettings: TeamSettings
  /** legendPotential = L 카드에서 바꾼 HOF 옵션(팀 설정 반영), 아니면 undefined */
  onSave: (g: Growth, legendPotential?: TeamSettings['legend_potential']) => void
  onClose: () => void
}) {
  const [g, setG] = useState<Growth>(growth)
  const [legend, setLegend] = useState(teamSettings.legend_potential)
  const { data: potMap } = useBatterPotentialMap()
  // 포지션 선택(그냥 듀포, 기본 주) — 고정과 별개. 고정은 아래 체크박스로 이 선택 포지션을 훈련.
  const [selPos, setSelPos] = useState<string>(growth.fixed_position ?? lineup?.position ?? b.position)

  const grade = b.grade
  const canAwaken = grade !== 'S'
  const canVeteran = grade !== 'S'
  const canTeamVeteran = grade === 'B' || grade === 'SG'
  const isSpecial = grade === 'S'
  const isLegend = grade === 'L'

  const set = (patch: Partial<Growth>) => setG((prev) => ({ ...prev, ...patch }))

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/75 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-[680px] my-6" onClick={(e) => e.stopPropagation()}>
        <Panel
          title={
            <span className="normal-case tracking-normal text-[.9rem] flex items-center gap-2">
              <Badge color={gradeBarBg(grade)} text={GRADE_ACCENT_TEXT[grade] ?? '#fff'}>
                {grade} · {gradeName(grade)}
              </Badge>
              <b className="text-ink text-[1rem]">{b.name}</b>
              <span className="text-ink-faint text-[.78rem]">
                {lineup ? `${lineup.order}번 · ${lineup.position}` : '라인업 미등록'}
              </span>
            </span>
          }
          right={
            <div className="flex gap-2">
              <Button variant="ghost" className="!px-3 !py-1" onClick={onClose}>
                취소
              </Button>
              <Button variant="primary" className="!px-3 !py-1" onClick={() => onSave(g, isLegend && legend !== teamSettings.legend_potential ? legend : undefined)}>
                저장
              </Button>
            </div>
          }
        >
          <div className="flex flex-col gap-3">
            {/* 포지션: 그냥 선택(주/부, 듀포) + 고정(훈련)은 별도 체크. 고정하면 다른 포지션 비활성 */}
            {(() => {
              const isFixed = g.fixed_position != null
              const canFix = canTrainPosition(grade, b.dual_position) // 듀얼·非R/S만 고정 가능
              const opts: { key: string; role: string }[] = [
                { key: b.position, role: '주' },
                ...(b.dual_position ? [{ key: b.dual_position, role: '부' }] : []),
              ]
              const selectToSub = selPos === b.dual_position
              const type2 = selectToSub ? b.dual_levelup_type2 ?? POSITION_TYPE2[selPos] : b.levelup_type2 ?? POSITION_TYPE2[selPos]
              const corner = COST_DISCOUNT_POSITIONS.has(selPos)
              const pickPos = (key: string) => {
                if (isFixed) return // 고정 상태면 잠금(체크 해제 후 변경)
                setSelPos(key)
              }
              return (
                <Labeled label="포지션 (그냥 듀포는 선택만 · 고정=훈련은 아래 체크)">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* 주/부 선택 (그냥 듀포) */}
                      <div className="flex gap-1">
                        {opts.map((o) => (
                          <button
                            key={o.key}
                            type="button"
                            onClick={() => pickPos(o.key)}
                            disabled={isFixed && selPos !== o.key}
                            className={cn(
                              'px-2.5 py-[6px] rounded-lg border text-[.8rem] font-bold transition',
                              selPos === o.key ? 'bg-ink text-[color:var(--surface)] border-ink' : 'bg-surface-2 text-ink-soft border-line-strong',
                              isFixed && selPos !== o.key ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:border-ink',
                            )}
                          >
                            {o.role} {o.key}
                          </button>
                        ))}
                      </div>
                      {/* 고정(훈련) 체크 — 듀얼·非R/S만 */}
                      {canFix && (
                        <label className="flex items-center gap-1.5 text-[.82rem] font-bold cursor-pointer ml-1">
                          <input
                            type="checkbox"
                            checked={isFixed}
                            onChange={(e) => set({ fixed_position: e.target.checked ? selPos : null })}
                            className="accent-[var(--accent)] cursor-pointer"
                          />
                          포지션 고정 (훈련)
                        </label>
                      )}
                    </div>
                    <div className="text-[.72rem] flex flex-wrap gap-x-3 gap-y-0.5">
                      <span className="text-ink-soft">
                        레벨업 유형 <b className="text-ink">{b.levelup_type1 ?? '—'}/{type2 ?? '—'}</b>
                        {isFixed && selectToSub && <span className="text-[color:var(--gold)]"> (부 고정 변경)</span>}
                      </span>
                      {!isFixed ? (
                        b.dual_position && <span className="text-[color:var(--clay)] font-bold">미고정 듀얼 — 패널티 파워/컨택/수비 -1</span>
                      ) : (
                        <>
                          <span className="text-[color:var(--green)] font-bold">고정 — 듀얼 패널티 없음</span>
                          {corner && <span className="text-[color:var(--green)] font-bold">코스트 -3</span>}
                        </>
                      )}
                    </div>
                  </div>
                </Labeled>
              )
            })()}

            {/* 레벨 */}
            <Labeled label="카드 레벨 (유형 스탯 +1~+7)">
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4, 5, 6, 7].map((lv) => (
                  <button
                    key={lv}
                    type="button"
                    onClick={() => set({ level: lv })}
                    className={cn(
                      'w-9 py-[6px] rounded-lg border text-[.82rem] font-bold cursor-pointer transition',
                      g.level === lv
                        ? 'bg-ink text-[color:var(--surface)] border-ink'
                        : 'bg-surface-2 text-ink-soft border-line-strong hover:border-ink',
                    )}
                  >
                    {lv}
                  </button>
                ))}
              </div>
            </Labeled>

            {/* 토글 줄 — 등급 조건부 */}
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <Toggle
                checked={canAwaken && g.awakening}
                onChange={(v) => canAwaken && set({ awakening: v })}
                label={
                  <span className={cn(!canAwaken && 'opacity-40')}>
                    풀각성 스피릿 {grade === 'L' ? '(일치+4/불일치+6)' : canAwaken ? '(+2)' : '(스페셜 없음)'}
                  </span>
                }
              />
              <Toggle
                checked={canVeteran && g.veteran}
                onChange={(v) => canVeteran && set({ veteran: v })}
                label={
                  <span className={cn(!canVeteran && 'opacity-40')}>
                    베테랑{' '}
                    {grade === 'SG' || grade === 'B'
                      ? '(+2)'
                      : grade === 'FR' || grade === 'E'
                        ? '(+1)'
                        : canVeteran
                          ? '(유형 외 +1)'
                          : '(스페셜 없음)'}
                  </span>
                }
              />
              {canTeamVeteran && (
                <Toggle
                  checked={g.team_veteran}
                  onChange={(v) => set({ team_veteran: v })}
                  label={
                    <span className="text-[color:var(--gold)] font-bold">
                      팀 베테랑 지정 ({grade === 'B' ? '블테랑' : '식테랑'} — 팀 전체 +1{lineup ? '' : ' · 라인업 등록 시 발동'})
                    </span>
                  }
                />
              )}
            </div>

            {/* 잠재력 — 주잠재 3개 중 택1 + 베테랑 시 부잠재 활성 (표시·기록만, 수치는 아래 '잠재력·기타'에) */}
            {(() => {
              const toSub = selPos === b.dual_position
              const mains = (toSub
                ? [b.dual_potential1, b.dual_potential2, b.dual_potential3]
                : [b.potential1, b.potential2, b.potential3]
              ).filter((x): x is string => !!x)
              const sub = toSub ? b.dual_sub_potential : b.sub_potential
              if (mains.length === 0 && !sub) return null
              const sel = g.selected_potential
              const selInfo = sel ? potMap?.[sel] : undefined
              const subInfo = sub ? potMap?.[sub] : undefined
              const pick = (name: string) => set({ selected_potential: sel === name ? null : name })
              return (
                <Labeled label="잠재력 (주잠재 3개 중 1개 선택 · 수치는 아래 '잠재력·기타'에 입력)">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex gap-1 flex-wrap">
                      {mains.map((name) => {
                        const on = sel === name
                        return (
                          <button
                            key={name}
                            type="button"
                            onClick={() => pick(name)}
                            className={cn(
                              'px-2.5 py-[6px] rounded-lg border text-[.8rem] font-bold transition cursor-pointer',
                              on
                                ? 'bg-[color:var(--green)] text-white border-[color:var(--green)]'
                                : 'bg-surface-2 text-ink-soft border-line-strong hover:border-ink',
                            )}
                          >
                            {name}
                          </button>
                        )
                      })}
                      {mains.length === 0 && <span className="text-[.76rem] text-ink-faint py-[6px]">주잠재 없음</span>}
                    </div>
                    {selInfo?.effect && (
                      <div className="text-[.72rem] text-ink-soft whitespace-pre-line">
                        <b className="text-ink-faint mr-1">효과</b>
                        {selInfo.effect}
                        {selInfo.enhanced_effect && (
                          <>
                            {'\n'}
                            <b className="text-ink-faint mr-1">강화</b>
                            {selInfo.enhanced_effect}
                          </>
                        )}
                      </div>
                    )}
                    {sub && (
                      <div className={cn('text-[.72rem]', g.veteran ? 'text-[color:var(--purple)]' : 'text-ink-faint')}>
                        <b>부잠재</b> {sub} · {g.veteran ? '베테랑 활성' : '베테랑 지정 시 활성'}
                        {g.veteran && subInfo?.effect && <span className="text-ink-soft"> — {subInfo.effect}</span>}
                      </div>
                    )}
                  </div>
                </Labeled>
              )
            })()}

            {/* L 전용 — HOF (팀 설정에 저장) */}
            {isLegend && (
              <Labeled label="레전드 잠재 (HOF) — 이 카드가 팀 전체에 발동 (팀 설정에 저장됨)">
                <Select value={legend} onChange={(e) => setLegend(e.target.value as TeamSettings['legend_potential'])}>
                  {LEGEND_POTENTIAL_OPTIONS.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </Select>
              </Labeled>
            )}

            {/* S 전용 — 강점/약점 */}
            {isSpecial && (
              <div className="grid grid-cols-2 gap-2">
                <Labeled label="스페셜 강점 훈련 (유형 스탯 +1/+2)">
                  <Select
                    value={g.special.strength}
                    onChange={(e) => set({ special: { ...g.special, strength: e.target.value as Growth['special']['strength'] } })}
                  >
                    {SPECIAL_TRAIN.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </Select>
                </Labeled>
                <Labeled label="스페셜 약점 훈련 (유형 외 +1/+3)">
                  <Select
                    value={g.special.weakness}
                    onChange={(e) => set({ special: { ...g.special, weakness: e.target.value as Growth['special']['weakness'] } })}
                  >
                    {SPECIAL_TRAIN.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </Select>
                </Labeled>
              </div>
            )}

            {/* 감독훈련 · 장비 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Labeled label="감독훈련">
                <Select value={g.coach_training} onChange={(e) => set({ coach_training: e.target.value })}>
                  {TRAININGS.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </Select>
              </Labeled>
              <Labeled label="장비 종류">
                <Select
                  value={g.equip?.kind ?? ''}
                  onChange={(e) => {
                    const kind = e.target.value as (typeof EQUIP_KINDS)[number] | ''
                    set({ equip: kind ? { kind, grade: g.equip?.grade ?? 'S' } : null })
                  }}
                >
                  <option value="">없음</option>
                  {EQUIP_KINDS.map((k) => (
                    <option key={k} value={k}>
                      {k} ({STAT5_LABEL[EQUIP_STAT[k]]})
                    </option>
                  ))}
                </Select>
              </Labeled>
              <Labeled label="장비 등급 (S+1 · R+2 · E+3 · B+4)">
                <Select
                  disabled={!g.equip}
                  value={g.equip?.grade ?? 'S'}
                  onChange={(e) => g.equip && set({ equip: { ...g.equip, grade: e.target.value as (typeof EQUIP_GRADES)[number] } })}
                >
                  {EQUIP_GRADES.map((k) => (
                    <option key={k}>{k}</option>
                  ))}
                </Select>
              </Labeled>
            </div>

            {/* 숫자 3줄 */}
            <GrowthStatsRow label="협동훈련 (위시)" value={g.coop} onChange={(v) => set({ coop: v })} />
            <GrowthStatsRow label="잠재력 등 기타 (예: 타격감 → 컨택 +2)" value={g.extra} onChange={(v) => set({ extra: v })} />
            <GrowthStatsRow label="체형 (예: 쌀밥/수영 완벽 → 파워+2 스핏+3)" value={g.body} onChange={(v) => set({ body: v })} />
          </div>
        </Panel>
      </div>
    </div>
  )
}

function GrowthStatsRow({ label, value, onChange }: { label: string; value: Stats5; onChange: (v: Stats5) => void }) {
  return (
    <label className="flex flex-col gap-1 min-w-0">
      <span className="text-[.61rem] font-bold uppercase tracking-[.03em] text-ink-faint">{label}</span>
      <div className="grid grid-cols-5 gap-1">
        {STAT5.map((k: Stat5) => (
          <div key={k} className="flex flex-col gap-[2px]">
            <span className="text-[.58rem] text-ink-faint text-center">{STAT5_LABEL[k]}</span>
            <input
              type="number"
              className="w-full rounded-lg border border-line-strong bg-surface-2 text-ink px-1 py-[5px] text-[.8rem] text-center font-mono tabular-nums outline-none focus:border-[color:var(--accent)]"
              value={value[k] === 0 ? '' : value[k]}
              placeholder="0"
              onChange={(e) => onChange({ ...value, [k]: Number(e.target.value) || 0 })}
            />
          </div>
        ))}
      </div>
    </label>
  )
}
