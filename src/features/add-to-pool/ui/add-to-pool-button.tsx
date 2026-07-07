import { toast } from 'sonner'
import { useAddToPool } from '@entities/pool'

/** 카드 우하단 「+풀」 — 팀 빌더 후보 풀에 담기(중복 허용). 카드 클릭(상세 열기)과 분리. */
export function AddToPoolButton({ kind, id, name }: { kind: 'batter' | 'pitcher'; id: string; name: string }) {
  const mut = useAddToPool()
  return (
    <button
      type="button"
      disabled={mut.isPending}
      onClick={(e) => {
        e.stopPropagation()
        mut.mutate(kind === 'batter' ? { batter_id: id } : { pitcher_id: id }, {
          onSuccess: () => toast(`「${name}」 풀에 담았습니다`),
          onError: (err) => toast.error(err.message),
        })
      }}
      className="absolute bottom-2 right-2 z-20 rounded-md border border-line-strong bg-surface/90 px-1.5 py-[3px] text-[.66rem] font-bold text-ink-soft hover:text-ink hover:border-ink cursor-pointer disabled:opacity-40"
      title="팀 빌더 풀에 담기"
    >
      +풀
    </button>
  )
}
