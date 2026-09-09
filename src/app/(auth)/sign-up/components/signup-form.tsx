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
  loginUser,
  checkRegistrationAvailability,
} from "@/lib/api/auth";
import { setTokens } from "@/lib/auth";
import { assignFreeTrial } from "@/lib/api/subscription";
import { useAuthStore } from "@/store/auth-store";
import { usePhoneOtp } from "./hooks/use-phone-otp";

// Skip SMS OTP entirely in local dev (sends "DEV_BYPASS" to the backend).
const OTP_BYPASS = process.env.NEXT_PUBLIC_OTP_BYPASS === "true";

export function SignupForm2({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [otpPhase, setOtpPhase] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [pendingData, setPendingData] = useState<SignupInput | null>(null);
  const router = useRouter();
  const planParam = useSearchParams().get("plan");
  const pendingPlan = planParam && planParam !== "TRIAL" ? planParam : null;
  const { sendOtp, isSending } = usePhoneOtp();

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
      password: "",
      confirmPassword: "",
      tenantName: "",
      terms: false,
    },
  });

  // Final step: create the account. `otpCode` is verified by the backend.
  const completeSignup = async (data: SignupInput, otpCode: string) => {
    setIsLoading(true);
    try {
      // 1. Register the tenant and user account
      await registerUser(data, otpCode);

      // 2. Programmatically login to obtain access/refresh tokens
      const { accessToken, refreshToken } = await loginUser({
        phone: data.phoneNumber,
        password: data.password,
      });

      if (accessToken) {
        setTokens({ accessToken, refreshToken });
        // Fetch detailed user profile
        await useAuthStore.getState().fetchMe();

        // 3. Post to the subscription free trial endpoint
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
          router.push(
            `/settings/billing?plan=${encodeURIComponent(pendingPlan)}`,
          );
        } else {
          router.push("/dashboard");
          router.refresh();
        }
      } else {
        toast.success("Đăng ký tài khoản thành công! Vui lòng đăng nhập.");
        router.push("/sign-in");
      }
    } catch (error) {
      console.error("Signup error:", error);
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const message =
        err.response?.data?.message ||
        err.message ||
        "Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const checkAvailability = async (data: SignupInput): Promise<boolean> => {
    setIsChecking(true);
    try {
      const { phoneNumberTaken, tenantNameTaken } =
        await checkRegistrationAvailability(data.phoneNumber, data.tenantName);

      if (phoneNumberTaken) {
        setError("phoneNumber", {
          message: "Số điện thoại đã được sử dụng.",
        });
        toast.error("Số điện thoại đã được sử dụng.");
      }
      if (tenantNameTaken) {
        setError("tenantName", {
          message: "Tên cửa hàng đã tồn tại. Vui lòng chọn tên khác.",
        });
        toast.error("Tên cửa hàng đã tồn tại. Vui lòng chọn tên khác.");
      }

      return !phoneNumberTaken && !tenantNameTaken;
    } catch (error) {
      console.error("Availability check error:", error);
      toast.error("Không kiểm tra được thông tin. Vui lòng thử lại.");
      return false;
    } finally {
      setIsChecking(false);
    }
  };

  // First step: validate the form, then send the OTP (or bypass in dev).
  const onSubmit = async (data: SignupInput) => {
    // Pre-check uniqueness first - stop early (and keep the SMS) if taken.
    const isAvailable = await checkAvailability(data);
    if (!isAvailable) return;

    if (OTP_BYPASS) {
      await completeSignup(data, "DEV_BYPASS");
      return;
    }
    try {
      await sendOtp(data.phoneNumber);
      setPendingData(data);
      setOtpPhase(true);
      setOtpCode("");
      toast.success(`Đã gửi mã OTP đến ${data.phoneNumber}.`);
    } catch (error) {
      console.error("Send OTP error:", error);
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      toast.error(
        err.response?.data?.message ||
          "Không gửi được mã OTP. Vui lòng kiểm tra số điện thoại.",
      );
    }
  };

  const handleVerifyOtp = async () => {
    if (!pendingData) return;
    if (otpCode.trim().length < 6) {
      toast.error("Vui lòng nhập đủ 6 chữ số mã OTP.");
      return;
    }
    // The backend verifies the code as part of registration.
    await completeSignup(pendingData, otpCode.trim());
  };

  const handleBackToForm = () => {
    setOtpPhase(false);
    setOtpCode("");
  };

  const handleResendOtp = async () => {
    if (!pendingData) return;
    try {
      await sendOtp(pendingData.phoneNumber);
      setOtpCode("");
      toast.success("Đã gửi lại mã OTP.");
    } catch (error) {
      console.error("Resend OTP error:", error);
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      toast.error(
        err.response?.data?.message ||
          "Không gửi lại được mã OTP. Vui lòng thử lại.",
      );
    }
  };

  if (otpPhase) {
    return (
      <div className={cn("flex flex-col gap-6", className)}>
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold">Xác thực số điện thoại</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Nhập mã OTP gồm 6 chữ số đã gửi đến{" "}
            <span className="font-medium text-foreground">
              {pendingData?.phoneNumber}
            </span>
          </p>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="otpCode">Mã OTP</Label>
          <Input
            id="otpCode"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            className="text-center text-lg tracking-[0.5em]"
            value={otpCode}
            onChange={(e) =>
              setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            disabled={isLoading}
          />
        </div>

        <Button
          type="button"
          className="w-full cursor-pointer"
          onClick={handleVerifyOtp}
          disabled={isLoading || otpCode.length < 6}
        >
          {isLoading ? "Đang xác thực..." : "Xác nhận & Đăng ký"}
        </Button>

        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={handleBackToForm}
            disabled={isLoading}
            className="underline underline-offset-4 hover:text-primary disabled:opacity-50"
          >
            Quay lại
          </button>
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={isSending || isLoading}
            className="underline underline-offset-4 hover:text-primary disabled:opacity-50"
          >
            {isSending ? "Đang gửi lại..." : "Gửi lại mã"}
          </button>
        </div>
      </div>
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
        {/* SECTION 1: Personal Info */}
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

        {/* SECTION 2: Shop/Tenant Info */}
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
          disabled={isChecking || isLoading || isSending}
        >
          {isChecking
            ? "Đang kiểm tra thông tin..."
            : isSending
              ? "Đang gửi mã OTP..."
              : isLoading
                ? "Đang xử lý..."
                : OTP_BYPASS
                  ? "Đăng ký cửa hàng"
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
