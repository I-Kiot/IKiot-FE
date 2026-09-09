"use client";

import { PageHeader } from "@/components/page-header";
import { Loader2, History } from "lucide-react";

export default function CashDrawersHistoryPage() {
  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <PageHeader
        breadcrumbs={[
          { label: "Trang chủ", href: "/dashboard" },
          { label: "Két tiền", href: "/cash-drawers/today" },
          { label: "Lịch sử" },
        ]}
        title="Lịch sử két tiền"
        description="Xem lại các phiên giao ca và lịch sử bàn giao két tiền"
      />

      <div className="flex h-[50vh] flex-col items-center justify-center gap-3 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center">
          <History className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-bold text-foreground">Tính năng đang phát triển</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Lịch sử phiên két tiền sẽ sớm được cập nhật trong phiên bản tiếp theo.
        </p>
      </div>
    </div>
  );
}
