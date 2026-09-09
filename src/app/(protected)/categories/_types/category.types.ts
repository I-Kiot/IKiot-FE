// [UI Types – Category]
import { z } from 'zod'

export type CategoriesDialogType = 'add' | 'edit' | 'delete' | 'deleteMany'

export const categoryFormSchema = z.object({
  name: z.string().min(1, 'Tên danh mục là bắt buộc'),
  description: z.string().optional(),
  parentId: z.string().optional().nullable(),
  imageUrl: z.string().optional(),
})

export type CategoryFormValues = z.infer<typeof categoryFormSchema>
