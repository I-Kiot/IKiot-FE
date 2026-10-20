'use client'

import { useEffect, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { productApi } from '@/lib/api/product'
import { ItemThumbnail } from './item-thumbnail'
import type {
  ComboComponent,
  ComboComponentPayload,
  ProductItemListEntry,
  ProductItemType,
} from '@/types/product'

/** Một dòng thành phần trên form: id + số lượng gửi lên, kèm nhãn để hiển thị. */
export interface ComboComponentRow {
  componentItemId: string
  quantity: number
  sku: string
  productName: string
  itemType: ProductItemType
  thumbnailUrl?: string | null
}

export function toComboRows(components: ComboComponent[] | undefined): ComboComponentRow[] {
  return (components ?? []).map(({ quantity, componentItem }) => ({
    componentItemId: componentItem.id,
    quantity,
    sku: componentItem.sku,
    productName: componentItem.productName,
    itemType: componentItem.itemType,
    thumbnailUrl: componentItem.thumbnailUrl,
  }))
}

/** Khớp `MAX_COMBO_COMPONENT_QUANTITY` của BE. */
const MAX_COMBO_COMPONENT_QUANTITY = 999

/** Có món nào có số lượng ngoài 1…999 (để trống = 0) - form chặn lưu khi đúng. */
export function hasInvalidQuantity(rows: ComboComponentRow[]): boolean {
  return rows.some((row) => !(row.quantity >= 1 && row.quantity <= MAX_COMBO_COMPONENT_QUANTITY))
}

export function toComboPayload(rows: ComboComponentRow[]): ComboComponentPayload[] {
  return rows.map(({ componentItemId, quantity }) => ({ componentItemId, quantity }))
}

type Props = {
  value: ComboComponentRow[]
  onChange: (rows: ComboComponentRow[]) => void
  /** Phiên bản đang sửa - không cho tự chọn chính nó. BE vẫn chặn vòng lặp qua combo khác. */
  selfId?: string
}

/** Chọn các món của combo và số lượng mỗi món. Món chọn được có thể là combo khác (combo lồng nhau). */
export function ComboComponentsField({ value, onChange, selfId }: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [options, setOptions] = useState<ProductItemListEntry[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        // Lọc hàng đã ngừng ở BE để giới hạn 20 dòng áp lên hàng chọn được.
        const rows = await productApi.listItems({
          search: search.trim() || undefined,
          limit: 20,
          excludeDiscontinued: true,
        })
        if (!cancelled) setOptions(rows)
      } catch {
        if (!cancelled) setOptions([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 300)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [open, search])

  const chosen = new Set(value.map((row) => row.componentItemId))
  // Hàng đã ngừng kinh doanh đã bị lọc ở BE (`excludeDiscontinued`). Dịch vụ (VD: lắp đặt) được làm món combo.
  const selectable = options.filter((option) => option.id !== selfId && !chosen.has(option.id))

  function add(option: ProductItemListEntry) {
    onChange([
      ...value,
      {
        componentItemId: option.id,
        quantity: 1,
        sku: option.sku,
        productName: option.productName,
        itemType: option.itemType,
        thumbnailUrl: option.thumbnailUrl,
      },
    ])
    setOpen(false)
    setSearch('')
  }

  function setQuantity(index: number, quantity: number) {
    onChange(value.map((row, i) => (i === index ? { ...row, quantity } : row)))
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>
          Thành phần combo <span className="text-destructive">*</span>
        </Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" size="sm" className="h-7 cursor-pointer text-xs">
              <Plus className="mr-1 size-3.5" />
              Thêm món
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Tìm theo tên, SKU, mã hàng..."
                value={search}
                onValueChange={setSearch}
              />
              <CommandList>
                <CommandEmpty>{loading ? 'Đang tìm...' : 'Không tìm thấy mặt hàng'}</CommandEmpty>
                <CommandGroup>
                  {selectable.map((option) => (
                    <CommandItem key={option.id} value={option.id} onSelect={() => add(option)}>
                      <ItemThumbnail url={option.thumbnailUrl} alt={option.productName} />
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate">{option.productName}</span>
                        <span className="text-xs text-muted-foreground">{option.sku}</span>
                      </div>
                      {option.itemType === 'COMBO' && <Badge variant="secondary">Combo</Badge>}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {value.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Chọn các món trong bộ, VD: 1 bàn + 4 ghế. Có thể chọn cả combo khác (VD: phòng ngủ = bộ giường + tủ).
        </p>
      ) : (
        <div className="space-y-2">
          {value.map((row, index) => (
            <div key={row.componentItemId} className="flex items-center gap-2">
              <ItemThumbnail url={row.thumbnailUrl} alt={row.productName} />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="flex items-center gap-2 truncate text-sm">
                  {row.productName}
                  {row.itemType === 'COMBO' && <Badge variant="secondary">Combo</Badge>}
                </span>
                <span className="text-xs text-muted-foreground">{row.sku}</span>
              </div>
              <QuantityInput value={row.quantity} onCommit={(quantity) => setQuantity(index, quantity)} />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 cursor-pointer text-muted-foreground hover:text-destructive"
                onClick={() => onChange(value.filter((_, i) => i !== index))}
              >
                <X className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Ô số lượng giữ chuỗi người đang gõ, để xoá trắng rồi gõ lại được (ép về 1 ngay khi rỗng làm
 * "1" → xoá → gõ "4" thành 14). Ô trống đẩy lên 0 - form thấy không hợp lệ và chặn lưu
 * (`hasInvalidQuantity`), nên không bao giờ lưu một số người dùng không còn thấy. Rời ô khi còn
 * trống thì trả lại số hợp lệ gần nhất.
 */
function QuantityInput({ value, onCommit }: { value: number; onCommit: (quantity: number) => void }) {
  const [draft, setDraft] = useState(value >= 1 ? String(value) : '')
  const [lastValue, setLastValue] = useState(value)
  const [lastValid, setLastValid] = useState(value >= 1 ? value : 1)
  // Giá trị đổi từ ngoài (nạp lại form) thì hiện theo - điều chỉnh state lúc render, không dùng effect.
  if (value !== lastValue) {
    setLastValue(value)
    setDraft(value >= 1 ? String(value) : '')
    if (value >= 1) setLastValid(value)
  }

  const commit = (quantity: number) => {
    setLastValue(quantity)
    if (quantity >= 1) setLastValid(quantity)
    onCommit(quantity)
  }

  return (
    <Input
      inputMode="numeric"
      aria-label="Số lượng"
      aria-invalid={!(Number(draft) >= 1)}
      className="w-20 tabular-nums"
      value={draft}
      onChange={(e) => {
        // Tối đa 3 chữ số = MAX_COMBO_COMPONENT_QUANTITY (999) ở BE.
        const digits = e.target.value.replace(/\D/g, '').slice(0, 3)
        setDraft(digits)
        commit(Number(digits) || 0)
      }}
      onBlur={() => {
        if (Number(draft) >= 1) return
        setDraft(String(lastValid))
        commit(lastValid)
      }}
    />
  )
}
