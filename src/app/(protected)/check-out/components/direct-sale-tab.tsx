"use client";

import React, { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { CheckoutTabs } from "./checkout-tabs";
import { ProductSearch } from "./product-search";
import { SalesBranchSelect } from "./sales-branch-select";
import { CancelCartDialog } from "./cancel-cart-dialog";
import { OverdueDrawerBanner } from "@/components/cash-drawer/overdue-drawer-banner";
import type { SalesBranch } from "../_hooks/use-sales-branch";
import { CartItems } from "./cart-items";
import { CheckoutSidebar } from "./checkout-sidebar";
import { CustomerDialog } from "./customer-dialog";
import { ReceiptDialog } from "./receipt-dialog";
import { OrderQrDialog } from "./order-qr-dialog";
import { PromotionPickerDialog } from "./promotion-picker-dialog";
import { orderApi } from "@/lib/api/order";
import { productApi } from "@/lib/api/product";
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

// Định dạng tiền cho thông báo lỗi thanh toán, cùng cách hiển thị với giỏ hàng.
const formatVND = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);

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

  // Đọc lại tồn của mọi dòng trong mọi hóa đơn nháp khi đổi nơi bán (nơi bán dùng chung cho các tab).
  // Tồn trong giỏ được chụp lúc thêm hàng, nên không đọc lại thì giỏ vẫn hiện tồn của nơi cũ.
  // Không tự giảm số lượng: thu ngân có thể đổi nơi bán lại; dòng thiếu được đánh dấu và bị chặn lúc thanh toán.
  useEffect(() => {
    if (!salesBranchId) return;
    const allItemIds = invoices.flatMap((invoice) =>
      invoice.items.map((item) => item.productItemId),
    );
    // BE nhận tối đa 100 id một lần; 10 hóa đơn nháp cùng lúc hiếm khi vượt.
    const itemIds = [...new Set(allItemIds)].slice(0, 100);
    if (itemIds.length === 0) return;

    // Đổi nơi bán liên tục thì response của nơi bán cũ về sau sẽ bị bỏ qua.
    let stale = false;
    productApi
      .search({
        itemIds: itemIds.join(","),
        locationId: salesBranchId,
        locationType: "BRANCH",
        limit: 100,
      })
      .then((res) => {
        if (stale) return;
        const freshById = new Map<
          string,
          { stock: number; stockAllLocations: number; availableStock: number }
        >();
        for (const product of res.data) {
          for (const item of product.items ?? []) {
            freshById.set(item.id, {
              stock: item.stock ?? 0,
              stockAllLocations: item.stockAllLocations ?? item.stock ?? 0,
              availableStock: item.availableStock ?? item.stock ?? 0,
            });
          }
        }

        // Ghép trên `prev` mới nhất theo productItemId, để dòng vừa thêm trong lúc chờ không bị mất.
        setInvoices((prev) =>
          prev.map((invoice) => ({
            ...invoice,
            items: invoice.items.map((line) => {
              const fresh = freshById.get(line.productItemId);
              if (!fresh) return line;
              return { ...line, ...fresh };
            }),
          })),
        );

        const shortNames = new Set<string>();
        for (const invoice of invoices) {
          for (const line of invoice.items) {
            const fresh = freshById.get(line.productItemId);
            if (fresh && line.quantity > fresh.availableStock) {
              shortNames.add(line.name);
            }
          }
        }
        if (shortNames.size > 0) {
          toast.warning(
            `Không đủ hàng tại nơi bán đã chọn: ${[...shortNames].join(", ")}`,
          );
        }
      })
      .catch((error) => {
        if (stale) return;
        console.error("Lỗi khi tải lại tồn kho theo nơi bán:", error);
        toast.error("Không tải lại được tồn kho tại nơi bán đã chọn.");
      });

    return () => {
      stale = true;
    };
    // Chỉ chạy khi đổi nơi bán; dòng thêm sau đó đã mang tồn đúng của nơi bán mới từ ô tìm hàng.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salesBranchId]);

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
  // Hóa đơn đang chờ xác nhận hủy; null = hộp xác nhận đóng.
  const [cancelTarget, setCancelTarget] = useState<{ id: string; tabName: string } | null>(null);
  const [qrOrderData, setQrOrderData] = useState<{
    orderId: string;
    qrUrl: string | null;
    expiresAt: string | null;
    paymentReference: string;
    grandTotal: number;
    receiptSnapshot: any;
    /** Giỏ hàng trước khi tab được dọn: "Lên lại đơn" khi đơn QR bị hủy. */
    cartSnapshot: InvoiceState;
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

  // Đơn QR đã hủy (tay hoặc hết hạn): trả giỏ về tab cũ nếu tab đó còn trống, không thì mở tab mới.
  const handleRestartFromQr = () => {
    const snapshot = qrOrderData?.cartSnapshot;
    setIsQrDialogOpen(false);
    setQrOrderData(null);
    if (!snapshot) return;
    const original = invoices.find((inv) => inv.id === snapshot.id);
    if (original && original.items.length === 0) {
      setInvoices((prev) => prev.map((inv) => (inv.id === snapshot.id ? snapshot : inv)));
      setActiveTabId(snapshot.id);
      return;
    }
    if (invoices.length >= 10) {
      toast.warning("Đã đủ 10 hóa đơn nháp, hãy đóng bớt một hóa đơn rồi lên lại đơn.");
      return;
    }
    const nextId = (Math.max(...invoices.map((inv) => parseInt(inv.id))) + 1).toString();
    setInvoices((prev) => [...prev, { ...snapshot, id: nextId, tabName: `Hóa đơn ${nextId}` }]);
    setActiveTabId(nextId);
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

  // Mỗi dòng không xuống dưới 0, khớp "Thành tiền" trong giỏ: giảm giá vượt thành tiền không còn bị cắt ở ô nhập
  // (thanh toán sẽ chặn), nên không chặn ở đây thì "Tổng tiền hàng" hiện số âm.
  const subtotal = useMemo(() => {
    return activeInvoice.items.reduce(
      (acc, item) =>
        acc + Math.max(0, item.quantity * (item.unitPrice - item.discountAmount)),
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

  // Điền tiền khách đưa đúng bằng tổng hóa đơn và báo cho thu ngân; nút "Đủ tiền" và phím F4 cùng gọi hàm này.
  const handleExactPay = () => {
    updateActiveInvoice({ customerPay: grandTotal });
    toast.info("Đã cập nhật số tiền khách trả khớp với hóa đơn!", {
      id: "exact-pay",
    });
  };

  const handleCheckoutSubmit = () => {
    if (activeInvoice.items.length === 0) {
      toast.error("Không thể thanh toán đơn hàng trống!");
      return;
    }

    // Giảm giá nhập theo từng cái, nên vượt đơn giá cũng là vượt thành tiền dòng. Từ chối, không tự cắt (BE cũng từ chối đơn như vậy).
    const overDiscounted = activeInvoice.items.filter(
      (item) => item.discountAmount > item.unitPrice,
    );
    if (overDiscounted.length > 0) {
      const details = overDiscounted
        .map(
          (item) =>
            `${item.name} (${formatVND(item.discountAmount * item.quantity)} > ${formatVND(item.unitPrice * item.quantity)})`,
        )
        .join(", ");
      toast.error(`Giảm giá vượt thành tiền dòng: ${details}`);
      return;
    }

    // Tồn có thể đã đổi khi đổi nơi bán; chặn ở đây thay vì để BE báo "Hàng trên kệ không đủ".
    const shortLines = activeInvoice.items.filter(
      (item) => item.quantity > item.availableStock,
    );
    if (shortLines.length > 0) {
      const details = shortLines
        .map((item) => `${item.name} (cần ${item.quantity}, còn ${item.availableStock})`)
        .join(", ");
      toast.error(`Không đủ hàng tại nơi bán đã chọn: ${details}`);
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
      // POS nhập giảm giá theo từng cái, còn BE hiểu `discountAmount` là giảm của cả dòng: nhân số lượng để hai bên cùng một con số.
      items: activeInvoice.items.map((item) => ({
        productItemId: item.productItemId,
        quantity: item.quantity,
        discountAmount: item.discountAmount * item.quantity,
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

        if (activeInvoice.paymentMethod === "SEPAY") {
          // SEPAY: hiện QR dialog, chờ xác nhận payment
          setQrOrderData({
            orderId,
            // Null (server không cấp được mã) thì dialog hiện view hết hạn, không vẽ ảnh.
            qrUrl: response.data.qrUrl ?? null,
            expiresAt: response.data.qrExpiresAt ?? null,
            cartSnapshot: activeInvoice,
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

  // Mở hộp xác nhận hủy trong ứng dụng thay cho `confirm()` của trình duyệt (hộp gốc chặn trang và chặn test tự động).
  // Ghi lại đúng hóa đơn lúc mở hộp: đổi tab trong lúc hộp đang mở cũng không xóa nhầm hóa đơn khác.
  const handleCancelOrder = () => {
    setCancelTarget({ id: activeInvoice.id, tabName: activeInvoice.tabName });
  };

  // Xác nhận hủy: làm trống đúng hóa đơn đã ghi lại, không gọi BE nên không tạo đơn.
  const handleConfirmCancel = () => {
    if (!cancelTarget) return;
    setInvoices((prev) =>
      prev.map((invoice) =>
        invoice.id === cancelTarget.id
          ? createNewInvoice(invoice.id, invoice.tabName)
          : invoice,
      ),
    );
    setCancelTarget(null);
    toast.success("Đã huỷ và làm trống đơn hàng");
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
        handleExactPay();
      }
    };
    window.addEventListener("keydown", handleShortcuts);
    return () => window.removeEventListener("keydown", handleShortcuts);
    // `salesBranchId` phải có ở đây: thiếu thì F9 ngay sau khi đổi nơi bán vẫn gửi đơn theo nơi bán cũ.
  }, [activeInvoice, grandTotal, salesBranchId]);

  // Staff quay lại danh sách sản phẩm, các role khác quay lại trang chủ

  return (
    <div className="h-full w-full flex flex-col gap-4 p-4 overflow-hidden bg-background">
      {/* Két chi nhánh này còn mở từ ngày trước: cảnh báo, không chặn bán (chặn bán là quyết định của chủ shop, chưa có cài đặt). */}
      <OverdueDrawerBanner branchId={salesBranchId} className="shrink-0" />
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
              canCheckout={
                subtotal > 0 ||
                activeInvoice.items.some((item) => item.discountAmount > item.unitPrice)
              }
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
              onExactPay={handleExactPay}
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

      <CancelCartDialog
        open={cancelTarget !== null}
        onOpenChange={(open) => {
          if (!open) setCancelTarget(null);
        }}
        tabName={cancelTarget?.tabName ?? ""}
        onConfirm={handleConfirmCancel}
      />

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
          expiresAt={qrOrderData.expiresAt}
          onRestart={handleRestartFromQr}
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
