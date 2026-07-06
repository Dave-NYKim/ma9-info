import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import type { PitcherInput, PitcherPitch, PitcherWithPitches } from '@entities/pitcher'
import { ConflictError } from '@shared/lib/errors'
import { useCreatePitcher, useUpdatePitcher, usePitcherNameSearch } from '@entities/pitcher'
import { codeLabel, codeValues, teamsByLeague, useCodes } from '@entities/code'
import { usePitcherPotentials, useSpecialPitches } from '@entities/potential'
import { useIsEditor } from '@entities/session'
import { GradeChips, resetAccent } from '@features/grade-select'
import { WeatherPicker } from '@features/weather-picker'
import { PotentialInput } from '@features/potential-autocomplete'
import { NameAutocomplete } from '@features/name-autocomplete'
import { PitchKeyboard, emptyPitchState, type PitchState } from '@features/pitch-keyboard'
import { BAT_HANDS, LEVELUP_PITCH_KEYS, PITCH_KEYS, STAT_MAX, STAT_MIN, THROW_HANDS, type PitchKey } from '@shared/config/domain'
import type { GradeCode } from '@shared/config/grades'
import { Button, Chip, Input, Labeled, Panel, Segmented, Select, Toggle } from '@shared/ui'
import { cn } from '@shared/lib/cn'
import { useDebounced } from '@shared/lib/use-debounced'

const nn = (s: string) => (s.trim() === '' ? null : s.trim())

interface PState {
  league_code: string; team_code: string; grade: GradeCode; year: number | null; name: string
  wP: string | null; wS: string | null; throw_hand: string; bat_hand: string; special_form: boolean
  position: string; dual_position: string; dualOn: boolean
  stamina: number | null; control: number | null; levelup_pitch: string
  p1: string; p2: string; p3: string; sub: string; dp1: string; dp2: string; dp3: string; dsub: string
  pitches: PitchState
}

function pitchesToState(list: PitcherPitch[] = []): PitchState {
  const st = emptyPitchState()
  for (const p of list) st[p.key as PitchKey] = { base: p.pitch_type, value: p.value, special: p.is_special, name: p.special_name ?? '' }
  return st
}
function stateToPitches(st: PitchState): PitcherPitch[] {
  return PITCH_KEYS.filter((k) => st[k].base).map((k) => ({
    key: k, pitch_type: st[k].base, value: st[k].value,
    is_special: st[k].special, special_name: st[k].special ? nn(st[k].name) : null,
  }))
}

function fromPitcher(p?: PitcherWithPitches): PState {
  return {
    league_code: p?.league_code ?? 'MLB_NL', team_code: p?.team_code ?? '',
    grade: (p?.grade as GradeCode) ?? 'S', year: p?.year ?? null, name: p?.name ?? '',
    wP: p?.weather ?? null, wS: p?.sub_weather ?? null,
    throw_hand: p?.throw_hand ?? '우투', bat_hand: p?.bat_hand ?? '우타', special_form: p?.special_form ?? false,
    position: p?.position ?? 'SP', dual_position: p?.dual_position ?? 'RP', dualOn: !!p?.dual_position,
    stamina: p?.stamina ?? 50, control: p?.control ?? 50, levelup_pitch: p?.levelup_pitch ?? 'D',
    p1: p?.potential1 ?? '', p2: p?.potential2 ?? '', p3: p?.potential3 ?? '', sub: p?.sub_potential ?? '',
    dp1: p?.dual_potential1 ?? '', dp2: p?.dual_potential2 ?? '', dp3: p?.dual_potential3 ?? '', dsub: p?.dual_sub_potential ?? '',
    pitches: pitchesToState(p?.pitcher_pitches),
  }
}
function toInput(s: PState): PitcherInput {
  return {
    league_code: s.league_code, team_code: s.team_code, grade: s.grade, year: s.year, name: s.name.trim(),
    weather: s.wP, sub_weather: s.wS, position: s.position, dual_position: s.dualOn ? s.dual_position : null,
    throw_hand: s.throw_hand, bat_hand: s.bat_hand, special_form: s.special_form,
    stamina: s.stamina, control: s.control, levelup_pitch: s.levelup_pitch,
    potential1: nn(s.p1), potential2: nn(s.p2), potential3: nn(s.p3), sub_potential: nn(s.sub),
    dual_potential1: s.dualOn ? nn(s.dp1) : null, dual_potential2: s.dualOn ? nn(s.dp2) : null,
    dual_potential3: s.dualOn ? nn(s.dp3) : null, dual_sub_potential: s.dualOn ? nn(s.dsub) : null,
  }
}

export function PitcherForm({ initial, onDone, onCancel }: { initial?: PitcherWithPitches; onDone: () => void; onCancel: () => void }) {
  const [s, setS] = useState<PState>(() => fromPitcher(initial))
  const set = (patch: Partial<PState>) => setS((p) => ({ ...p, ...patch }))
  const { data: enums } = useCodes()
  const { data: pots = [] } = usePitcherPotentials()
  const { data: specials = [] } = useSpecialPitches()
  const isEditor = useIsEditor()
  const create = useCreatePitcher()
  const update = useUpdatePitcher()
  const busy = create.isPending || update.isPending

  const debName = useDebounced(s.name, 250)
  const { data: nameHits = [] } = usePitcherNameSearch(debName)

  useEffect(() => () => resetAccent(), [])

  const specialByKey = useMemo(() => {
    const m: Record<string, string[]> = {}
    for (const sp of specials) (m[sp.key] ??= []).push(sp.name)
    return m
  }, [specials])

  const teams = teamsByLeague(enums, s.league_code)
  const positions = codeValues(enums, 'position')

  const save = async () => {
    if (!s.name.trim()) return toast.error('이름을 입력하세요')
    if (!s.team_code) return toast.error('소속팀을 선택하세요')
    const pitches = stateToPitches(s.pitches)
    try {
      if (initial) await update.mutateAsync({ id: initial.id, patch: toInput(s), version: initial.version, pitches })
      else await create.mutateAsync({ input: toInput(s), pitches })
      toast.success('저장되었습니다')
      onDone()
    } catch (err) {
      if (err instanceof ConflictError) toast.error(err.message)
      else toast.error(err instanceof Error ? err.message : '저장 실패')
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <h1 className="text-[1.1rem] font-extrabold">{initial ? '투수 수정' : '투수 등록'}</h1>
        <div className="ml-auto flex gap-2">
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
                    {codeValues(enums, 'league').map((c) => <option key={c}>{c}</option>)}
                  </Select>
                </Labeled>
                <Labeled label="소속팀">
                  <Select value={s.team_code} onChange={(e) => set({ team_code: e.target.value })}>
                    <option value="">선택</option>
                    {teams.map((c) => <option key={c}>{c}</option>)}
                  </Select>
                </Labeled>
              </div>
              <Labeled label="등급">
                <GradeChips value={s.grade} onChange={(g) => set({ grade: g })} />
              </Labeled>
              <div className="grid grid-cols-2 gap-2">
                <Labeled label="연도">
                  <Input type="number" value={s.year ?? ''} placeholder="2024" onChange={(e) => set({ year: e.target.value ? Number(e.target.value) : null })} />
                </Labeled>
                <Labeled label="이름">
                  <NameAutocomplete
                    value={s.name}
                    onChange={(v) => set({ name: v })}
                    items={nameHits}
                    getName={(h) => h.name}
                    getHint={(h) => `${codeLabel(enums, 'league', h.league_code) || h.league_code} · ${codeLabel(enums, 'team', h.team_code) || h.team_code}`}
                    onPick={(h) => {
                      // 특이구종을 키보드 상태에 반영 (수치는 카드마다 달라 비움)
                      const next = { ...s.pitches }
                      for (const sp of h.pitcher_pitches ?? []) {
                        if (!sp.is_special) continue
                        const k = sp.key as PitchKey
                        next[k] = { base: sp.pitch_type, value: next[k]?.value ?? null, special: true, name: sp.special_name ?? '' }
                      }
                      set({
                        name: h.name,
                        league_code: h.league_code,
                        team_code: h.team_code,
                        throw_hand: h.throw_hand,
                        bat_hand: h.bat_hand,
                        special_form: h.special_form,
                        pitches: next,
                      })
                    }}
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
                <Labeled label="투구"><Segmented options={THROW_HANDS} value={s.throw_hand} onChange={(v) => set({ throw_hand: v })} /></Labeled>
                <Labeled label="타석"><Segmented options={BAT_HANDS} value={s.bat_hand} onChange={(v) => set({ bat_hand: v })} /></Labeled>
              </div>
              <Toggle checked={s.special_form} onChange={(v) => set({ special_form: v })} label={s.special_form ? '특이폼 있음' : '특이폼 없음'} />
            </div>
          </Panel>
        </div>

        {/* col 2 : 스탯 + 구종 */}
        <div className="flex flex-col gap-[13px]">
          <Panel title="스탯 · 1–100">
            <div className="grid grid-cols-2 gap-x-[14px] gap-y-2 max-w-[300px]">
              {(['stamina', 'control'] as const).map((k) => (
                <div key={k} className="flex items-center gap-2">
                  <span className="text-[.77rem] font-semibold text-ink-soft w-[46px] flex-none">{k === 'stamina' ? '체력' : '제구'}</span>
                  <Input
                    type="number" min={STAT_MIN} max={STAT_MAX} value={s[k] ?? ''}
                    onChange={(e) => set({ [k]: e.target.value ? Number(e.target.value) : null } as Partial<PState>)}
                    onBlur={(e) => set({ [k]: Math.max(STAT_MIN, Math.min(STAT_MAX, Number(e.target.value) || STAT_MIN)) } as Partial<PState>)}
                  />
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="구종">
            <PitchKeyboard value={s.pitches} onChange={(v) => set({ pitches: v })} enums={enums} specialByKey={specialByKey} />
          </Panel>
        </div>

        {/* col 3 : 레벨업 + 포지션/잠재력 */}
        <div className="flex flex-col gap-[13px]">
          <Panel title="레벨업유형 · 성장할 구종 (S 제외)" accentColor="var(--gold)">
            <div className="flex gap-[5px] flex-wrap">
              {LEVELUP_PITCH_KEYS.map((k) => (
                <Chip key={k} active={s.levelup_pitch === k} onClick={() => set({ levelup_pitch: k })}>
                  {k}
                </Chip>
              ))}
            </div>
          </Panel>

          <Panel title="포지션 · 잠재력" accentColor="var(--purple)" right={<Toggle checked={s.dualOn} onChange={(v) => set({ dualOn: v })} label="듀얼" />}>
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-[90px_1fr] gap-2 items-center">
                <span className="text-[.61rem] font-bold uppercase text-ink-faint">포지션</span>
                <Select value={s.position} onChange={(e) => set({ position: e.target.value })}>
                  {positions.map((c) => <option key={c}>{c}</option>)}
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Labeled label="잠재1"><PotentialInput value={s.p1} onChange={(v) => set({ p1: v })} options={pots} /></Labeled>
                <Labeled label="잠재2"><PotentialInput value={s.p2} onChange={(v) => set({ p2: v })} options={pots} /></Labeled>
                <Labeled label="잠재3"><PotentialInput value={s.p3} onChange={(v) => set({ p3: v })} options={pots} /></Labeled>
                <Labeled label="부잠재력"><PotentialInput value={s.sub} onChange={(v) => set({ sub: v })} options={pots} /></Labeled>
              </div>
            </div>
            <div className={cn('flex flex-col gap-2 mt-3 pt-3 border-t border-line', !s.dualOn && 'opacity-40 pointer-events-none')}>
              <div className="grid grid-cols-[90px_1fr] gap-2 items-center">
                <span className="text-[.61rem] font-bold uppercase text-ink-faint">듀얼포지션</span>
                <Select value={s.dual_position} onChange={(e) => set({ dual_position: e.target.value })} disabled={!s.dualOn}>
                  {positions.map((c) => <option key={c}>{c}</option>)}
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Labeled label="잠재1"><PotentialInput value={s.dp1} onChange={(v) => set({ dp1: v })} options={pots} /></Labeled>
                <Labeled label="잠재2"><PotentialInput value={s.dp2} onChange={(v) => set({ dp2: v })} options={pots} /></Labeled>
                <Labeled label="잠재3"><PotentialInput value={s.dp3} onChange={(v) => set({ dp3: v })} options={pots} /></Labeled>
                <Labeled label="부잠재력"><PotentialInput value={s.dsub} onChange={(v) => set({ dsub: v })} options={pots} /></Labeled>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}
