"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

export function UnauthorizedPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const handleHomeRedirect = () => {
    if (!user) {
      router.push("/sign-in");
      return;
    }
    if (user.role === "ADMIN") {
      router.push("/admin/dashboard");
    } else if (user.role === "STAFF") {
      router.push("/check-out");
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
      <div className="rounded-full bg-destructive/10 p-6 text-destructive mb-4">
        <ShieldAlert className="h-12 w-12" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        Không có quyền truy cập
      </h1>
      <p className="mt-2 text-muted-foreground max-w-md">
        Bạn không có quyền truy cập vào trang này. Vui lòng liên hệ với quản trị viên nếu bạn cho rằng đây là một sự nhầm lẫn.
      </p>
      <div className="flex gap-4 mt-6">
        <Button variant="outline" onClick={() => router.back()}>
          Quay lại
        </Button>
        <Button onClick={handleHomeRedirect}>
          Trang chủ
        </Button>
      </div>
    </div>
  );
}
