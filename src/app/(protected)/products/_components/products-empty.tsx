import { Package } from 'lucide-react'

export function ProductsEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Package className="size-12 text-muted-foreground/40 mb-4" />
      <p className="text-sm font-medium text-muted-foreground">Không tìm thấy hàng hóa nào</p>
      <p className="text-xs text-muted-foreground mt-1">
        Thử thay đổi bộ lọc hoặc thêm hàng hóa mới
      </p>
    </div>
  )
}
