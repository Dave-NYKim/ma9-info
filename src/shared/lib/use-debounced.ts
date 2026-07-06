import { useEffect, useState } from 'react'

/** value 가 delay(ms) 동안 안정되면 그 값을 반환. 입력 자동완성 같은 곳에서 쿼리 폭주 방지. */
export function useDebounced<T>(value: T, delay = 250): T {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return v
}
