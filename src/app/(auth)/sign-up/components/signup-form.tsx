"use client";

import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { signupSchema, SignupInput } from "@/lib/validation";
import {
  registerUser,
  resendOtp,
  verifyLoginOtp,
  checkRegistrationAvailability,
  type OtpChallenge,
} from "@/lib/api/auth";
import { OtpStep } from "@/components/otp-step";
import { setTokens } from "@/lib/auth";
import { assignFreeTrial } from "@/lib/api/subscription";
import { useAuthStore } from "@/store/auth-store";

export function SignupForm2({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [challenge, setChallenge] = useState<OtpChallenge | null>(null);
  const router = useRouter();
  const planParam = useSearchParams().get("plan");
  const pendingPlan = planParam && planParam !== "TRIAL" ? planParam : null;

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phoneNumber: "",
      email: "",
      password: "",
      confirmPassword: "",
      tenantName: "",
      terms: false,
    },
  });

  // Bước cuối: nhập đúng mã OTP gửi qua email thì backend kích hoạt tài khoản và cấp phiên.
  const completeSignup = async (otpCode: string) => {
    if (!challenge) return;
    const { accessToken, refreshToken } = await verifyLoginOtp(
      challenge.challengeToken,
      otpCode,
    );

    if (!accessToken) {
      toast.success("Đăng ký tài khoản thành công! Vui lòng đăng nhập.");
      router.push("/sign-in");
      return;
    }

    setTokens({ accessToken, refreshToken });
    // Lấy thông tin profile chi tiết của user
    await useAuthStore.getState().fetchMe();

    // Gọi API đăng ký gói dùng thử
    try {
      await assignFreeTrial();
      toast.success(
        "Đăng ký tài khoản và kích hoạt dùng thử 7 ngày thành công!",
      );
    } catch (subError) {
      console.error("Failed to assign free trial:", subError);
      toast.warning(
        "Đăng ký thành công nhưng không thể kích hoạt dùng thử tự động.",
      );
    }

    // Chọn gói trả phí từ landing → sang thẳng trang thanh toán để nâng cấp.
    if (pendingPlan) {
      router.push(`/settings/billing?plan=${encodeURIComponent(pendingPlan)}`);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  const checkAvailability = async (data: SignupInput): Promise<boolean> => {
    setIsChecking(true);
    try {
      const { phoneNumberTaken, emailTaken, tenantNameTaken } =
        await checkRegistrationAvailability({
          phoneNumber: data.phoneNumber,
          email: data.email,
          tenantName: data.tenantName,
        });

      if (phoneNumberTaken) {
        setError("phoneNumber", {
          message: "Số điện thoại đã được sử dụng.",
        });
        toast.error("Số điện thoại đã được sử dụng.");
      }
      if (emailTaken) {
        setError("email", { message: "Email đã được sử dụng." });
        toast.error("Email đã được sử dụng.");
      }
      if (tenantNameTaken) {
        setError("tenantName", {
          message: "Tên cửa hàng đã tồn tại. Vui lòng chọn tên khác.",
        });
        toast.error("Tên cửa hàng đã tồn tại. Vui lòng chọn tên khác.");
      }

      return !phoneNumberTaken && !emailTaken && !tenantNameTaken;
    } catch (error) {
      console.error("Availability check error:", error);
      toast.error("Không kiểm tra được thông tin. Vui lòng thử lại.");
      return false;
    } finally {
      setIsChecking(false);
    }
  };

  // Bước 1: kiểm tra trùng, tạo tài khoản (chưa kích hoạt) rồi chuyển sang bước nhập OTP.
  const onSubmit = async (data: SignupInput) => {
    const isAvailable = await checkAvailability(data);
    if (!isAvailable) return;

    setIsLoading(true);
    try {
      const result = await registerUser(data);
      setChallenge(result);
    } catch (error) {
      console.error("Signup error:", error);
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (challenge) {
    return (
      <OtpStep
        className={className}
        title="Xác minh email"
        submitLabel="Xác nhận & Đăng ký"
        delivery={challenge}
        onSubmit={completeSignup}
        onResend={() => resendOtp(challenge.challengeToken)}
        onBack={() => setChallenge(null)}
      />
    );
  }

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={handleSubmit(onSubmit)}
      {...props}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Đăng ký tài khoản iKiot</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Tạo tài khoản quản lý chuỗi cửa hàng của bạn ngay hôm nay
        </p>
      </div>

      <div className="grid gap-5">
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground border-b pb-1">
            1. Thông tin cá nhân
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="firstName">Họ</Label>
              <Input
                id="firstName"
                placeholder="Nguyễn"
                disabled={isLoading}
                {...register("firstName")}
              />
              {errors.firstName && (
                <p className="text-xs font-medium text-destructive">
                  {errors.firstName.message}
                </p>
              )}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="lastName">Tên</Label>
              <Input
                id="lastName"
                placeholder="Văn A"
                disabled={isLoading}
                {...register("lastName")}
              />
              {errors.lastName && (
                <p className="text-xs font-medium text-destructive">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="phoneNumber">Số điện thoại đăng nhập</Label>
            <Input
              id="phoneNumber"
              type="tel"
              placeholder="0912345678"
              disabled={isLoading}
              {...register("phoneNumber")}
            />
            {errors.phoneNumber && (
              <p className="text-xs font-medium text-destructive">
                {errors.phoneNumber.message}
              </p>
            )}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="email">Email (nhận mã xác minh)</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="ten@congty.vn"
              disabled={isLoading}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs font-medium text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                type="password"
                placeholder="Nhập mật khẩu"
                disabled={isLoading}
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs font-medium text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Nhập lại mật khẩu"
                disabled={isLoading}
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && (
                <p className="text-xs font-medium text-destructive">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground border-b pb-1">
            2. Thông tin cửa hàng / doanh nghiệp
          </h2>
          <div className="grid gap-1.5">
            <Label htmlFor="tenantName">Tên cửa hàng</Label>
            <Input
              id="tenantName"
              placeholder="iKiot Store"
              disabled={isLoading}
              {...register("tenantName")}
            />
            {errors.tenantName && (
              <p className="text-xs font-medium text-destructive">
                {errors.tenantName.message}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1 mt-1">
          <div className="flex items-center space-x-2">
            <Controller
              control={control}
              name="terms"
              render={({ field }) => (
                <Checkbox
                  id="terms"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isLoading}
                />
              )}
            />
            <Label
              htmlFor="terms"
              className="text-sm cursor-pointer select-none"
            >
              Tôi đồng ý với{" "}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  toast.info("Điều khoản dịch vụ đang được cập nhật.");
                }}
                className="underline underline-offset-4 hover:text-primary"
              >
                Điều khoản Dịch vụ
              </a>{" "}
              và{" "}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  toast.info("Chính sách bảo mật đang được cập nhật.");
                }}
                className="underline underline-offset-4 hover:text-primary"
              >
                Chính sách Bảo mật
              </a>
            </Label>
          </div>
          {errors.terms && (
            <p className="text-xs font-medium text-destructive mt-1">
              {errors.terms.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full cursor-pointer mt-1"
          disabled={isChecking || isLoading}
        >
          {isChecking
            ? "Đang kiểm tra thông tin..."
            : isLoading
              ? "Đang xử lý..."
              : "Tiếp tục & nhận mã OTP"}
        </Button>
      </div>

      <div className="text-center text-sm">
        Đã có tài khoản?{" "}
        <a href="/sign-in" className="underline underline-offset-4">
          Đăng nhập ngay
        </a>
      </div>
    </form>
  );
}
