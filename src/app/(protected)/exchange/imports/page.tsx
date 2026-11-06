import { Suspense } from "react";
import { ImportsWorkspace } from "./components/imports-workspace";

/** Màn Nhập hàng: gộp đơn nhập từ nhà cung cấp và yêu cầu sản xuất gửi xưởng. `useSearchParams` cần Suspense boundary. */
export default function ImportsPage() {
  return (
    <Suspense fallback={null}>
      <ImportsWorkspace />
    </Suspense>
  );
}
