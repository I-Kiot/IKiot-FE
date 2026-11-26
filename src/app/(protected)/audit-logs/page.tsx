"use client";

import { PageHeader } from "@/components/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AllActivityTab } from "./components/all-activity-tab";
import { OrderActivityTab } from "./components/order-activity-tab";

export default function TenantAuditLogsPage() {
  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <PageHeader
        breadcrumbs={[{ label: "Trang chủ", href: "/dashboard" }, { label: "Lịch sử hành động" }]}
        title="Lịch sử hành động"
        description="Theo dõi thao tác của chủ cửa hàng và nhân viên: đăng nhập, tạo mới, cập nhật, xóa, và từng bước xử lý đơn hàng."
      />

      <Tabs defaultValue="orders">
        <TabsList>
          <TabsTrigger value="orders">Thao tác đơn hàng</TabsTrigger>
          <TabsTrigger value="all">Tất cả hoạt động</TabsTrigger>
        </TabsList>
        <TabsContent value="orders" className="mt-4">
          <OrderActivityTab />
        </TabsContent>
        <TabsContent value="all" className="mt-4">
          <AllActivityTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
