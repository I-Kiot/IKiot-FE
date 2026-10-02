import { ComingSoonPage } from "@/components/coming-soon-page";

// P0-7 placeholder - replaced by task C-7.
export default function ShipperPage() {
  return (
    <ComingSoonPage
      breadcrumbs={[{ label: "Trang chủ", href: "/dashboard" }, { label: "Đơn giao của tôi" }]}
      title="Đơn giao của tôi"
      description="Danh sách đơn được giao cho bạn, chụp ảnh và xác nhận đã giao"
      task="C-7"
    />
  );
}
