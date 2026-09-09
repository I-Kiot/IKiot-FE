// [Component – Empty State Supplier]
import { Truck } from 'lucide-react'

export function SuppliersEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Truck className="size-12 text-muted-foreground/40 mb-4" />
      <p className="text-sm font-medium text-muted-foreground">Không tìm thấy nhà cung cấp nào</p>
      <p className="text-xs text-muted-foreground mt-1">
        Thử thay đổi bộ lọc hoặc thêm nhà cung cấp mới
      </p>
    </div>
  )
}
