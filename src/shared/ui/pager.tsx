import { Button } from './button'

/** 목록 페이지네이션. total ≤ size 면(=한 페이지면) 렌더 안 함. */
export function Pager({
  page,
  size,
  total,
  onPage,
}: {
  page: number
  size: number
  total: number
  onPage: (p: number) => void
}) {
  const pages = Math.max(1, Math.ceil(total / size))
  if (pages <= 1) return null
  const from = page * size + 1
  const to = Math.min(total, (page + 1) * size)
  return (
    <div className="flex items-center justify-center gap-3 pt-1">
      <Button variant="outline" disabled={page <= 0} onClick={() => onPage(page - 1)}>
        ← 이전
      </Button>
      <span className="text-[.82rem] text-ink-soft tabular-nums">
        {page + 1} / {pages}
        <span className="text-ink-faint">
          {' · '}
          {from}–{to} / {total}
        </span>
      </span>
      <Button variant="outline" disabled={page >= pages - 1} onClick={() => onPage(page + 1)}>
        다음 →
      </Button>
    </div>
  )
}
