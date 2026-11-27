"use client";

// Màn của nhân viên xưởng: YCSX gửi cho xưởng mình ở mọi kho.

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/store/hooks/use-auth";
import { WorkshopRequestsTable } from "./components/workshop-requests-table";

export default function WorkshopPage() {
  const { user } = useAuth();
  const linked = Boolean(user?.workshopId);
  // Tăng lên khi bấm "Tải lại" để bảng tải lại với bộ lọc đang chọn.
  const [refreshSignal, setRefreshSignal] = useState(0);

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <PageHeader
        breadcrumbs={[{ label: "Trang chủ", href: "/dashboard" }, { label: "Xưởng của tôi" }]}
        title={user?.workshop ? `Xưởng – ${user.workshop.supplierName}` : "Xưởng của tôi"}
        description="Yêu cầu sản xuất gửi cho xưởng ở mọi kho. Làm xong phần nào, tạo phiếu giao phần đó - nơi nhận kiểm hàng rồi mới nhập kho."
        actions={
          linked && (
            <Button variant="outline" onClick={() => setRefreshSignal((count) => count + 1)}>
              Tải lại
            </Button>
          )
        }
      />

      {!linked && (
        <p className="text-center text-muted-foreground">
          Tài khoản của bạn chưa được gắn với xưởng nào. Nhờ chủ cửa hàng chọn xưởng trong hồ sơ nhân viên.
        </p>
      )}

      {linked && <WorkshopRequestsTable refreshSignal={refreshSignal} />}
    </div>
  );
}
