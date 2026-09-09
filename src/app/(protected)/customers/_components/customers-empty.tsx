// [Component – Empty State Customer]
import { Users } from 'lucide-react'

export function CustomersEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Users className="size-12 text-muted-foreground/40 mb-4" />
      <p className="text-sm font-medium text-muted-foreground">Không tìm thấy khách hàng nào</p>
      <p className="text-xs text-muted-foreground mt-1">
        Thử thay đổi bộ lọc hoặc thêm khách hàng mới
      </p>
    </div>
  )
}
