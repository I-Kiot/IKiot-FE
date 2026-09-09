// [Component – Empty State Category]
import { FolderOpen } from 'lucide-react'

export function CategoriesEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <FolderOpen className="size-12 text-muted-foreground/40 mb-4" />
      <p className="text-sm font-medium text-muted-foreground">Không tìm thấy danh mục nào</p>
      <p className="text-xs text-muted-foreground mt-1">
        Thử thay đổi bộ lọc hoặc thêm danh mục mới
      </p>
    </div>
  )
}
