"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema, LoginInput } from "@/lib/validation";
import { loginUser, loginWithGoogle } from "@/lib/api/auth";
import { setTokens, setCachedUser } from "@/lib/auth";
import { useAuthStore } from "@/store/auth-store";

export function LoginForm2({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const router = useRouter();

  // Send each role to its home screen after a successful login.
  const routeByRole = (role?: string) => {
    if (role === "STAFF") {
      router.push("/check-out");
    } else if (role === "ADMIN") {
      router.push("/admin/dashboard");
    } else {
      router.push("/dashboard");
    }
    router.refresh();
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    try {
      const { accessToken, refreshToken, user } = await loginUser(data);

      if (accessToken) {
        setTokens({ accessToken, refreshToken });
        // Fetch detailed user profile
        await useAuthStore.getState().fetchMe();
        const role = useAuthStore.getState().user?.role;

        toast.success("Đăng nhập thành công!");
        routeByRole(role);
      } else {
        throw new Error("Không nhận được mã xác thực từ hệ thống.");
      }
    } catch (error) {
      console.error("Login error:", error);
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const message =
        err.response?.data?.message ||
        err.message ||
        "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const onGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const { accessToken, refreshToken, user } = await loginWithGoogle();

      if (!accessToken) {
        throw new Error("Không nhận được mã xác thực từ hệ thống.");
      }

      setTokens({ accessToken, refreshToken });
      if (user) setCachedUser(user);
      await useAuthStore.getState().fetchMe();
      const role = useAuthStore.getState().user?.role;

      toast.success("Đăng nhập thành công!");
      routeByRole(role);
    } catch (error) {
      console.error("Google login error:", error);
      const err = error as {
        code?: string;
        response?: { data?: { message?: string } };
        message?: string;
      };
      // The user closing the Google popup isn't an error worth shouting about.
      if (
        err.code === "auth/popup-closed-by-user" ||
        err.code === "auth/cancelled-popup-request"
      ) {
        return;
      }
      const message =
        err.response?.data?.message ||
        err.message ||
        "Đăng nhập với Google thất bại.";
      toast.error(message);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={handleSubmit(onSubmit)}
      {...props}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Đăng nhập tài khoản</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Nhập số điện thoại của bạn dưới đây để đăng nhập vào hệ thống
        </p>
      </div>
      <div className="grid gap-6">
        <div className="grid gap-3">
          <Label htmlFor="phone">Số điện thoại</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="Nhập số điện thoại"
            disabled={isLoading}
            {...register("phone")}
          />
          {errors.phone && (
            <p className="text-xs font-medium text-destructive">
              {errors.phone.message}
            </p>
          )}
        </div>
        <div className="grid gap-3">
          <div className="flex items-center">
            <Label htmlFor="password">Mật khẩu</Label>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                toast.info("Tính năng đang được phát triển.");
              }}
              className="ml-auto text-sm underline-offset-4 hover:underline"
            >
              Quên mật khẩu?
            </a>
          </div>
          <Input
            id="password"
            type="password"
            disabled={isLoading}
            placeholder="Nhập mật khẩu"
            {...register("password")}
          />
          {errors.password && (
            <p className="text-xs font-medium text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>
        <Button
          type="submit"
          className="w-full cursor-pointer"
          disabled={isLoading || isGoogleLoading}
        >
          {isLoading ? "Đang xử lý..." : "Đăng nhập"}
        </Button>

        <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
          <span className="bg-background text-muted-foreground relative z-10 px-2">
            Hoặc
          </span>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full cursor-pointer"
          onClick={onGoogleLogin}
          disabled={isLoading || isGoogleLoading}
        >
          <svg
            className="mr-2 size-4"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.31 9.14 5.38 12 5.38Z"
            />
          </svg>
          {isGoogleLoading ? "Đang xử lý..." : "Đăng nhập với Google"}
        </Button>
      </div>
      <div className="text-center text-sm">
        Chưa có tài khoản?{" "}
        <a href="/sign-up" className="underline underline-offset-4">
          Đăng ký ngay
        </a>
      </div>
    </form>
  );
}
