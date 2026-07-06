import { useNavigate, useParams } from 'react-router-dom'
import { usePitcher } from '@entities/pitcher'
import { PitcherForm } from '@widgets/player-form'

export function PitcherEditPage() {
  const { id } = useParams()
  const nav = useNavigate()
  const { data: pitcher } = usePitcher(id)
  const done = () => nav('/pitchers')

  if (id && !pitcher) return <div className="p-8 text-center text-ink-faint">불러오는 중…</div>

  return (
    <div className="p-4 max-w-[1240px] mx-auto">
      <PitcherForm initial={id ? pitcher : undefined} onDone={done} onCancel={done} />
    </div>
  )
}
