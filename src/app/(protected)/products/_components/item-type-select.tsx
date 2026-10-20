'use client'

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ProductItemType } from '@/types/product'

export const ITEM_TYPE_LABELS: Record<ProductItemType, string> = {
  PRODUCT: 'Hàng hoá',
  COMBO: 'Combo (bộ sản phẩm)',
  SERVICE: 'Dịch vụ',
}

/** Loại phiên bản - chỉ chọn lúc tạo, BE không cho đổi sau (phiên bản đã có tồn không thể thành combo). */
export function ItemTypeSelect({
  value,
  onChange,
}: {
  value: ProductItemType
  onChange: (value: ProductItemType) => void
}) {
  return (
    <div className="space-y-2">
      <Label>Loại</Label>
      <Select value={value} onValueChange={(v) => onChange(v as ProductItemType)}>
        <SelectTrigger className="w-full cursor-pointer">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(ITEM_TYPE_LABELS) as ProductItemType[]).map((type) => (
            <SelectItem key={type} value={type}>
              {ITEM_TYPE_LABELS[type]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {value === 'COMBO' && (
        <p className="text-xs text-muted-foreground">
          Combo không có tồn kho riêng: khi bán, đơn tự tách thành từng món và trừ kho theo món. Không đổi được loại sau khi tạo.
        </p>
      )}
      {value === 'SERVICE' && (
        <p className="text-xs text-muted-foreground">Dịch vụ (lắp đặt, vận chuyển...) không có tồn kho.</p>
      )}
    </div>
  )
}
