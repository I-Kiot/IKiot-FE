import { ComingSoonPage } from "@/components/coming-soon-page";

// P0-7 placeholder - replaced by task D-6.
export default function OrderReturnsPage() {
  return (
    <ComingSoonPage
      breadcrumbs={[{ label: "Trang chủ", href: "/dashboard" }, { label: "Đơn hàng" }, { label: "Hoàn hàng" }]}
      title="Hoàn hàng"
      description="Tạo đơn hoàn và kiểm từng dòng hàng trả về"
      task="D-6"
    />
  );
}
