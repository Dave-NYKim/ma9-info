export interface CodeRow {
  category: string
  code: string
  label: string | null
  parent: string | null
  sort_order: number | null
}

/** category → rows */
export type CodeMap = Record<string, CodeRow[]>
