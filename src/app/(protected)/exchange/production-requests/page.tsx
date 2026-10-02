import { ComingSoonPage } from "@/components/coming-soon-page";

// P0-7 placeholder - replaced by task B-6.
export default function ProductionRequestsPage() {
  return (
    <ComingSoonPage
      breadcrumbs={[{ label: "Trang chủ", href: "/dashboard" }, { label: "Giao dịch" }, { label: "Yêu cầu sản xuất" }]}
      title="Yêu cầu sản xuất"
      description="Theo dõi hàng đặt xưởng và cảnh báo thiếu hàng"
      task="B-6"
    />
  );
}
