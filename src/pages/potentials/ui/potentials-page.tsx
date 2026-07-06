import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { X } from 'lucide-react'
import { create } from 'zustand'
import {
  usePotentialInfos,
  useCreatePotential,
  useUpdatePotential,
  useDeletePotential,
  type PotentialInfo,
  type PotentialKind,
} from '@entities/potential'
import { useIsEditor } from '@entities/session'
import { PAGE_SIZE } from '@shared/config/domain'
import { askDeleteCode } from '@shared/lib/delete-code'
import { Button, Input, Pager, Segmented } from '@shared/ui'

const KINDS = ['타자', '투수'] as const
type KindLabel = (typeof KINDS)[number]

// 모듈 스코프 스토어 — 다른 페이지 갔다 와도 탭·검색·페이지 유지
const usePotStore = create<{
  kindLabel: KindLabel
  q: string
  page: number
  setKindLabel: (k: KindLabel) => void
  setQ: (q: string) => void
  setPage: (p: number) => void
}>((set) => ({
  kindLabel: '타자',
  q: '',
  page: 0,
  setKindLabel: (kindLabel) => set({ kindLabel, page: 0 }),
  setQ: (q) => set({ q, page: 0 }),
  setPage: (page) => set({ page }),
}))

const COLS: { key: keyof PotentialInfo; label: string; width?: string }[] = [
  { key: 'name', label: '이름', width: 'w-[150px]' },
  { key: 'description', label: '설명' },
  { key: 'effect', label: '효과' },
  { key: 'enhanced_effect', label: '강화효과' },
]

/** 인라인 편집 셀 — blur/Enter 저장 · Esc 취소 · required 는 빈 값 원복 */
function Cell({
  value,
  onSave,
  disabled,
  required,
}: {
  value: string | null
  onSave: (v: string | null) => void
  disabled?: boolean
  required?: boolean
}) {
  const [v, setV] = useState(value ?? '')
  useEffect(() => setV(value ?? ''), [value])
  return (
    <input
      value={v}
      disabled={disabled}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => {
        const t = v.trim()
        if (t === (value ?? '')) return
        if (required && !t) return setV(value ?? '') // 이름은 비울 수 없음 → 원복
        onSave(t || null)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur()
        if (e.key === 'Escape') setV(value ?? '')
      }}
      className="w-full min-w-[120px] bg-transparent px-2.5 py-2 text-ink outline-none rounded transition focus:bg-surface-2 disabled:opacity-60"
    />
  )
}

export function PotentialsPage() {
  const { kindLabel, q, page, setKindLabel, setQ, setPage } = usePotStore()
  const kind: PotentialKind = kindLabel === '타자' ? 'batter' : 'pitcher'
  const [newName, setNewName] = useState('')

  // 카드의 잠재력 뱃지 클릭 → /potentials?kind=…&q=… 진입 시 해당 잠재력 바로 표시
  const [params] = useSearchParams()
  useEffect(() => {
    const pq = params.get('q')
    if (pq !== null) setQ(pq)
    const pk = params.get('kind')
    if (pk) setKindLabel(pk === 'pitcher' ? '투수' : '타자')
  }, [params, setQ, setKindLabel])

  const isEditor = useIsEditor()
  const { data: rows = [], isLoading } = usePotentialInfos(kind)
  const createM = useCreatePotential(kind)
  const updateM = useUpdatePotential(kind)
  const deleteM = useDeletePotential(kind)

  const term = q.trim()
  const filtered = term
    ? rows.filter((r) => [r.name, r.description, r.effect, r.enhanced_effect].some((v) => v?.includes(term)))
    : rows

  // 삭제 등으로 현재 페이지가 범위를 벗어나면 마지막 페이지로 클램프
  const safePage = Math.min(page, Math.max(0, Math.ceil(filtered.length / PAGE_SIZE) - 1))
  const paged = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE)

  const err = (e: unknown) => toast.error(e instanceof Error ? e.message : '저장 실패')

  const add = async () => {
    const name = newName.trim()
    if (!name) return toast.error('이름을 입력하세요')
    if (rows.some((r) => r.name === name)) return toast.error('이미 있는 잠재력입니다')
    try {
      await createM.mutateAsync({ name, description: null, effect: null, enhanced_effect: null })
      setNewName('')
      setQ(name) // 추가한 잠재력만 바로 보이게 — 이어서 효과 입력
      toast.success('추가되었습니다. 효과를 입력하세요.')
    } catch (e) {
      err(e)
    }
  }

  const saveCell = async (oldName: string, field: keyof PotentialInfo, v: string | null) => {
    if (field === 'name' && v && rows.some((r) => r.name === v)) return toast.error('이미 있는 이름입니다')
    try {
      await updateM.mutateAsync({ name: oldName, patch: { [field]: v } })
    } catch (e) {
      err(e)
    }
  }

  const remove = async (name: string) => {
    const r = askDeleteCode(name)
    if (r === 'cancel') return
    if (r === 'wrong') return toast.error('삭제 코드가 일치하지 않습니다')
    try {
      await deleteM.mutateAsync(name)
      toast.success('삭제되었습니다')
    } catch (e) {
      err(e)
    }
  }

  return (
    <div className="p-4 flex flex-col gap-3 max-w-[1300px] mx-auto">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-extrabold">잠재력</h1>
        <span className="text-ink-faint text-sm tabular-nums">{filtered.length}개</span>
        <div className="ml-auto w-[120px]">
          <Segmented options={KINDS} value={kindLabel} onChange={(v) => setKindLabel(v as KindLabel)} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <Input
          type="text"
          placeholder="이름·설명·효과 검색"
          className="w-auto flex-1 min-w-[160px]"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {isEditor && (
          <>
            <Input
              type="text"
              placeholder="새 잠재력 이름"
              className="w-[160px]"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && add()}
            />
            <Button variant="primary" disabled={createM.isPending} onClick={add}>
              + 추가
            </Button>
          </>
        )}
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-ink-faint">불러오는 중…</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full text-[.82rem] border-collapse">
            <thead>
              <tr className="text-left text-[.68rem] font-bold uppercase tracking-[.06em] text-ink-faint">
                {COLS.map((c) => (
                  <th key={c.key} className={`px-2.5 py-2 ${c.width ?? ''}`}>
                    {c.label}
                  </th>
                ))}
                {isEditor && <th className="w-9" />}
              </tr>
            </thead>
            <tbody>
              {paged.map((r) => (
                <tr key={r.name} className="border-t border-line hover:bg-surface-2/50">
                  {COLS.map((c) => (
                    <td key={c.key} className={c.key === 'name' ? 'font-semibold' : ''}>
                      <Cell
                        value={r[c.key]}
                        disabled={!isEditor}
                        required={c.key === 'name'}
                        onSave={(v) => saveCell(r.name, c.key, v)}
                      />
                    </td>
                  ))}
                  {isEditor && (
                    <td className="text-center">
                      <button
                        type="button"
                        title="삭제"
                        onClick={() => remove(r.name)}
                        className="p-1.5 rounded text-ink-faint cursor-pointer transition hover:text-[color:var(--g-r)] hover:bg-surface-2"
                      >
                        <X size={14} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr className="border-t border-line">
                  <td colSpan={COLS.length + 1} className="px-2.5 py-8 text-center text-ink-faint">
                    {term ? '검색 결과 없음' : '잠재력 없음'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Pager page={safePage} size={PAGE_SIZE} total={filtered.length} onPage={setPage} />

      <p className="text-[.72rem] text-ink-faint">
        셀 클릭 후 바로 수정 — Enter/포커스 아웃 저장 · Esc 취소. 이름을 바꾸면 선수 카드에 입력된 기존 이름과 연결이 끊어지니 주의.
      </p>
    </div>
  )
}
