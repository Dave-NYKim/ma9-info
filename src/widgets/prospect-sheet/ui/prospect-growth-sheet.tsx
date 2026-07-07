import { useState } from 'react'
import { GROW_STEP, prospectBaseStats, type Prospect } from '@shared/config/prospects'
import {
  EQUIP_GRADES,
  EQUIP_KINDS,
  EQUIP_STAT,
  STAT5,
  STAT5_LABEL,
  type Stat5,
  type Stats5,
} from '@shared/config/team-stats'
import { Badge, Button, Labeled, Panel, Select, Toggle } from '@shared/ui'

/** 유망주 육성 — 성장 7단계(4·5단계 2배)·완벽 보너스·라이징·ROY·강약점·장비·특화. 정체성은 「설정」에서. */
export function ProspectGrowthSheet({
  prospect,
  onSave,
  onClose,
}: {
  prospect: Prospect
  onSave: (p: Prospect) => void
  onClose: () => void
}) {
  const [p, setP] = useState<Prospect>(prospect)
  const set = (patch: Partial<Prospect>) => setP((prev) => ({ ...prev, ...patch }))
  const base = prospectBaseStats(p)
  const perfect = p.steps.filter((s) => s === '완벽').length

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/45 p-4" onClick={onClose}>
      <div className="w-full max-w-[640px] my-6" onClick={(e) => e.stopPropagation()}>
        <Panel
          title={
            <span className="normal-case tracking-normal text-[.9rem] flex items-center gap-2">
              <Badge color="var(--green)">유망주 육성</Badge>
              <b className="text-ink text-[1rem]">{p.name}</b>
              <span className="text-ink-faint text-[.78rem]">
                {p.position} · {p.type1}/{p.type2}
              </span>
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
            {/* 기본스탯 참고 */}
            <div className="flex items-center gap-3 rounded-lg border border-line bg-surface-2 px-3 py-2 flex-wrap">
              <span className="text-[.64rem] font-bold uppercase tracking-[.08em] text-ink-faint">기본 스탯</span>
              {STAT5.map((k) => (
                <span key={k} className="flex items-baseline gap-1">
                  <span className="text-[.66rem] text-ink-faint">{STAT5_LABEL[k]}</span>
                  <b className="font-mono tabular-nums">{base[k]}</b>
                </span>
              ))}
            </div>

            {/* 성장 7단계 */}
            <Labeled
              label={`선수 성장 1~7단계 (4·5단계 2배 가중) · 완벽 ${perfect}개${perfect >= 5 ? ` → 보너스 +${perfect === 5 ? 2 : perfect === 6 ? 3 : 4}` : ''}`}
            >
              <div className="grid grid-cols-7 gap-1">
                {p.steps.map((step, i) => (
                  <div key={i} className="flex flex-col gap-[2px]">
                    <span className={`text-[.6rem] text-center font-bold ${i === 3 || i === 4 ? 'text-[color:var(--gold)]' : 'text-ink-faint'}`}>
                      {i + 1}단계
                    </span>
                    <Select
                      className="!px-1 !py-[5px] !text-[.76rem] text-center"
                      value={step}
                      onChange={(e) => {
                        const steps = [...p.steps] as Prospect['steps']
                        steps[i] = e.target.value as (typeof GROW_STEP)[number]
                        set({ steps })
                      }}
                    >
                      {GROW_STEP.map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </Select>
                  </div>
                ))}
              </div>
            </Labeled>

            {/* 토글 · 강약점 */}
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <Toggle checked={p.rising} onChange={(v) => set({ rising: v })} label="라이징스타 적용 (전 스탯 +2)" />
              <Toggle checked={p.roy_awaken} onChange={(v) => set({ roy_awaken: v })} label="풀각성 ROY (일치 +4 / 불일치 +6)" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Labeled label="강점 훈련 (유형 스탯 +1/+2)">
                <Select value={p.strength} onChange={(e) => set({ strength: e.target.value as Prospect['strength'] })}>
                  {GROW_STEP.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </Select>
              </Labeled>
              <Labeled label="약점 훈련 (유형 외 +1/+3)">
                <Select value={p.weakness} onChange={(e) => set({ weakness: e.target.value as Prospect['weakness'] })}>
                  {GROW_STEP.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </Select>
              </Labeled>
            </div>

            {/* 장비 */}
            <div className="grid grid-cols-2 gap-2">
              <Labeled label="장비 종류">
                <Select
                  value={p.equip?.kind ?? ''}
                  onChange={(e) => {
                    const kind = e.target.value as (typeof EQUIP_KINDS)[number] | ''
                    set({ equip: kind ? { kind, grade: p.equip?.grade ?? 'S' } : null })
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
                  disabled={!p.equip}
                  value={p.equip?.grade ?? 'S'}
                  onChange={(e) => p.equip && set({ equip: { ...p.equip, grade: e.target.value as (typeof EQUIP_GRADES)[number] } })}
                >
                  {EQUIP_GRADES.map((k) => (
                    <option key={k}>{k}</option>
                  ))}
                </Select>
              </Labeled>
            </div>

            {/* 숫자 3줄 */}
            <NumRow label="협동훈련 (위시)" value={p.coop} onChange={(v) => set({ coop: v })} />
            <NumRow label="잠재력 등 기타" value={p.extra} onChange={(v) => set({ extra: v })} />
            <NumRow label="특화훈련 (유망주 체형)" value={p.body} onChange={(v) => set({ body: v })} />
          </div>
        </Panel>
      </div>
    </div>
  )
}

function NumRow({ label, value, onChange }: { label: string; value: Stats5; onChange: (v: Stats5) => void }) {
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
