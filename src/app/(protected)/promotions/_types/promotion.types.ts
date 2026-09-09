// [UI Types – Promotion]
import { z } from 'zod'

export type PromotionsDialogType = 'add' | 'edit' | 'delete' | 'deleteMany'

export const promotionFormSchema = z
  .object({
    promoName: z.string().min(1, 'Tên chương trình là bắt buộc'),
    description: z.string().optional(),
    branchIds: z.array(z.string()),
    discountType: z.enum(['PERCENT', 'FIXED_AMOUNT']),
    discountValue: z.number().gt(0, 'Giá trị giảm phải lớn hơn 0'),
    maxDiscountAmount: z.number().nullable(),
    minOrderValue: z.number().min(0, 'Giá trị đơn tối thiểu không được âm'),
    applicableRuleType: z.enum(['all', 'category', 'product']),
    categoryIds: z.array(z.string()),
    productItemIds: z.array(z.string()),
    startDate: z.string().min(1, 'Ngày bắt đầu là bắt buộc'),
    endDate: z.string().min(1, 'Ngày kết thúc là bắt buộc'),
    stackable: z.boolean(),
    usageLimit: z.number().int().min(1).nullable(),
    usageLimitPerCustomer: z.number().int().min(1).nullable(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.discountType === 'PERCENT' && data.discountValue > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['discountValue'],
        message: 'Phần trăm giảm giá không được vượt quá 100',
      })
    }
    if (data.maxDiscountAmount != null && data.discountType !== 'PERCENT') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['maxDiscountAmount'],
        message: 'Chỉ áp dụng mức giảm tối đa cho loại giảm theo %',
      })
    }
    if (data.applicableRuleType === 'category' && data.categoryIds.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['categoryIds'],
        message: 'Chọn ít nhất một danh mục áp dụng',
      })
    }
    if (data.applicableRuleType === 'product' && data.productItemIds.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['productItemIds'],
        message: 'Chọn ít nhất một sản phẩm áp dụng',
      })
    }
    if (data.startDate && data.endDate && new Date(data.endDate) <= new Date(data.startDate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endDate'],
        message: 'Ngày kết thúc phải sau ngày bắt đầu',
      })
    }
  })

export type PromotionFormValues = z.infer<typeof promotionFormSchema>
