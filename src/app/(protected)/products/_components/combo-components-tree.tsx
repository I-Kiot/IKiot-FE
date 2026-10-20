'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { productApi } from '@/lib/api/product'
import { cn } from '@/lib/utils'
import type { ComboComponent } from '@/types/product'
import { ItemThumbnail } from './item-thumbnail'

/** Khớp MAX_COMBO_DEPTH của BE - BE đã chặn sâu hơn, đây chỉ là chốt chống lặp vô hạn khi dữ liệu lạ. */
const MAX_DEPTH = 5

/** Cây thành phần của combo. Thành phần là combo thì bấm để mở, tải bằng GET /products/:productId của nó. */
export function ComboComponentsTree({
  components,
  depth = 1,
}: {
  components: ComboComponent[]
  depth?: number
}) {
  return (
    <ul className={cn('space-y-1', depth > 1 && 'ml-5 border-l pl-3')}>
      {components.map((component) => (
        <ComboNode key={component.componentItem.id} component={component} depth={depth} />
      ))}
    </ul>
  )
}

function ComboNode({ component, depth }: { component: ComboComponent; depth: number }) {
  const { componentItem, quantity } = component
  const isCombo = componentItem.itemType === 'COMBO'
  const [open, setOpen] = useState(false)
  const [children, setChildren] = useState<ComboComponent[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)

  async function toggle() {
    if (!isCombo || depth >= MAX_DEPTH) return
    const next = !open
    setOpen(next)
    if (!next || children) return
    setLoading(true)
    setFailed(false)
    try {
      const product = await productApi.getById(componentItem.productId)
      const item = product.items.find((row) => row.id === componentItem.id)
      setChildren(item?.comboComponents ?? [])
    } catch {
      setFailed(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <li>
      <button
        type="button"
        onClick={toggle}
        disabled={!isCombo}
        className={cn(
          'flex w-full items-center gap-2 rounded-md px-1 py-1 text-left text-sm',
          isCombo && 'cursor-pointer hover:bg-muted',
        )}
      >
        <span className="flex size-4 shrink-0 items-center justify-center text-muted-foreground">
          {isCombo && (loading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : open ? (
            <ChevronDown className="size-3.5" />
          ) : (
            <ChevronRight className="size-3.5" />
          ))}
        </span>
        <ItemThumbnail url={componentItem.thumbnailUrl} alt={componentItem.productName} className="size-8" />
        <span className="min-w-0 flex-1 truncate">
          {componentItem.productName}
          <span className="ml-2 font-mono text-xs text-muted-foreground">{componentItem.sku}</span>
        </span>
        {isCombo && <Badge variant="secondary">Combo</Badge>}
        <span className="shrink-0 tabular-nums text-muted-foreground">× {quantity}</span>
      </button>
      {open && failed && (
        <p className="ml-6 text-xs text-destructive">Không tải được thành phần của combo này</p>
      )}
      {open && children && <ComboComponentsTree components={children} depth={depth + 1} />}
    </li>
  )
}
