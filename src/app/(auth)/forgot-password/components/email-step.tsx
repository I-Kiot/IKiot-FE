"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendForgotPasswordOtp, type OtpChallenge } from "@/lib/api/auth";
import { getApiErrorBody } from "@/lib/api/error-codes";
import {
  forgotPasswordEmailSchema,
  type ForgotPasswordEmailInput,
} from "@/lib/validation";

interface EmailStepProps {
  defaultEmail: string;
  /** Lý do người dùng bị đưa về bước này (phiên đặt lại hết hạn...). */
  notice: string | null;
  onSent: (email: string, challenge: OtpChallenge) => void;
  className?: string;
}

/** Bước 1: nhập email, gửi mã OTP tới email đó. */
export function EmailStep({ defaultEmail, notice, onSent, className }: EmailStepProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordEmailInput>({
    resolver: zodResolver(forgotPasswordEmailSchema),
    defaultValues: { email: defaultEmail },
  });

  const onSubmit = async ({ email }: ForgotPasswordEmailInput) => {
    try {
      onSent(email, await sendForgotPasswordOtp(email));
    } catch (error) {
      const body = getApiErrorBody(error);
      // Lỗi của chính ô email: hiện dưới ô để người dùng sửa, không chỉ toast.
      if (body?.code === "PHONE_NOT_REGISTERED") {
        setError("email", {
          message: "Email này chưa được đăng ký hoặc tài khoản đã bị khóa.",
        });
        return;
      }
      toast.error(body?.message || "Không gửi được mã OTP. Vui lòng thử lại.");
    }
  };

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Quên mật khẩu?</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Nhập email của tài khoản, chúng tôi sẽ gửi mã xác minh gồm 6 chữ số
          tới email đó
        </p>
      </div>
      {notice && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      )}
      <div className="grid gap-6">
        <div className="grid gap-3">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="ten@vidu.com"
            disabled={isSubmitting}
            aria-invalid={!!errors.email}
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs font-medium text-destructive">
              {errors.email.message}
            </p>
          )}
        </div>
        <Button type="submit" className="w-full cursor-pointer" disabled={isSubmitting}>
          {isSubmitting ? "Đang gửi..." : "Gửi mã xác minh"}
        </Button>
      </div>
      <div className="text-center text-sm">
        Nhớ mật khẩu rồi?{" "}
        <Link href="/sign-in" className="underline underline-offset-4">
          Quay lại đăng nhập
        </Link>
      </div>
    </form>
  );
}
