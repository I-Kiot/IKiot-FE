import { ComingSoonPage } from "@/components/coming-soon-page";

// P0-7 placeholder - replaced by task D-1, D-2, D-3.
export default function OrdersPage() {
  return (
    <ComingSoonPage
      breadcrumbs={[{ label: "Trang chủ", href: "/dashboard" }, { label: "Đơn hàng" }, { label: "Danh sách đơn" }]}
      title="Đơn hàng"
      description="Đơn tạo tay, bán tại quầy và đơn Shopee theo trạng thái, người phụ trách và kênh bán"
      task="D-1, D-2, D-3"
    />
  );
}
