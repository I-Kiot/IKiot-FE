import { useMemo, useState } from 'react'

export type SortDir = 'asc' | 'desc'

/** Sắp xếp một danh sách theo cột đang chọn; bấm lại cùng cột thì đảo chiều. */
export function useSorted<T, K extends string>(
  items: readonly T[],
  accessors: Record<K, (item: T) => number | string | null>,
  initial: { key: NoInfer<K>; dir: SortDir },
) {
  const [sort, setSort] = useState<{ key: K; dir: SortDir }>(initial)

  const sorted = useMemo(() => {
    const read = accessors[sort.key]
    const sign = sort.dir === 'asc' ? 1 : -1
    return [...items].sort((a, b) => {
      const x = read(a)
      const y = read(b)
      // Ô trống luôn nằm cuối, dù sắp chiều nào.
      if (x === null) return 1
      if (y === null) return -1
      return (x < y ? -1 : x > y ? 1 : 0) * sign
    })
    // accessors là hằng số khai báo cùng component gọi.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, sort])

  const toggle = (key: K) =>
    setSort((prev) => (prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' }))

  return { sorted, sort, toggle }
}
