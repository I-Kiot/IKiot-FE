import { z } from "zod";

/** Luật mật khẩu dùng chung cho đăng nhập, đăng ký và đặt lại mật khẩu (BE: `@MinLength(6)`). */
const passwordRule = z.string().min(6, { message: "Mật khẩu phải chứa ít nhất 6 ký tự." });

const emailRule = z
  .string()
  .trim()
  .min(1, { message: "Vui lòng nhập email." })
  .email({ message: "Email không hợp lệ." });

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, { message: "Vui lòng nhập số điện thoại hoặc email." }),
  password: passwordRule,
});

export const signupSchema = z.object({
  firstName: z.string().min(1, { message: "Vui lòng nhập họ." }),
  lastName: z.string().min(1, { message: "Vui lòng nhập tên." }),
  phoneNumber: z.string().regex(/^[0-9+]{9,15}$/, { message: "Vui lòng nhập số điện thoại hợp lệ (9-15 ký tự)." }),
  email: emailRule,
  password: passwordRule,
  confirmPassword: passwordRule,
  tenantName: z.string().min(1, { message: "Vui lòng nhập tên cửa hàng/doanh nghiệp." }),
  terms: z.boolean().refine((val) => val === true, {
    message: "Bạn phải đồng ý với Điều khoản và Chính sách.",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp.",
  path: ["confirmPassword"],
});

/** Quên mật khẩu bước 1: mã OTP gửi tới email của tài khoản. */
export const forgotPasswordEmailSchema = z.object({
  email: emailRule,
});

/** Quên mật khẩu bước 3: cùng luật mật khẩu với đăng ký. */
export const resetPasswordSchema = z
  .object({
    newPassword: passwordRule,
    confirmPassword: z.string().min(1, { message: "Vui lòng nhập lại mật khẩu." }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp.",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ForgotPasswordEmailInput = z.infer<typeof forgotPasswordEmailSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
