import { Suspense } from "react";
import { CreateInboundPage } from "./components/create-inbound-page";

/** Trang tạo mới ở màn Nhập hàng. */
export default function NewInboundPage() {
  return (
    <Suspense fallback={null}>
      <CreateInboundPage />
    </Suspense>
  );
}
