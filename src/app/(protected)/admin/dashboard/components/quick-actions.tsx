"use client";

import { useRouter } from "next/navigation";
import { Megaphone, Settings, RefreshCw, Store, LifeBuoy, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAdminDashboard } from "./admin-dashboard-provider";

export function QuickActions() {
  const router = useRouter();
  const { refetch, isLoading } = useAdminDashboard();

  return (
    <div className="flex items-center space-x-2">
      <Button
        variant="outline"
        className="cursor-pointer"
        onClick={refetch}
        disabled={isLoading}
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
        Làm mới
      </Button>
      <Button className="cursor-pointer" onClick={() => router.push("/admin/notifications")}>
        <Megaphone className="h-4 w-4 mr-2" />
        Gửi thông báo
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="cursor-pointer">
            <Settings className="h-4 w-4 mr-2" />
            Thao tác
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/admin/users")}>
            <Store className="h-4 w-4 mr-2" />
            Quản lý cửa hàng
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/admin/sepay")}>
            <Landmark className="h-4 w-4 mr-2" />
            Liên kết SePay
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/admin/tickets")}>
            <LifeBuoy className="h-4 w-4 mr-2" />
            Hỗ trợ kỹ thuật
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/admin/transactions")}>
            <Settings className="h-4 w-4 mr-2" />
            Lịch sử giao dịch
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
