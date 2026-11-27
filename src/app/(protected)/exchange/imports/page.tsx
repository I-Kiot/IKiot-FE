import { Suspense } from "react";
import { ImportsWorkspace } from "./components/imports-workspace";

/** Màn Nhập hàng. */
export default function ImportsPage() {
  return (
    <Suspense fallback={null}>
      <ImportsWorkspace />
    </Suspense>
  );
}
