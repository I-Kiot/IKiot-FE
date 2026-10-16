"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCachedUser } from "@/lib/auth";
import { useSalesBranch } from "./_hooks/use-sales-branch";
import { DirectSaleTab } from "./components/direct-sale-tab";

/**
 * Bán tại quầy (POS), toàn màn hình. Đến 2026-10-16 trang này còn một tab "Tạo đơn hàng" (đơn tay) bên cạnh;
 * tách ra `/sales/orders/new` vì hai kiểu đơn đặt cạnh nhau dễ nhầm. Link cũ `?mode=order` chuyển sang đó.
 */
function CheckOutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const legacyOrderMode = searchParams.get("mode") === "order";
  const sales = useSalesBranch();
  const backHref = getCachedUser()?.role === "STAFF" ? "/products" : "/dashboard";

  useEffect(() => {
    if (!legacyOrderMode) return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete("mode");
    const qs = params.toString();
    router.replace(qs ? `/sales/orders/new?${qs}` : "/sales/orders/new");
  }, [legacyOrderMode, searchParams, router]);

  if (legacyOrderMode) return null;

  return (
    <div className="h-screen w-full flex flex-col bg-background overflow-hidden">
      <div className="flex-1 min-h-0">
        <DirectSaleTab sales={sales} />
      </div>

      <Button asChild variant="outline" size="sm" className="fixed bottom-6 left-6 z-30 shadow-md">
        <Link href={backHref}>
          <ArrowLeft className="size-4" />
          Quay lại
        </Link>
      </Button>
    </div>
  );
}

export default function CheckOutPage() {
  return (
    <Suspense fallback={null}>
      <CheckOutContent />
    </Suspense>
  );
}
