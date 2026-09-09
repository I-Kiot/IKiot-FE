// [UI Types – Supplier]
import { z } from 'zod'

export type SuppliersDialogType = 'add' | 'edit' | 'delete' | 'deleteMany' | 'payDebt'

export const supplierFormSchema = z.object({
  supplierName: z.string().min(1, 'Tên nhà cung cấp là bắt buộc'),
  contactName: z.string().optional(),
  phoneNumber: z.string().optional(),
  email: z
    .string()
    .optional()
    .refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
      message: 'Email không hợp lệ',
    }),
  address: z.string().optional(),
  creditLimit: z.number().min(0, 'Hạn mức tín dụng không được âm'),
})

export type SupplierFormValues = z.infer<typeof supplierFormSchema>
