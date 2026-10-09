"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ReceiptText, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { allows } from "@/components/sidebar/constants/role-permissions";
import { getCachedUser, getSessionRole } from "@/lib/auth";
import { useSalesBranch } from "./_hooks/use-sales-branch";
import { DirectSaleTab } from "./components/direct-sale-tab";
import { CreateOrderForm } from "@/app/(protected)/sales/orders/new/components/create-order-form";

type Mode = "direct" | "order";

const MODES: { id: Mode; label: string; icon: typeof ShoppingCart }[] = [
  { id: "direct", label: "Tạo đơn trực tiếp", icon: ShoppingCart },
  { id: "order", label: "Tạo đơn hàng", icon: ReceiptText },
];

function CheckOutContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const mode: Mode = searchParams.get("mode") === "order" ? "order" : "direct";
  const canCreateOrder = allows(getSessionRole(), "orders", "create");
  const sales = useSalesBranch();
  const backHref = getCachedUser()?.role === "STAFF" ? "/products" : "/dashboard";

  const switchMode = (next: Mode) => {
    // Keep other params (e.g. `replacementFor`) so the order form still sees them.
    const params = new URLSearchParams(searchParams.toString());
    if (next === "direct") params.delete("mode");
    else params.set("mode", next);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  return (
    <div className="h-screen w-full flex flex-col bg-background overflow-hidden">
      <div className="flex items-center gap-2 border-b bg-card px-4 pt-2 shrink-0">
        <div role="tablist" className="flex items-center gap-1.5">
          {MODES.map(({ id, label, icon: Icon }) => {
            const active = id === mode;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => switchMode(id)}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 text-base font-bold rounded-t-lg border-t border-x cursor-pointer transition-all",
                  active
                    ? "bg-background border-border text-primary"
                    : "bg-muted/40 border-transparent text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Both panes stay mounted so switching tabs never loses a half-built invoice or order form. */}
      <div className={cn("flex-1 min-h-0", mode !== "direct" && "hidden")}>
        <DirectSaleTab sales={sales} />
      </div>
      <div className={cn("flex-1 min-h-0 overflow-y-auto p-4 lg:p-6", mode !== "order" && "hidden")}>
        {canCreateOrder ? (
          <CreateOrderForm sales={sales} />
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-16 text-center">
            <h2 className="text-lg font-semibold">Không có quyền tạo đơn</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Tài khoản của bạn không có quyền tạo đơn hàng. Vui lòng liên hệ quản trị viên nếu bạn cần
              quyền này.
            </p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/sales/orders">Về danh sách đơn</Link>
            </Button>
          </div>
        )}
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
  // useSearchParams (here and inside CreateOrderForm) needs a Suspense boundary.
  return (
    <Suspense fallback={null}>
      <CheckOutContent />
    </Suspense>
  );
}
