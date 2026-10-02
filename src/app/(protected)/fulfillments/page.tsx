import { ComingSoonPage } from "@/components/coming-soon-page";

// P0-7 placeholder - replaced by task C-6.
export default function FulfillmentsPage() {
  return (
    <ComingSoonPage
      breadcrumbs={[{ label: "Trang chủ", href: "/dashboard" }, { label: "Vận hành" }, { label: "Đóng hàng" }]}
      title="Đóng hàng"
      description="Đơn chờ đóng hàng, đóng kiện và xác nhận hàng nguyên vẹn"
      task="C-6"
    />
  );
}
