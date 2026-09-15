// [UI Types – Customer]
import { z } from 'zod'

export type CustomersDialogType = 'add' | 'edit' | 'delete' | 'deleteMany'

export const customerFormSchema = z.object({
  name: z.string().min(1, 'Tên khách hàng là bắt buộc'),
  // Để trống thì BE tự sinh (KH000001, KH000002, ...).
  customerCode: z.string().optional(),
  phone: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  address: z.string().optional(),
  dob: z.string().optional(),
})

export type CustomerFormValues = z.infer<typeof customerFormSchema>
