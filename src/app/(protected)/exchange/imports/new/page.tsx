import { Suspense } from "react";
import { CreateInboundPage } from "./components/create-inbound-page";

/** Tạo mới ở màn Nhập hàng (đơn nhập từ NCC hoặc yêu cầu sản xuất), trang riêng như `/sales/orders/new`. `useSearchParams` cần Suspense boundary. */
export default function NewInboundPage() {
  return (
    <Suspense fallback={null}>
      <CreateInboundPage />
    </Suspense>
  );
}
