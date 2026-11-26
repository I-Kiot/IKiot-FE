"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/password-input";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validation";

interface NewPasswordStepProps {
  email: string;
  /** Gọi API đặt lại; cha tự xử lý lỗi và chuyển bước. */
  onSubmit: (newPassword: string) => Promise<void>;
  className?: string;
}

/** Bước 3: nhập mật khẩu mới + xác nhận. */
export function NewPasswordStep({ email, onSubmit, className }: NewPasswordStepProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={handleSubmit(({ newPassword }) => onSubmit(newPassword))}
      noValidate
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Đặt mật khẩu mới</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Email <span className="font-medium text-foreground">{email}</span> đã
          được xác minh. Nhập mật khẩu mới cho tài khoản của bạn.
        </p>
      </div>
      {/* Giúp trình quản lý mật khẩu lưu đúng tài khoản. */}
      <input type="email" autoComplete="username" value={email} readOnly hidden />
      <div className="grid gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="newPassword">Mật khẩu mới</Label>
          <PasswordInput
            id="newPassword"
            autoComplete="new-password"
            placeholder="Ít nhất 6 ký tự"
            disabled={isSubmitting}
            aria-invalid={!!errors.newPassword}
            autoFocus
            {...register("newPassword")}
          />
          {errors.newPassword && (
            <p className="text-xs font-medium text-destructive">
              {errors.newPassword.message}
            </p>
          )}
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            placeholder="Nhập lại mật khẩu mới"
            disabled={isSubmitting}
            aria-invalid={!!errors.confirmPassword}
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="text-xs font-medium text-destructive">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>
        <Button type="submit" className="w-full cursor-pointer" disabled={isSubmitting}>
          {isSubmitting ? "Đang xử lý..." : "Đặt lại mật khẩu"}
        </Button>
      </div>
    </form>
  );
}
