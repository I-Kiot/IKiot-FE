'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ItemThumbnail } from './item-thumbnail'
import type { ComboComponent } from '@/types/product'

/** Số bộ combo mà riêng thành phần này đủ cho. Dịch vụ không có tồn nên không giới hạn (null). */
function setsCovered(part: ComboComponent): number | null {
  const { componentItem, quantity } = part
  if (componentItem.itemType === 'SERVICE') return null
  return Math.floor(Math.max(0, componentItem.availableStock ?? 0) / quantity)
}

/**
 * Tồn của từng thành phần trong combo, để biết vì sao combo còn / hết hàng. Combo bán được bằng số
 * bộ của thành phần khan nhất (khớp `comboSetsAvailable` ở BE); thành phần đó được tô nổi.
 * Thành phần là combo lồng thì `availableStock` của nó chính là số bộ của combo con.
 */
export function ComboStockList({ components }: { components: ComboComponent[] }) {
  const covered = components.map(setsCovered)
  const limits = covered.filter((n): n is number => n !== null)
  const scarcest = limits.length > 0 ? Math.min(...limits) : null

  return (
    <ul className="divide-y rounded-lg border">
      {components.map((part, index) => {
        const { componentItem, quantity } = part
        const isService = componentItem.itemType === 'SERVICE'
        const sets = covered[index]
        const isLimit = sets !== null && sets === scarcest
        const available = componentItem.availableStock ?? 0
        return (
          <li
            key={componentItem.id}
            className={cn('flex items-center gap-3 px-3 py-2 text-sm', isLimit && 'bg-muted/50')}
          >
            <ItemThumbnail url={componentItem.thumbnailUrl} alt={componentItem.productName} className="size-9" />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="flex min-w-0 items-center gap-2">
                <span className="truncate font-medium">{componentItem.productName}</span>
                {componentItem.itemType === 'COMBO' && <Badge variant="secondary">Combo</Badge>}
              </span>
              <span className="font-mono text-xs text-muted-foreground">{componentItem.sku}</span>
            </div>
            <span className="w-16 shrink-0 text-right tabular-nums text-muted-foreground">× {quantity}</span>
            {isService ? (
              <span className="w-24 shrink-0 text-right text-xs text-muted-foreground">Dịch vụ</span>
            ) : (
              <div className="flex w-24 shrink-0 flex-col items-end leading-tight">
                <span
                  className={cn(
                    'font-semibold tabular-nums',
                    available === 0
                      ? 'text-destructive'
                      : isLimit
                        ? 'text-orange-500 dark:text-orange-400'
                        : 'text-emerald-600 dark:text-emerald-400',
                  )}
                >
                  {available.toLocaleString('vi-VN')}
                </span>
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
