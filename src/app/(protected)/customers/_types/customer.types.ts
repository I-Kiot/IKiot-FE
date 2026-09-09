// [UI Types – Customer]
import { z } from 'zod'

export type CustomersDialogType = 'add' | 'edit' | 'delete' | 'deleteMany'

export const customerFormSchema = z.object({
  name: z.string().min(1, 'Tên khách hàng là bắt buộc'),
  customerCode: z.string().min(1, 'Mã khách hàng là bắt buộc'),
  phone: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  address: z.string().optional(),
  dob: z.string().optional(),
})

export type CustomerFormValues = z.infer<typeof customerFormSchema>
