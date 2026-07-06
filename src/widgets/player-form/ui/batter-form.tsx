import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { Batter, BatterInput } from '@entities/batter'
import { useCreateBatter, useUpdateBatter, useDeleteBatter, useBatterNameSearch } from '@entities/batter'
import { ConflictError } from '@shared/lib/errors'
import { codeLabel, codeValues, teamsByLeague, useCodes } from '@entities/code'
import { useBatterPotentials, useCreatePotential } from '@entities/potential'
import { useIsEditor } from '@entities/session'
import { GradeChips, resetAccent } from '@features/grade-select'
import { WeatherPicker } from '@features/weather-picker'
import { PotentialInput } from '@features/potential-autocomplete'
import { NameAutocomplete } from '@features/name-autocomplete'
import { BATTER_STATS, BAT_HANDS, LEVELUP1, LEVELUP2, STAT_MAX, STAT_MIN, THROW_HANDS } from '@shared/config/domain'
import type { GradeCode } from '@shared/config/grades'
import { useLastEntryStore, type EntryBasics } from '@shared/model/last-entry-store'
import { askDeleteCode } from '@shared/lib/delete-code'
import { Button, Chip, Input, Labeled, Panel, Segmented, Select, Toggle } from '@shared/ui'
import { cn } from '@shared/lib/cn'
import { useDebounced } from '@shared/lib/use-debounced'

type StatKey = (typeof BATTER_STATS)[number]['key']
interface FormState {
  league_code: string; team_code: string; grade: GradeCode; year: number | null; name: string
  wP: string | null; wS: string | null; throw_hand: string; bat_hand: string; special_form: boolean
  position: string; dual_position: string; dualOn: boolean
  levelup_type1: string; levelup_type2: string; dual_levelup_type2: string
  stats: Record<StatKey, number>
  p1: string; p2: string; p3: string; sub: string
  dp1: string; dp2: string; dp3: string; dsub: string
}

const nn = (s: string) => (s.trim() === '' ? null : s.trim())

function fromBatter(b?: Batter, last?: EntryBasics): FormState {
  return {
    // 신규 등록이면 마지막 입력의 기본정보(리그·팀·등급·이름)를 미리 채움
    league_code: b?.league_code ?? last?.league_code ?? 'MLB_NL', team_code: b?.team_code ?? last?.team_code ?? '',
    grade: (b?.grade as GradeCode) ?? (last?.grade as GradeCode) ?? 'S', year: b?.year ?? null, name: b?.name ?? last?.name ?? '',
    wP: b?.weather ?? null, wS: b?.sub_weather ?? null,
    throw_hand: b?.throw_hand ?? '우투', bat_hand: b?.bat_hand ?? '우타', special_form: b?.special_form ?? false,
    position: b?.position ?? 'C', dual_position: b?.dual_position ?? 'C', dualOn: !!b?.dual_position,
    levelup_type1: b?.levelup_type1 ?? '파워',
    levelup_type2: b?.levelup_type2 ?? '스피드', dual_levelup_type2: b?.dual_levelup_type2 ?? '스피드',
    stats: {
      power: b?.power ?? 50, contact: b?.contact ?? 50, speed: b?.speed ?? 50,
      throwing: b?.throwing ?? 50, defense: b?.defense ?? 50, clutch: b?.clutch ?? 50,
    },
    p1: b?.potential1 ?? '', p2: b?.potential2 ?? '', p3: b?.potential3 ?? '', sub: b?.sub_potential ?? '',
    dp1: b?.dual_potential1 ?? '', dp2: b?.dual_potential2 ?? '', dp3: b?.dual_potential3 ?? '', dsub: b?.dual_sub_potential ?? '',
  }
}

function toInput(s: FormState): BatterInput {
  return {
    league_code: s.league_code, team_code: s.team_code, grade: s.grade, year: s.year, name: s.name.trim(),
    weather: s.wP, sub_weather: s.wS, position: s.position, dual_position: s.dualOn ? s.dual_position : null,
    throw_hand: s.throw_hand, bat_hand: s.bat_hand, special_form: s.special_form,
    levelup_type1: s.levelup_type1, ...s.stats,
    levelup_type2: s.levelup_type2, potential1: nn(s.p1), potential2: nn(s.p2), potential3: nn(s.p3), sub_potential: nn(s.sub),
    dual_levelup_type2: s.dualOn ? s.dual_levelup_type2 : null,
    dual_potential1: s.dualOn ? nn(s.dp1) : null, dual_potential2: s.dualOn ? nn(s.dp2) : null,
    dual_potential3: s.dualOn ? nn(s.dp3) : null, dual_sub_potential: s.dualOn ? nn(s.dsub) : null,
  }
}

function ChipRow({ label, options, value, onChange, dim }: { label: string; options: readonly string[]; value: string; onChange: (v: string) => void; dim?: boolean }) {
  return (
    <div className={cn('flex items-center gap-[9px]', dim && 'opacity-40 pointer-events-none')}>
      <span className="text-[.61rem] font-bold uppercase text-ink-faint w-[76px] flex-none">{label}</span>
      <div className="flex gap-[5px] flex-wrap">
        {options.map((o) => (
          <Chip key={o} active={value === o} onClick={() => onChange(o)}>
            {o}
          </Chip>
        ))}
      </div>
    </div>
  )
}

export function BatterForm({ initial, onDone, onCancel }: { initial?: Batter; onDone: () => void; onCancel: () => void }) {
  const lastEntry = useLastEntryStore((st) => st.batter)
  const setLastEntry = useLastEntryStore((st) => st.setBatter)
  const [s, setS] = useState<FormState>(() => fromBatter(initial, initial ? undefined : lastEntry))
  const set = (patch: Partial<FormState>) => setS((p) => ({ ...p, ...patch }))
  const { data: enums } = useCodes()
  const { data: pots = [] } = useBatterPotentials()
  const isEditor = useIsEditor()
  const create = useCreateBatter()
  const update = useUpdateBatter()
  const del = useDeleteBatter()
  const createPot = useCreatePotential('batter')
  const busy = create.isPending || update.isPending || del.isPending

  const debName = useDebounced(s.name, 250)
  const { data: nameHits = [] } = useBatterNameSearch(debName)

  useEffect(() => () => resetAccent(), [])

  const teams = teamsByLeague(enums, s.league_code)
  const positions = codeValues(enums, 'position')

  // 잠재력 blur 시 목록에 없으면 등록 확인 — 취소하면 재포커스(기존 잠재력 입력 또는 추가, 둘 중 하나만 허용)
  const askAddPotential = async (raw: string, refocus: () => void) => {
    const name = raw.trim()
    if (!name || pots.includes(name)) return
    if (!confirm(`'${name}' 잠재력이 목록에 없습니다. 추가하시겠습니까?`)) return refocus()
    try {
      await createPot.mutateAsync({ name, description: null, effect: null, enhanced_effect: null })
      toast.success(`'${name}' 잠재력이 추가되었습니다`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '잠재력 추가 실패')
      refocus()
    }
  }

  const save = async () => {
    if (!s.name.trim()) return toast.error('이름을 입력하세요')
    if (!s.team_code) return toast.error('소속팀을 선택하세요')
    if (!confirm('저장하시겠습니까?')) return // 아니요 → 페이지에 그대로
    try {
      if (initial) await update.mutateAsync({ id: initial.id, patch: toInput(s), version: initial.version })
      else {
        await create.mutateAsync(toInput(s))
        // 다음 등록 폼에 기본정보 미리 채우기용
        setLastEntry({ league_code: s.league_code, team_code: s.team_code, grade: s.grade, name: s.name.trim() })
      }
      toast.success('저장되었습니다')
      onDone()
    } catch (err) {
      if (err instanceof ConflictError) toast.error(err.message)
      else toast.error(err instanceof Error ? err.message : '저장 실패')
    }
  }

  // 선수 삭제 (soft delete) — 삭제 코드 입력으로 확인
  const removePlayer = async () => {
    if (!initial) return
    const r = askDeleteCode(`${initial.name} · ${initial.grade}등급 타자`)
    if (r === 'cancel') return
    if (r === 'wrong') return toast.error('삭제 코드가 일치하지 않습니다')
    try {
      await del.mutateAsync(initial.id)
      toast.success('삭제되었습니다')
      onDone()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '삭제 실패')
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <h1 className="text-[1.1rem] font-extrabold">{initial ? '타자 수정' : '타자 등록'}</h1>
        <div className="ml-auto flex gap-2">
          {initial && isEditor && (
            <Button variant="ghost" className="text-[color:var(--g-r)]" disabled={busy} onClick={removePlayer}>
              삭제
            </Button>
          )}
          <Button onClick={onCancel}>취소</Button>
          <Button variant="primary" onClick={save} disabled={busy || !isEditor} title={!isEditor ? 'editor 권한 필요' : ''}>
            {busy ? '저장 중…' : '저장'}
          </Button>
        </div>
      </div>

      <div className="grid gap-[13px] grid-cols-1 md:grid-cols-2 xl:grid-cols-3 items-start">
        {/* col 1 */}
        <div className="flex flex-col gap-[13px]">
          <Panel title="기본 정보">
            <div className="flex flex-col gap-[9px]">
              <div className="grid grid-cols-2 gap-2">
                <Labeled label="리그">
                  <Select value={s.league_code} onChange={(e) => set({ league_code: e.target.value, team_code: '' })}>
                    {codeValues(enums, 'league').map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </Select>
                </Labeled>
                <Labeled label="소속팀">
                  <Select value={s.team_code} onChange={(e) => set({ team_code: e.target.value })}>
                    <option value="">선택</option>
                    {teams.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </Select>
                </Labeled>
              </div>
              <Labeled label="등급">
                <GradeChips value={s.grade} onChange={(g) => set({ grade: g })} />
              </Labeled>
              <div className="grid grid-cols-2 gap-2">
                <Labeled label="연도">
                  <Input
                    type="number"
                    value={s.year ?? ''}
                    placeholder="2024"
                    onChange={(e) => set({ year: e.target.value ? Number(e.target.value) : null })}
                  />
                </Labeled>
                <Labeled label="이름">
                  <NameAutocomplete
                    value={s.name}
                    onChange={(v) => set({ name: v })}
                    items={nameHits}
                    getName={(h) => h.name}
                    getHint={(h) => `${codeLabel(enums, 'league', h.league_code) || h.league_code} · ${codeLabel(enums, 'team', h.team_code) || h.team_code}`}
                    onPick={(h) =>
                      set({
                        name: h.name,
                        league_code: h.league_code,
                        team_code: h.team_code,
                        throw_hand: h.throw_hand,
                        bat_hand: h.bat_hand,
                        special_form: h.special_form,
                      })
                    }
                    placeholder="이름 입력 → 기존 선수 검색"
                  />
                </Labeled>
              </div>
            </div>
          </Panel>

          <Panel title="날씨 · 투타 · 폼">
            <div className="flex flex-col gap-[9px]">
              <WeatherPicker primary={s.wP} secondary={s.wS} onChange={(p, sec) => set({ wP: p, wS: sec })} />
              <div className="grid grid-cols-2 gap-2">
                <Labeled label="투구">
                  <Segmented options={THROW_HANDS} value={s.throw_hand} onChange={(v) => set({ throw_hand: v })} />
                </Labeled>
                <Labeled label="타석">
                  <Segmented options={BAT_HANDS} value={s.bat_hand} onChange={(v) => set({ bat_hand: v })} />
                </Labeled>
              </div>
              <Toggle
                checked={s.special_form}
                onChange={(v) => set({ special_form: v })}
                label={s.special_form ? '특이폼 있음' : '특이폼 없음'}
              />
            </div>
          </Panel>
        </div>

        {/* col 2 */}
        <div className="flex flex-col gap-[13px]">
          <Panel title="스탯 · 1–100">
            <div className="grid grid-cols-2 gap-x-[14px] gap-y-2 max-w-[380px]">
              {BATTER_STATS.map((st) => (
                <div key={st.key} className="flex items-center gap-2">
                  <span className="text-[.77rem] font-semibold text-ink-soft w-[46px] flex-none">{st.label}</span>
                  <Input
                    type="number"
                    min={STAT_MIN}
                    max={STAT_MAX}
                    value={s.stats[st.key]}
                    onChange={(e) => set({ stats: { ...s.stats, [st.key]: Number(e.target.value) } })}
                    onBlur={(e) =>
                      set({ stats: { ...s.stats, [st.key]: Math.max(STAT_MIN, Math.min(STAT_MAX, Number(e.target.value) || STAT_MIN)) } })
                    }
                  />
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="레벨업유형" accentColor="var(--gold)">
            <div className="flex flex-col gap-2">
              <ChipRow label="유형1 공통" options={LEVELUP1} value={s.levelup_type1} onChange={(v) => set({ levelup_type1: v })} />
              <ChipRow label="유형2 기본" options={LEVELUP2} value={s.levelup_type2} onChange={(v) => set({ levelup_type2: v })} />
              <ChipRow label="유형2 듀얼" options={LEVELUP2} value={s.dual_levelup_type2} onChange={(v) => set({ dual_levelup_type2: v })} dim={!s.dualOn} />
            </div>
          </Panel>
        </div>

        {/* col 3 */}
        <div className="flex flex-col gap-[13px]">
          <Panel
            title="포지션 · 잠재력"
            accentColor="var(--purple)"
            right={<Toggle checked={s.dualOn} onChange={(v) => set({ dualOn: v })} label="듀얼" />}
          >
            {/* 기본 세트 */}
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-[90px_1fr] gap-2 items-center">
                <span className="text-[.61rem] font-bold uppercase text-ink-faint">포지션</span>
                <Select value={s.position} onChange={(e) => set({ position: e.target.value })}>
                  {positions.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Labeled label="잠재1"><PotentialInput value={s.p1} onChange={(v) => set({ p1: v })} options={pots} onBlur={askAddPotential} /></Labeled>
                <Labeled label="잠재2"><PotentialInput value={s.p2} onChange={(v) => set({ p2: v })} options={pots} onBlur={askAddPotential} /></Labeled>
                <Labeled label="잠재3"><PotentialInput value={s.p3} onChange={(v) => set({ p3: v })} options={pots} onBlur={askAddPotential} /></Labeled>
                <Labeled label="부잠재력"><PotentialInput value={s.sub} onChange={(v) => set({ sub: v })} options={pots} onBlur={askAddPotential} /></Labeled>
              </div>
            </div>
            {/* 듀얼 세트 */}
            <div className={cn('flex flex-col gap-2 mt-3 pt-3 border-t border-line', !s.dualOn && 'opacity-40 pointer-events-none')}>
              <div className="grid grid-cols-[90px_1fr] gap-2 items-center">
                <span className="text-[.61rem] font-bold uppercase text-ink-faint">듀얼포지션</span>
                <Select value={s.dual_position} onChange={(e) => set({ dual_position: e.target.value })} disabled={!s.dualOn}>
                  {positions.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Labeled label="잠재1"><PotentialInput value={s.dp1} onChange={(v) => set({ dp1: v })} options={pots} onBlur={askAddPotential} /></Labeled>
                <Labeled label="잠재2"><PotentialInput value={s.dp2} onChange={(v) => set({ dp2: v })} options={pots} onBlur={askAddPotential} /></Labeled>
                <Labeled label="잠재3"><PotentialInput value={s.dp3} onChange={(v) => set({ dp3: v })} options={pots} onBlur={askAddPotential} /></Labeled>
                <Labeled label="부잠재력"><PotentialInput value={s.dsub} onChange={(v) => set({ dsub: v })} options={pots} onBlur={askAddPotential} /></Labeled>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}
