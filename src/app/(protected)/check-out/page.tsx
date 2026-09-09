"use client";

import React, { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckoutTabs } from "./components/checkout-tabs";
import { ProductSearch } from "./components/product-search";
import { CartItems } from "./components/cart-items";
import { CheckoutSidebar } from "./components/checkout-sidebar";
import { CustomerDialog } from "./components/customer-dialog";
import { ReceiptDialog } from "./components/receipt-dialog";
import { OrderQrDialog } from "./components/order-qr-dialog";
import { PromotionPickerDialog } from "./components/promotion-picker-dialog";
import { orderApi } from "@/lib/api/order";
import { branchApi } from "@/lib/api/branch";
import { promotionApi } from "@/lib/api/promotion";
import type { PromotionCalculateResponse } from "@/types/promotion";
import { getCachedUser } from "@/lib/auth";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

interface Customer {
  id: string;
  customerCode: string;
  name: string;
  phone: string;
  address: string;
  gender: "MALE" | "FEMALE" | "OTHER";
}

interface CartItem {
  productItemId: string;
  productCode: string;
  sku: string;
  barcode: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  imageUrl?: string;
}

interface InvoiceState {
  id: string;
  tabName: string;
  items: CartItem[];
  selectedCustomer: Customer | null;
  discount: number;
  discountType: "cash" | "percent";
  vatPercent: number;
  paymentMethod: "CASH" | "SEPAY";
  customerPay: number;
  note: string;
  /** Promotions manually assigned via the "Gán giảm giá" picker - at most 2, and if 2, both stackable. */
  selectedPromotionIds: string[];
}

const createNewInvoice = (id: string, name: string): InvoiceState => ({
  id,
  tabName: name,
  items: [],
  selectedCustomer: null,
  discount: 0,
  discountType: "cash",
  vatPercent: 0,
  paymentMethod: "CASH",
  customerPay: 0,
  note: "",
  selectedPromotionIds: [],
});

export default function CheckOutPage() {
  const [invoices, setInvoices] = useState<InvoiceState[]>([
    createNewInvoice("1", "Hóa đơn 1"),
  ]);
  const [activeTabId, setActiveTabId] = useState<string>("1");
  const [branches, setBranches] = useState<any[]>([]);
  const [direction, setDirection] = useState<"horizontal" | "vertical">("horizontal");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const handleMediaChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setDirection(e.matches ? "horizontal" : "vertical");
    };
    handleMediaChange(mediaQuery);
    mediaQuery.addEventListener("change", handleMediaChange);
    return () => mediaQuery.removeEventListener("change", handleMediaChange);
  }, []);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await branchApi.getList({ limit: 100 });
        setBranches(response.data || []);
      } catch (err) {
        console.error("Lỗi khi tải danh sách chi nhánh:", err);
      }
    };
    fetchBranches();
  }, []);

  // Resolve the active branch the same way for the promotion preview and the final order payload
  const resolveBranchId = (): string => {
    const cachedUser = getCachedUser() as any;
    if (cachedUser?.branchId) return cachedUser.branchId;
    if (typeof window !== "undefined") {
      const activeSwitcherItemId = localStorage.getItem("activeSwitcherItemId");
      const activeSwitcherItemType = localStorage.getItem("activeSwitcherItemType");
      if (activeSwitcherItemId && activeSwitcherItemType === "branch" && activeSwitcherItemId !== "all-branches") {
        return activeSwitcherItemId;
      }
    }
    if (branches.length > 0) return branches[0].id;
    return "";
  };

  // Discount preview for the active invoice's manually assigned promotion(s).
  // Tagged with the signature (cart + selected promotion ids) it was computed for,
  // so a stale result (still in flight while the cart, selection, or tab changes)
  // is simply ignored at render time instead of being cleared with a synchronous
  // setState inside the effect.
  const [promotionResult, setPromotionResult] = useState<
    (PromotionCalculateResponse & { signature: string }) | null
  >(null);

  // Modals state
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isPromotionPickerOpen, setIsPromotionPickerOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState<any | null>(null);
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
  const [qrOrderData, setQrOrderData] = useState<{
    orderId: string;
    qrUrl: string;
    paymentReference: string;
    grandTotal: number;
    receiptSnapshot: any;
  } | null>(null);

  // Active invoice getter
  const activeInvoice = useMemo(() => {
    return invoices.find((inv) => inv.id === activeTabId) || invoices[0];
  }, [invoices, activeTabId]);

  // Update helper for active invoice state
  const updateActiveInvoice = (updates: Partial<InvoiceState>) => {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === activeTabId ? { ...inv, ...updates } : inv,
      ),
    );
  };

  // Signature identifying which cart (items + customer) the active invoice has -
  // used both to key the promotion calculation and to feed the picker dialog.
  const cartSignature = useMemo(() => {
    if (activeInvoice.items.length === 0) return null;
    const itemsKey = activeInvoice.items
      .map((item) => `${item.productItemId}:${item.quantity}:${item.unitPrice}`)
      .join(",");
    return `${itemsKey}|${activeInvoice.selectedCustomer?.id ?? ""}`;
  }, [activeInvoice.items, activeInvoice.selectedCustomer]);

  // Signature the current promotionResult is valid for - includes the selected promotion
  // ids, so switching the selection (or clearing it) invalidates a stale result too.
  const promotionSignature = useMemo(() => {
    if (!cartSignature || activeInvoice.selectedPromotionIds.length === 0) return null;
    return `${cartSignature}|${[...activeInvoice.selectedPromotionIds].sort().join(",")}`;
  }, [cartSignature, activeInvoice.selectedPromotionIds]);

  // Recompute the discount for the active invoice's manually assigned promotion(s) whenever
  // the cart or the selection changes (debounced). If a previously eligible promotion no
  // longer qualifies (e.g. cart edited below its minOrderValue), the backend rejects the
  // whole selection - drop it and let the user reassign.
  useEffect(() => {
    if (!promotionSignature) return;

    const branchId = resolveBranchId();
    if (!branchId) return;

    const signature = promotionSignature;
    const promotionIds = activeInvoice.selectedPromotionIds;

    const handler = setTimeout(() => {
      promotionApi
        .calculate({
          branchId,
          customerId: activeInvoice.selectedCustomer?.id,
          items: activeInvoice.items.map((item) => ({
            productItemId: item.productItemId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
          promotionIds,
        })
        .then((result) => setPromotionResult({ ...result, signature }))
        .catch((error) => {
          console.error("Lỗi khi tính khuyến mãi:", error);
          toast.warning(
            error?.response?.data?.message ||
              "Một khuyến mãi đã chọn không còn đủ điều kiện, vui lòng chọn lại.",
          );
          updateActiveInvoice({ selectedPromotionIds: [] });
        });
    }, 300);

    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [promotionSignature, branches]);

  // Ignore a promotion result computed for a different cart/selection (stale tab switch,
  // in-flight edit, or a selection that was just cleared).
  const activePromotionResult =
    promotionResult?.signature === promotionSignature ? promotionResult : null;
  const promotionDiscount = activePromotionResult?.totalDiscount ?? 0;
  const hasPromotionApplied = activeInvoice.selectedPromotionIds.length > 0;

  // Add new tab
  const handleTabAdd = () => {
    if (invoices.length >= 10) {
      toast.warning("Hệ thống chỉ cho phép tối đa 10 hóa đơn nháp cùng lúc.");
      return;
    }
    const nextId = (
      Math.max(...invoices.map((inv) => parseInt(inv.id))) + 1
    ).toString();
    const nextName = `Hóa đơn ${nextId}`;
    const newTab = createNewInvoice(nextId, nextName);
    setInvoices((prev) => [...prev, newTab]);
    setActiveTabId(nextId);
    toast.success(`Đã mở ${nextName}`);
  };

  // Close tab
  const handleTabClose = (id: string) => {
    if (invoices.length === 1) return; // Keep at least one

    const index = invoices.findIndex((inv) => inv.id === id);
    const updated = invoices.filter((inv) => inv.id !== id);
    setInvoices(updated);

    if (activeTabId === id) {
      // Switch active tab to previous or first
      const nextActiveIndex = index > 0 ? index - 1 : 0;
      setActiveTabId(updated[nextActiveIndex].id);
    }
    toast.info("Đã xóa hóa đơn nháp.");
  };

  // Add product to cart
  const handleProductSelect = (product: any) => {
    const existingIndex = activeInvoice.items.findIndex(
      (item) => item.productItemId === product.id,
    );

    if (existingIndex > -1) {
      const updatedItems = [...activeInvoice.items];
      updatedItems[existingIndex].quantity += 1;
      updateActiveInvoice({ items: updatedItems });
      toast.success(`Đã tăng số lượng ${product.name}`);
    } else {
      const newItem: CartItem = {
        productItemId: product.id,
        productCode: product.productCode,
        sku: product.sku,
        barcode: product.barcode,
        name: product.name,
        quantity: 1,
        unitPrice: product.retailPrice,
        discountAmount: 0,
        imageUrl: product.imageUrl,
      };
      updateActiveInvoice({ items: [...activeInvoice.items, newItem] });
      toast.success(`Đã thêm ${product.name} vào giỏ hàng`);
    }
  };

  // Item modifications
  const handleItemQuantityChange = (
    productItemId: string,
    quantity: number,
  ) => {
    const updated = activeInvoice.items.map((item) =>
      item.productItemId === productItemId ? { ...item, quantity } : item,
    );
    updateActiveInvoice({ items: updated });
  };

  const handleItemUnitPriceChange = (
    productItemId: string,
    unitPrice: number,
  ) => {
    const updated = activeInvoice.items.map((item) =>
      item.productItemId === productItemId ? { ...item, unitPrice } : item,
    );
    updateActiveInvoice({ items: updated });
  };

  const handleItemDiscountChange = (
    productItemId: string,
    discountAmount: number,
  ) => {
    const updated = activeInvoice.items.map((item) =>
      item.productItemId === productItemId ? { ...item, discountAmount } : item,
    );
    updateActiveInvoice({ items: updated });
  };

  const handleItemRemove = (productItemId: string) => {
    const updated = activeInvoice.items.filter(
      (item) => item.productItemId !== productItemId,
    );
    updateActiveInvoice({ items: updated });
    toast.info("Đã xóa sản phẩm khỏi giỏ hàng.");
  };

  // Calculation details
  const subtotal = useMemo(() => {
    return activeInvoice.items.reduce(
      (acc, item) =>
        acc + item.quantity * (item.unitPrice - item.discountAmount),
      0,
    );
  }, [activeInvoice.items]);

  // Assigned promotion(s) and the manual order-level discount are mutually exclusive:
  // once the user assigns a promotion, it wins and the manual discount is ignored.
  const grandTotal = useMemo(() => {
    const calculatedDiscount = hasPromotionApplied
      ? promotionDiscount
      : activeInvoice.discountType === "cash"
        ? activeInvoice.discount
        : (subtotal * activeInvoice.discount) / 100;
    const total = Math.max(0, subtotal - calculatedDiscount);
    const vat = (total * activeInvoice.vatPercent) / 100;
    return Math.max(0, total + vat);
  }, [
    subtotal,
    activeInvoice.discount,
    activeInvoice.discountType,
    activeInvoice.vatPercent,
    hasPromotionApplied,
    promotionDiscount,
  ]);

  // Keep paid amount updated when grand total drops
  useEffect(() => {
    if (
      activeInvoice.paymentMethod !== "CASH" ||
      activeInvoice.customerPay < grandTotal
    ) {
      updateActiveInvoice({ customerPay: grandTotal });
    }
  }, [grandTotal]);

  // Complete checkout order
  const handleCheckoutSubmit = () => {
    if (activeInvoice.items.length === 0) {
      toast.error("Không thể thanh toán đơn hàng trống!");
      return;
    }

    if (activeInvoice.paymentMethod === "CASH" && activeInvoice.customerPay < grandTotal) {
      toast.error("Số tiền khách trả phải lớn hơn hoặc bằng tổng hóa đơn!");
      return;
    }

    const resolvedBranchId = resolveBranchId();
    if (!resolvedBranchId) {
      toast.error("Không xác định được chi nhánh hoạt động. Vui lòng chọn chi nhánh!");
      return;
    }

    // Snapshot of the cart the promotion preview was calculated for - captured now
    // because the invoice resets as soon as order creation succeeds below.
    const promotionToApply =
      hasPromotionApplied && activePromotionResult
        ? {
            branchId: resolvedBranchId,
            customerId: activeInvoice.selectedCustomer?.id,
            items: activeInvoice.items.map((item) => ({
              productItemId: item.productItemId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            })),
            promotionIds: activeInvoice.selectedPromotionIds,
          }
        : null;

    let discountType: "ORDER" | "PROMOTION" | null = null;
    let discountValue = 0;
    let appliedPromotions = null;

    if (hasPromotionApplied && activePromotionResult) {
      discountType = "PROMOTION";
      discountValue = promotionDiscount;
      appliedPromotions = activePromotionResult.appliedPromotions.map((p) => ({
        promotionId: p.promotionId,
        promoName: p.promoName,
        discountAmount: p.discountAmount,
      }));
    } else if (activeInvoice.discount > 0) {
      discountType = "ORDER";
      discountValue =
        activeInvoice.discountType === "cash"
          ? activeInvoice.discount
          : (subtotal * activeInvoice.discount) / 100;
    }

    // What goes on the wire is deliberately narrower than what the receipt below prints.
    // `POST /orders` computes the money itself: the total from the lines, and - when the
    // sale carries promotions - the discount from the engine, which it then spreads across
    // the lines. So the client names the promotions and nothing else.
    //
    // `discountType: "PROMOTION"` is now **rejected outright** (`@IsIn(['ORDER'])`, 400):
    // sending `appliedPromotions` is what makes a sale a promotion sale, and asking the
    // till to also declare a total it doesn't compute is how the screen and the stored
    // order ended up able to disagree. `ORDER` - the cashier's own typed-in whole-order
    // discount - is still sent, with its value.
    //
    // `grandTotal`, `items[].unitPrice` and `items[].productName` are gone for the same
    // reason: the server prices from the catalogue. They were being dropped silently by
    // `whitelist: true` anyway, which made the payload read as though the till set the
    // price when it never did.
    const payload = {
      customerId: activeInvoice.selectedCustomer?.id,
      branchId: resolvedBranchId,
      paymentMethod: activeInvoice.paymentMethod,
      items: activeInvoice.items.map((item) => ({
        productItemId: item.productItemId,
        quantity: item.quantity,
        discountAmount: item.discountAmount,
      })),
      customerPay: activeInvoice.customerPay,
      note: activeInvoice.note,
      ...(appliedPromotions
        ? { appliedPromotions: appliedPromotions.map((p) => ({ promotionId: p.promotionId })) }
        : discountType === "ORDER"
          ? { discountType, discountValue }
          : {}),
    };

    const buildReceipt = (createdOrder: any, orderId: string) => ({
      orderCode: createdOrder.paymentReference || `HD-${orderId.slice(-6).toUpperCase()}`,
      createdAt: createdOrder.createdAt || new Date().toISOString(),
      branchName: branches.find((b) => b.id === resolvedBranchId)?.name || "Chi nhánh chính",
      sellerName: getCachedUser()?.full_name || "Quản trị viên (Admin)",
      customer: activeInvoice.selectedCustomer,
      items: activeInvoice.items.map((item) => ({
        productName: item.name,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountAmount: item.discountAmount,
      })),
      grandTotal,
      customerPay: activeInvoice.paymentMethod === "CASH" ? activeInvoice.customerPay : grandTotal,
      change: activeInvoice.paymentMethod === "CASH"
        ? (createdOrder.change ?? Math.max(0, activeInvoice.customerPay - grandTotal))
        : 0,
      paymentMethod: activeInvoice.paymentMethod,
      note: activeInvoice.note,
      discountType,
      discountValue,
      appliedPromotions,
    });

    const checkoutPromise = orderApi.create(payload);

    toast.promise(checkoutPromise, {
      loading: "Đang xử lý...",
      success: (response) => {
        const createdOrder = response.data.order;
        const orderId = createdOrder.id || (createdOrder as any).id || "";
        const receipt = buildReceipt(createdOrder, orderId);

        // Commit promotion usage/log now that the order exists - best-effort: the order
        // is already paid, so a logging failure here shouldn't block the checkout flow.
        if (promotionToApply && orderId) {
          promotionApi.apply({ ...promotionToApply, orderId }).catch((error) => {
            console.error("Lỗi khi ghi nhận khuyến mãi cho đơn hàng:", error);
            toast.warning("Đơn hàng đã tạo nhưng ghi nhận khuyến mãi thất bại.");
          });
        }

        if (activeInvoice.paymentMethod === "SEPAY" && response.data.qrUrl) {
          // SEPAY: hiện QR dialog, chờ xác nhận payment
          setQrOrderData({
            orderId,
            qrUrl: response.data.qrUrl,
            paymentReference: createdOrder.paymentReference || "",
            grandTotal,
            receiptSnapshot: receipt,
          });
          setIsQrDialogOpen(true);
          updateActiveInvoice(createNewInvoice(activeInvoice.id, activeInvoice.tabName));
          return "Đã tạo đơn! Mời khách quét mã QR.";
        }

        // CASH: hiện receipt ngay
        setReceiptOrder(receipt);
        setIsReceiptOpen(true);
        updateActiveInvoice(createNewInvoice(activeInvoice.id, activeInvoice.tabName));
        return "Thanh toán đơn hàng thành công!";
      },
      error: (err: any) => {
        console.error("Lỗi thanh toán:", err);
        return err?.response?.data?.message || err?.message || "Thanh toán đơn hàng thất bại";
      },
    });
  };

  // Reset/Cancel order cart
  const handleCancelOrder = () => {
    if (
      confirm(
        `Bạn có chắc chắn muốn hủy giỏ hàng của ${activeInvoice.tabName}?`,
      )
    ) {
      updateActiveInvoice(
        createNewInvoice(activeInvoice.id, activeInvoice.tabName),
      );
      toast.info("Đã hủy và làm trống đơn hàng.");
    }
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleShortcuts = (e: KeyboardEvent) => {
      // Ctrl + I to add a new tab
      if (e.ctrlKey && e.key.toLowerCase() === "i") {
        e.preventDefault();
        handleTabAdd();
      }
      // F9 to checkout order
      if (e.key === "F9") {
        e.preventDefault();
        handleCheckoutSubmit();
      }
      // F4 to select exact amount
      if (e.key === "F4") {
        e.preventDefault();
        updateActiveInvoice({ customerPay: grandTotal });
        toast.info("Đã cập nhật số tiền khách trả khớp với hóa đơn!");
      }
    };
    window.addEventListener("keydown", handleShortcuts);
    return () => window.removeEventListener("keydown", handleShortcuts);
  }, [activeInvoice, grandTotal]);

  // Staff quay lại danh sách sản phẩm, các role khác quay lại trang chủ
  const backHref = getCachedUser()?.role === "STAFF" ? "/products" : "/dashboard";

  return (
    <div className="h-screen w-full flex flex-col gap-4 p-4 overflow-hidden bg-background">
      {/* Main Resizable Layout: Left Column Cart + Search | Right Column Billing Sidebar */}
      <ResizablePanelGroup direction={direction} className="flex-1 min-h-0 gap-4">
        {/* Left Side: Search + Active Tab + Cart Items list */}
        <ResizablePanel defaultSize={65} minSize={30}>
          <div className="h-full flex flex-col gap-4 min-h-0">
            <div className="flex flex-col gap-3 bg-card p-4 rounded-xl border shadow-sm shrink-0">
              {/* Tabs Control */}
              <CheckoutTabs
                tabs={invoices.map((inv) => ({
                  id: inv.id,
                  tabName: inv.tabName,
                }))}
                activeTabId={activeTabId}
                onTabChange={setActiveTabId}
                onTabAdd={handleTabAdd}
                onTabClose={handleTabClose}
              />

              {/* Product Autocomplete Lookup */}
              <ProductSearch onProductSelect={handleProductSelect} />
            </div>

            {/* Cart items list - scrollable wrapper */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              <CartItems
                items={activeInvoice.items}
                onQuantityChange={handleItemQuantityChange}
                onUnitPriceChange={handleItemUnitPriceChange}
                onDiscountChange={handleItemDiscountChange}
                onItemRemove={handleItemRemove}
              />
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle className="hidden lg:flex" />

        {/* Right Side: Billing details card */}
        <ResizablePanel defaultSize={35} minSize={25}>
          <div className="h-full min-h-0">
            <CheckoutSidebar
              totalQuantity={activeInvoice.items.reduce(
                (acc, item) => acc + item.quantity,
                0,
              )}
              subtotal={subtotal}
              grandTotal={grandTotal}
              discount={activeInvoice.discount}
              discountType={activeInvoice.discountType}
              selectedPromotionIds={activeInvoice.selectedPromotionIds}
              promotionDiscount={promotionDiscount}
              promotionNames={(activePromotionResult?.appliedPromotions ?? []).map(
                (p) => p.promoName,
              )}
              paymentMethod={activeInvoice.paymentMethod}
              customerPay={activeInvoice.customerPay}
              note={activeInvoice.note}
              selectedCustomer={activeInvoice.selectedCustomer}
              onCustomerChange={(customer) =>
                updateActiveInvoice({ selectedCustomer: customer })
              }
              onDiscountChange={(discount) => updateActiveInvoice({ discount })}
              onDiscountTypeChange={(type) =>
                updateActiveInvoice({ discountType: type })
              }
              onPaymentMethodChange={(method) =>
                updateActiveInvoice({ paymentMethod: method })
              }
              onCustomerPayChange={(pay) =>
                updateActiveInvoice({ customerPay: pay })
              }
              onNoteChange={(note) => updateActiveInvoice({ note })}
              onCheckout={handleCheckoutSubmit}
              onCancel={handleCancelOrder}
              onOpenNewCustomerModal={() => setIsCustomerModalOpen(true)}
              onOpenPromotionPicker={() => setIsPromotionPickerOpen(true)}
              onClearPromotion={() => updateActiveInvoice({ selectedPromotionIds: [] })}
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Quick modal forms */}
      <CustomerDialog
        open={isCustomerModalOpen}
        onOpenChange={setIsCustomerModalOpen}
        onCustomerAdded={(newCustomer) =>
          updateActiveInvoice({ selectedCustomer: newCustomer })
        }
      />

      <PromotionPickerDialog
        open={isPromotionPickerOpen}
        onOpenChange={setIsPromotionPickerOpen}
        branchId={resolveBranchId()}
        customerId={activeInvoice.selectedCustomer?.id}
        items={activeInvoice.items.map((item) => ({
          productItemId: item.productItemId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        }))}
        selectedPromotionIds={activeInvoice.selectedPromotionIds}
        onConfirm={(selectedPromotionIds) => updateActiveInvoice({ selectedPromotionIds })}
      />

      <ReceiptDialog
        open={isReceiptOpen}
        onOpenChange={setIsReceiptOpen}
        order={receiptOrder}
      />

      {qrOrderData && (
        <OrderQrDialog
          open={isQrDialogOpen}
          onOpenChange={setIsQrDialogOpen}
          orderId={qrOrderData.orderId}
          qrUrl={qrOrderData.qrUrl}
          paymentReference={qrOrderData.paymentReference}
          grandTotal={qrOrderData.grandTotal}
          onPaymentConfirmed={() => {
            setReceiptOrder(qrOrderData.receiptSnapshot);
            setIsReceiptOpen(true);
            setQrOrderData(null);
          }}
          onPaidOffline={({ customerPay, change }) => {
            // Đơn đã chuyển sang tiền mặt - hóa đơn phải phản ánh đúng phương thức
            setReceiptOrder({
              ...qrOrderData.receiptSnapshot,
              paymentMethod: "CASH",
              customerPay,
              change,
            });
            setIsReceiptOpen(true);
            setQrOrderData(null);
          }}
        />
      )}

      {/* Back button */}
      <Button
        asChild
        variant="outline"
        size="sm"
        className="fixed bottom-6 left-6 z-30 shadow-md"
      >
        <Link href={backHref}>
          <ArrowLeft className="size-4" />
          Quay lại
        </Link>
      </Button>
    </div>
  );
}
