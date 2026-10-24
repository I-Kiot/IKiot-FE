'use client'

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ProductType } from '@/types/product'
import { PRODUCT_TYPE_LABELS } from '../_constants/product-screen'

const TYPE_HINTS: Partial<Record<ProductType, string>> = {
  SERVICE: 'Dịch vụ (lắp đặt, vận chuyển...) không có tồn kho. Không đổi được loại sau khi tạo.',
}

/**
 * Loại sản phẩm - chỉ chọn lúc tạo, BE không cho đổi sau (sản phẩm đã có tồn không thể thành combo).
 * Mọi phiên bản theo loại này. Chỉ một lựa chọn (màn combo) thì không hiện ô chọn, chỉ hiện ghi chú.
 */
export function ProductTypeSelect({
  value,
  options,
  onChange,
}: {
  value: ProductType
  options: ProductType[]
  onChange: (value: ProductType) => void
}) {
  const hint = TYPE_HINTS[value] && <p className="text-xs text-muted-foreground">{TYPE_HINTS[value]}</p>
  if (options.length < 2) return hint ?? null

  return (
    <div className="space-y-2">
      <Label>Loại</Label>
      <Select value={value} onValueChange={(v) => onChange(v as ProductType)}>
        <SelectTrigger className="w-full cursor-pointer">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((type) => (
            <SelectItem key={type} value={type}>
              {PRODUCT_TYPE_LABELS[type]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hint}
    </div>
  )
}
