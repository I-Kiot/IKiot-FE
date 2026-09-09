// [Component – Empty State Promotion]
import { Ticket } from 'lucide-react'

export function PromotionsEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Ticket className="size-12 text-muted-foreground/40 mb-4" />
      <p className="text-sm font-medium text-muted-foreground">Không tìm thấy khuyến mãi nào</p>
      <p className="text-xs text-muted-foreground mt-1">
        Thử thay đổi bộ lọc hoặc thêm chương trình khuyến mãi mới
      </p>
    </div>
  )
}
