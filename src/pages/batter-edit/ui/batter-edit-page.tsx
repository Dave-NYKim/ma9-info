import { useNavigate, useParams } from 'react-router-dom'
import { useBatter } from '@entities/batter'
import { BatterForm } from '@widgets/player-form'

export function BatterEditPage() {
  const { id } = useParams()
  const nav = useNavigate()
  const { data: batter } = useBatter(id)
  const done = () => nav('/batters')

  if (id && !batter) return <div className="p-8 text-center text-ink-faint">불러오는 중…</div>

  return (
    <div className="p-4 max-w-[1240px] mx-auto">
      <BatterForm initial={id ? batter : undefined} onDone={done} onCancel={done} />
    </div>
  )
}
