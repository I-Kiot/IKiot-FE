"use client";

import React, { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { CheckoutTabs } from "./checkout-tabs";
import { ProductSearch } from "./product-search";
import { SalesBranchSelect } from "./sales-branch-select";
import type { SalesBranch } from "../_hooks/use-sales-branch";
import { CartItems } from "./cart-items";
import { CheckoutSidebar } from "./checkout-sidebar";
import { CustomerDialog } from "./customer-dialog";
import { ReceiptDialog } from "./receipt-dialog";
import { OrderQrDialog } from "./order-qr-dialog";
import { PromotionPickerDialog } from "./promotion-picker-dialog";
import { orderApi } from "@/lib/api/order";
import { promotionApi } from "@/lib/api/promotion";
import { getMyTenant } from "@/lib/api/tenant";
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
  stock: number;
  stockAllLocations: number;
  /** Số bán được ngay (tồn trên kệ; combo = số bộ): số lượng trong giỏ không được vượt quá. */
  availableStock: number;
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
  /** Khuyến mãi gán tay qua picker "Gán giảm giá": tối đa 2, và nếu có 2 thì cả hai phải cộng dồn được. */
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

export function DirectSaleTab({ sales }: { sales: SalesBranch }) {
  const { branches, branchId: salesBranchId } = sales;
  const [invoices, setInvoices] = useState<InvoiceState[]>([
    createNewInvoice("1", "Hóa đơn 1"),
  ]);
  const [activeTabId, setActiveTabId] = useState<string>("1");
  const [sepayNotLinked, setSepayNotLinked] = useState(false);

  // Không đọc được thì để nguyên: BE vẫn từ chối phát QR khi chưa liên kết.
  useEffect(() => {
    getMyTenant()
      .then((tenant) => {
        if (tenant.hasSepayKey) return;
        setSepayNotLinked(true);
        setInvoices((prev) =>
          prev.map((inv) =>
            inv.paymentMethod === "SEPAY" ? { ...inv, paymentMethod: "CASH" } : inv,
          ),
        );
      })
      .catch(() => {});
  }, []);
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

  // Chi nhánh bán được xác định giống nhau cho preview khuyến mãi và payload đơn cuối.
  const resolveBranchId = (): string => salesBranchId;

  // Preview giảm giá cho khuyến mãi gán tay của hóa đơn đang chọn.
  // Kèm signature (giỏ + id khuyến mãi) lúc tính; kết quả cũ còn đang bay sẽ bị bỏ qua khi render, không xoá bằng setState trong effect.
  const [promotionResult, setPromotionResult] = useState<
    (PromotionCalculateResponse & { signature: string }) | null
  >(null);

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

  const activeInvoice = useMemo(() => {
    return invoices.find((inv) => inv.id === activeTabId) || invoices[0];
  }, [invoices, activeTabId]);

  const updateActiveInvoice = (updates: Partial<InvoiceState>) => {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === activeTabId ? { ...inv, ...updates } : inv,
      ),
    );
  };

  // Signature của giỏ (items + khách) trên hóa đơn đang chọn; dùng để khoá tính khuyến mãi và truyền vào picker.
  const cartSignature = useMemo(() => {
    if (activeInvoice.items.length === 0) return null;
    const itemsKey = activeInvoice.items
      .map((item) => `${item.productItemId}:${item.quantity}:${item.unitPrice}`)
      .join(",");
    return `${itemsKey}|${activeInvoice.selectedCustomer?.id ?? ""}`;
  }, [activeInvoice.items, activeInvoice.selectedCustomer]);

  // Signature mà promotionResult hiện tại hợp lệ; gồm id khuyến mãi nên đổi (hoặc bỏ) lựa chọn cũng làm kết quả cũ mất hiệu lực.
  const promotionSignature = useMemo(() => {
    if (!cartSignature || activeInvoice.selectedPromotionIds.length === 0) return null;
    return `${cartSignature}|${[...activeInvoice.selectedPromotionIds].sort().join(",")}`;
  }, [cartSignature, activeInvoice.selectedPromotionIds]);

  // Tính lại giảm giá khi giỏ hoặc lựa chọn khuyến mãi đổi (debounce). Nếu khuyến mãi không còn đủ điều kiện (vd giỏ dưới minOrderValue),
  // BE từ chối cả lựa chọn: bỏ chọn để người dùng gán lại.
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
  }, [promotionSignature, branches, salesBranchId]);

  // Bỏ qua kết quả tính cho giỏ/lựa chọn khác (đổi tab, đang sửa, hoặc vừa bỏ chọn).
  const activePromotionResult =
    promotionResult?.signature === promotionSignature ? promotionResult : null;
  const promotionDiscount = activePromotionResult?.totalDiscount ?? 0;
  const hasPromotionApplied = activeInvoice.selectedPromotionIds.length > 0;

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

  const handleTabClose = (id: string) => {
    if (invoices.length === 1) return;

    const index = invoices.findIndex((inv) => inv.id === id);
    const updated = invoices.filter((inv) => inv.id !== id);
    setInvoices(updated);

    if (activeTabId === id) {
      const nextActiveIndex = index > 0 ? index - 1 : 0;
      setActiveTabId(updated[nextActiveIndex].id);
    }
    toast.info("Đã xóa hóa đơn nháp.");
  };

  const handleProductSelect = (product: any) => {
    const existingIndex = activeInvoice.items.findIndex(
      (item) => item.productItemId === product.id,
    );

    if (existingIndex > -1) {
      const current = activeInvoice.items[existingIndex];
      // Chọn lại món đã có thì +1, nhưng không vượt số có trên kệ.
      if (current.quantity + 1 > current.availableStock) {
        toast.warning(`${product.name} chỉ còn ${current.availableStock} trên kệ`);
        return;
      }
      const updatedItems = [...activeInvoice.items];
      updatedItems[existingIndex] = { ...current, quantity: current.quantity + 1 };
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
        stock: product.stock,
        stockAllLocations: product.stockAllLocations,
        availableStock: product.availableStock,
      };
      updateActiveInvoice({ items: [...activeInvoice.items, newItem] });
      toast.success(`Đã thêm ${product.name} vào giỏ hàng`);
    }
  };

  const handleItemQuantityChange = (
    productItemId: string,
    quantity: number,
  ) => {
    const target = activeInvoice.items.find((item) => item.productItemId === productItemId);
    // Gõ số lượng lớn hơn số trên kệ thì kéo về đúng số trên kệ (và báo), không để giỏ vượt tồn.
    if (target && quantity > target.availableStock) {
      toast.warning(`${target.name} chỉ còn ${target.availableStock} trên kệ`);
      quantity = target.availableStock;
    }
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

  const subtotal = useMemo(() => {
    return activeInvoice.items.reduce(
      (acc, item) =>
        acc + item.quantity * (item.unitPrice - item.discountAmount),
      0,
    );
  }, [activeInvoice.items]);

  // Khuyến mãi gán và giảm giá tay cấp đơn loại trừ nhau: khi đã gán khuyến mãi thì nó thắng, giảm giá tay bị bỏ qua.
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

  // Kéo tiền khách đưa theo tổng khi tổng giảm, hoặc khi không phải tiền mặt.
  useEffect(() => {
    if (
      activeInvoice.paymentMethod !== "CASH" ||
      activeInvoice.customerPay < grandTotal
    ) {
      updateActiveInvoice({ customerPay: grandTotal });
    }
  }, [grandTotal]);

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
      toast.error("Vui lòng chọn nơi bán!");
      return;
    }

    // Chụp giỏ lúc preview khuyến mãi được tính, phải lấy ngay vì hóa đơn reset ngay khi tạo đơn thành công.
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

    // Payload chỉ gửi những gì BE cần: POST /orders tự tính tổng từ các dòng và giảm giá từ engine khuyến mãi.
    // `discountType: "PROMOTION"` bị BE từ chối (@IsIn(['ORDER']), 400); gửi `appliedPromotions` đã đủ để thành đơn khuyến mãi.
    // `ORDER` (giảm giá tay cả đơn) vẫn gửi kèm giá trị. Không gửi `grandTotal`, `unitPrice`, `productName`: server tự định giá từ catalogue.
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

        // Ghi nhận lượt dùng khuyến mãi sau khi đơn đã tạo, best-effort: đơn đã thu tiền nên lỗi ghi log không chặn luồng thanh toán.
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

  useEffect(() => {
    const handleShortcuts = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === "i") {
        e.preventDefault();
        handleTabAdd();
      }
      if (e.key === "F9") {
        e.preventDefault();
        handleCheckoutSubmit();
      }
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

  return (
    <div className="h-full w-full flex flex-col gap-4 p-4 overflow-hidden bg-background">
      <ResizablePanelGroup direction={direction} className="flex-1 min-h-0 gap-4">
        <ResizablePanel defaultSize={65} minSize={30}>
          <div className="h-full flex flex-col gap-4 min-h-0">
            <div className="flex flex-col gap-3 bg-card p-4 rounded-xl border shadow-sm shrink-0">
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

              <ProductSearch
                onProductSelect={handleProductSelect}
                location={salesBranchId ? { id: salesBranchId, type: "BRANCH" } : null}
              />
            </div>

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
              sepayNotLinked={sepayNotLinked}
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
              branchSelect={<SalesBranchSelect sales={sales} />}
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

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
    </div>
  );
}
