/** 삭제 확인 코드 — 실수 방지용. 삭제 전 prompt 로 입력받아 일치할 때만 진행. */
const DELETE_CODE = '김우춘'

export function askDeleteCode(target: string): 'ok' | 'cancel' | 'wrong' {
  const code = prompt(`'${target}' 을(를) 삭제합니다.\n삭제 코드를 입력하세요:`)
  if (code === null) return 'cancel'
  return code.trim() === DELETE_CODE ? 'ok' : 'wrong'
}
