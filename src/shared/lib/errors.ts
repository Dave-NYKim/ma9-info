/** 버전 불일치(다른 사람이 먼저 수정) → 프론트에서 최신 refetch + 토스트 */
export class ConflictError extends Error {
  constructor() {
    super('다른 사람이 먼저 수정했어요. 최신 내용을 불러왔습니다.')
    this.name = 'ConflictError'
  }
}
