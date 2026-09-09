// [UI Types – Brand]
import { z } from 'zod'

export type BrandsDialogType = 'add' | 'edit' | 'delete' | 'deleteMany'

export const brandFormSchema = z.object({
  name: z.string().min(1, 'Tên thương hiệu là bắt buộc'),
  description: z.string().optional(),
  logo: z.string().optional(),
})

export type BrandFormValues = z.infer<typeof brandFormSchema>
