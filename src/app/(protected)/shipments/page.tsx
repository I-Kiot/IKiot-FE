import { ComingSoonPage } from "@/components/coming-soon-page";

// P0-7 placeholder - replaced by task C-3.
export default function ShipmentsPage() {
  return (
    <ComingSoonPage
      breadcrumbs={[{ label: "Trang chủ", href: "/dashboard" }, { label: "Vận hành" }, { label: "Giao hàng" }]}
      title="Giao hàng"
      description="Các lần giao hàng qua hãng vận chuyển hoặc shipper của cửa hàng"
      task="C-3"
    />
  );
}
