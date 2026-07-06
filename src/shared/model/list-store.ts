import { create } from 'zustand'

/** 목록 화면 상태(필터·페이지·뷰) — 상세 갔다 돌아와도 유지되도록 페이지 밖(스토어)에 보관.
 *  페이지 모듈 스코프에서 `createListStore<Filters>()`로 싱글톤 생성해 사용. */
export interface ListState<F extends object> {
  filters: F
  page: number
  view: '카드' | '표'
  setFilters: (f: F) => void
  setPage: (p: number) => void
  setView: (v: '카드' | '표') => void
}

export function createListStore<F extends object>() {
  return create<ListState<F>>((set) => ({
    filters: {} as F,
    page: 0,
    view: '카드',
    // 필터 바뀌면 1페이지로 (다른 페이지에 머물러 빈 목록 뜨는 것 방지)
    setFilters: (filters) => set({ filters, page: 0 }),
    setPage: (page) => set({ page }),
    setView: (view) => set({ view }),
  }))
}
