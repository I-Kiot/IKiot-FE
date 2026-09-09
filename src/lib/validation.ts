import { z } from "zod";

export const loginSchema = z.object({
  phone: z.string().regex(/^[0-9+]{9,15}$/, { message: "Vui lòng nhập số điện thoại hợp lệ (9-15 ký tự)." }),
  password: z.string().min(6, { message: "Mật khẩu phải chứa ít nhất 6 ký tự." }),
});

export const signupSchema = z.object({
  firstName: z.string().min(1, { message: "Vui lòng nhập họ." }),
  lastName: z.string().min(1, { message: "Vui lòng nhập tên." }),
  phoneNumber: z.string().regex(/^[0-9+]{9,15}$/, { message: "Vui lòng nhập số điện thoại hợp lệ (9-15 ký tự)." }),
  password: z.string().min(6, { message: "Mật khẩu phải chứa ít nhất 6 ký tự." }),
  confirmPassword: z.string().min(6, { message: "Mật khẩu phải chứa ít nhất 6 ký tự." }),
  tenantName: z.string().min(1, { message: "Vui lòng nhập tên cửa hàng/doanh nghiệp." }),
  terms: z.boolean().refine((val) => val === true, {
    message: "Bạn phải đồng ý với Điều khoản và Chính sách.",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp.",
  path: ["confirmPassword"],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;


