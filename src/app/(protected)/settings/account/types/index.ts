import { z } from "zod"

export const accountFormSchema = z.object({
  firstName: z.string().min(1, "Vui lòng nhập tên"),
  lastName: z.string().min(1, "Vui lòng nhập họ"),
  email: z.string().email("Địa chỉ email không hợp lệ"),
  username: z.string().min(3, "Số điện thoại phải có ít nhất 3 ký tự"),
  role: z.string().optional(),
  address: z.string().optional(),
  gender: z.string().optional(),
  identificationId: z.string().optional(),
  taxNumber: z.string().optional(),
  dob: z.string().optional(),
})

export type AccountFormValues = z.infer<typeof accountFormSchema>
