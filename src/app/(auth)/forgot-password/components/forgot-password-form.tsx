"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OtpStep } from "@/components/otp-step";
import {
  resendOtp,
  resetPassword,
  sendForgotPasswordOtp,
  verifyForgotPasswordOtp,
  type OtpChallenge,
} from "@/lib/api/auth";
import { getApiErrorBody } from "@/lib/api/error-codes";

const identifierSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, { message: "Vui lòng nhập số điện thoại hoặc email." }),
});

const passwordSchema = z
  .object({
    newPassword: z
      .string()
      .min(6, { message: "Mật khẩu phải chứa ít nhất 6 ký tự." }),
    confirmPassword: z.string().min(1, { message: "Vui lòng nhập lại mật khẩu." }),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp.",
    path: ["confirmPassword"],
  });

type IdentifierInput = z.infer<typeof identifierSchema>;
type PasswordInput = z.infer<typeof passwordSchema>;

/** Quên mật khẩu: nhập SĐT/email → nhập OTP → đặt mật khẩu mới. */
export function ForgotPasswordForm2({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter();
  const [challenge, setChallenge] = useState<OtpChallenge | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);

  const identifierForm = useForm<IdentifierInput>({
    resolver: zodResolver(identifierSchema),
    defaultValues: { identifier: "" },
  });
  const passwordForm = useForm<PasswordInput>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const onSendOtp = async ({ identifier }: IdentifierInput) => {
    try {
      setChallenge(await sendForgotPasswordOtp(identifier));
    } catch (error) {
      toast.error(
        getApiErrorBody(error)?.message ||
          "Không gửi được mã OTP. Vui lòng thử lại.",
      );
    }
  };

  const onVerifyOtp = async (otpCode: string) => {
    if (!challenge) return;
    setResetToken(await verifyForgotPasswordOtp(challenge.challengeToken, otpCode));
  };

  const onResetPassword = async ({ newPassword }: PasswordInput) => {
    if (!resetToken) return;
    try {
      await resetPassword(resetToken, newPassword);
      toast.success("Đặt lại mật khẩu thành công. Vui lòng đăng nhập.");
      router.push("/sign-in");
    } catch (error) {
      const body = getApiErrorBody(error);
      toast.error(body?.message || "Không đặt lại được mật khẩu. Vui lòng thử lại.");
      // Token hết hạn hoặc đã dùng: phải xin mã mới từ đầu.
      if (
        body?.code === "RESET_TOKEN_INVALID" ||
        body?.code === "RESET_TOKEN_USED" ||
        body?.code === "RESET_TOKEN_WRONG_TYPE"
      ) {
        setResetToken(null);
        setChallenge(null);
      }
    }
  };

  // Bước 3: mật khẩu mới.
  if (resetToken) {
    const { register, handleSubmit, formState } = passwordForm;
    const { errors, isSubmitting } = formState;
    return (
      <form
        className={cn("flex flex-col gap-6", className)}
        onSubmit={handleSubmit(onResetPassword)}
        {...props}
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold">Đặt mật khẩu mới</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Email đã được xác minh. Nhập mật khẩu mới cho tài khoản của bạn.
          </p>
        </div>
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="newPassword">Mật khẩu mới</Label>
            <Input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              disabled={isSubmitting}
              {...register("newPassword")}
            />
            {errors.newPassword && (
              <p className="text-xs font-medium text-destructive">
                {errors.newPassword.message}
              </p>
            )}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              disabled={isSubmitting}
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

  // Bước 2: nhập mã OTP.
  if (challenge) {
    return (
      <OtpStep
        className={className}
        title="Xác minh email"
        submitLabel="Xác nhận"
        delivery={challenge}
        onSubmit={onVerifyOtp}
        onResend={() => resendOtp(challenge.challengeToken)}
        onBack={() => setChallenge(null)}
      />
    );
  }

  // Bước 1: nhập SĐT hoặc email.
  const { register, handleSubmit, formState } = identifierForm;
  const { errors, isSubmitting } = formState;
  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={handleSubmit(onSendOtp)}
      {...props}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Quên mật khẩu?</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Nhập số điện thoại hoặc email của tài khoản, chúng tôi sẽ gửi mã xác
          minh đến email của bạn
        </p>
      </div>
      <div className="grid gap-6">
        <div className="grid gap-3">
          <Label htmlFor="identifier">Số điện thoại hoặc email</Label>
          <Input
            id="identifier"
            type="text"
            autoComplete="username"
            placeholder="Nhập số điện thoại hoặc email"
            disabled={isSubmitting}
            {...register("identifier")}
          />
          {errors.identifier && (
            <p className="text-xs font-medium text-destructive">
              {errors.identifier.message}
            </p>
          )}
        </div>
        <Button type="submit" className="w-full cursor-pointer" disabled={isSubmitting}>
          {isSubmitting ? "Đang gửi..." : "Gửi mã xác minh"}
        </Button>
      </div>
      <div className="text-center text-sm">
        Nhớ mật khẩu rồi?{" "}
        <a href="/sign-in" className="underline underline-offset-4">
          Quay lại đăng nhập
        </a>
      </div>
    </form>
  );
}
