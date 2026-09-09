"use client";

import { useCallback, useEffect, useState } from "react";
import {
  resolveItemImportPrice,
  stockMovementApi,
} from "@/lib/api/stock-movement";
import {
  buildRetailPriceByItemId,
  getOpeningRowFieldErrors,
  type OpeningRowFieldErrors,
} from "@/app/(protected)/exchange/shared/movement-detail-validation";
import type {
  StockMovement,
  StockMovementProductItemOption,
} from "@/types/stock-movement";

async function fetchMovement(id: string, fallback: StockMovement) {
  try {
    return await stockMovementApi.getById(id);
  } catch {
    return fallback;
  }
}

/** Load chi tiết phiếu khi expand row (GET-by-id để có đủ tên SP). */
export function useStockMovementDetail(
  request: StockMovement,
  isExpanded: boolean,
) {
  const [detail, setDetail] = useState(request);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isExpanded) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      const next = await fetchMovement(request.id, request);
      if (!cancelled) {
        setDetail(next);
        setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [isExpanded, request]);

  const refreshDetail = useCallback(async () => {
    setLoading(true);
    setDetail(await fetchMovement(request.id, request));
    setLoading(false);
  }, [request]);

  return { detail, loading, refreshDetail };
}

export type OpeningDetailRow = {
  productItemId: string;
  quantity: number;
  importPrice: number;
  note?: string;
};

/** State + CRUD dòng OPENING/PENDING + load products tại nguồn/đích. */
export function useOpeningEditor({
  isExpanded,
  detail,
  enabled,
  requireImportPrice = false,
}: {
  isExpanded: boolean;
  detail: StockMovement;
  enabled: boolean;
  /** IMPORT bắt buộc giá; EXPORT/RETURN không (khớp BE). */
  requireImportPrice?: boolean;
}) {
  const [openingDetails, setOpeningDetails] = useState<OpeningDetailRow[]>([]);
  const [openingProducts, setOpeningProducts] = useState<
    StockMovementProductItemOption[]
  >([]);
  /** Catalog tenant - enrich hiển thị + search pick (IMPORT). */
  const [catalogProducts, setCatalogProducts] = useState<
    StockMovementProductItemOption[]
  >([]);
  const [openingRowErrors, setOpeningRowErrors] = useState<
    OpeningRowFieldErrors[]
  >([]);
  const [receivedQtys, setReceivedQtys] = useState<Record<string, number>>({});
  const [showReceiveForm, setShowReceiveForm] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    if (!isExpanded) {
      setShowReceiveForm(false);
      setReceivedQtys({});
      setOpeningDetails([]);
      setOpeningProducts([]);
      setCatalogProducts([]);
      setOpeningRowErrors([]);
      return;
    }

    const canSeedDetails =
      enabled &&
      (detail.status === "OPENING" ||
        (detail.movementType === "IMPORT" && detail.status === "PENDING"));

    if (canSeedDetails) {
      setOpeningDetails((prev) => {
        if (prev.length > 0) return prev;
        return detail.details.map((item) => ({
          productItemId: item.productItemId,
          quantity: item.quantity,
          importPrice: item.importPrice ?? 0,
          note: item.note,
        }));
      });
    }

    if (
      showReceiveForm &&
      (detail.status === "IN_TRANSIT" ||
        (detail.movementType === "IMPORT" && detail.status === "PENDING"))
    ) {
      setReceivedQtys((prev) => {
        if (Object.keys(prev).length > 0) return prev;
        return Object.fromEntries(
          detail.details.map((item) => [item.productItemId, item.quantity]),
        );
      });
    }
  }, [isExpanded, showReceiveForm, detail, enabled]);

  useEffect(() => {
    if (!isExpanded) {
      setOpeningProducts([]);
      setCatalogProducts([]);
      return;
    }

    let cancelled = false;

    // EXPORT/RETURN OPENING: products at source
    if (
      enabled &&
      detail.status === "OPENING" &&
      detail.fromLocationId &&
      detail.fromLocationType
    ) {
      stockMovementApi
        .getProductItemsAtSource(detail.fromLocationId, detail.fromLocationType)
        .then((items) => {
          if (!cancelled) setOpeningProducts(items);
        })
        .catch(() => {
          if (!cancelled) setOpeningProducts([]);
        });
      return () => {
        cancelled = true;
      };
    }

    // IMPORT: dropdown = toàn catalog. NCC chỉ là thông tin trên giấy tờ, không ràng buộc
    // hàng hóa - trước đây dropdown chỉ liệt kê SP đã gắn NCC nên hàng mới nhập lần đầu
    // của một NCC không bao giờ chọn được.
    if (detail.movementType === "IMPORT") {
      stockMovementApi
        .getCatalogProductItems()
        .then((catalog) => {
          if (cancelled) return;
          setOpeningProducts(catalog);
          setCatalogProducts(catalog);
        })
        .catch(() => {
          if (cancelled) return;
          setOpeningProducts([]);
          setCatalogProducts([]);
        });
      return () => {
        cancelled = true;
      };
    }

    setOpeningProducts([]);
    setCatalogProducts([]);
    return () => {
      cancelled = true;
    };
  }, [
    isExpanded,
    enabled,
    detail.status,
    detail.movementType,
    detail.fromLocationId,
    detail.fromLocationType,
  ]);

  // Khi catalog/NCC có retailPrice → re-validate
  useEffect(() => {
    if (!isExpanded || !enabled || !requireImportPrice) return;
    if (openingDetails.length === 0) return;
    const retailSource =
      catalogProducts.length > 0 ? catalogProducts : openingProducts;
    if (retailSource.length === 0) return;
    setOpeningRowErrors(
      getOpeningRowFieldErrors(openingDetails, {
        requireImportPrice: true,
        retailPriceByItemId: buildRetailPriceByItemId(retailSource),
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
  }, [isExpanded, enabled, requireImportPrice, openingProducts, catalogProducts]);

  const getValidateOptions = useCallback(
    (products?: StockMovementProductItemOption[]) => {
      const retailSource =
        products ??
        (catalogProducts.length > 0 ? catalogProducts : openingProducts);
      return {
        requireImportPrice,
        retailPriceByItemId: requireImportPrice
          ? buildRetailPriceByItemId(retailSource)
          : undefined,
      };
    },
    [openingProducts, catalogProducts, requireImportPrice],
  );

  const updateOpeningRow = (
    idx: number,
    patch: Partial<OpeningDetailRow>,
  ) => {
    setOpeningDetails((prev) => {
      const next = prev.map((row, rowIdx) =>
        rowIdx === idx ? { ...row, ...patch } : row,
      );
      setOpeningRowErrors(getOpeningRowFieldErrors(next, getValidateOptions()));
      return next;
    });
  };

  const addOpeningRow = () => {
    setOpeningDetails((prev) => [
      ...prev,
      { productItemId: "", quantity: 1, importPrice: 0, note: "" },
    ]);
    setOpeningRowErrors((prev) => [...prev, {}]);
  };

  const ensureOpeningProduct = useCallback(
    (item: StockMovementProductItemOption) => {
      // IMPORT: giữ openingProducts = SP NCC; hàng từ ô tìm gắn vào catalog
      if (detail.movementType === "IMPORT") {
        setCatalogProducts((prev) =>
          prev.some((p) => p.id === item.id) ? prev : [...prev, item],
        );
        return;
      }
      setOpeningProducts((prev) =>
        prev.some((p) => p.id === item.id) ? prev : [...prev, item],
      );
    },
    [detail.movementType],
  );

  const pickOpeningProduct = useCallback(
    (item: StockMovementProductItemOption) => {
      ensureOpeningProduct(item);
      const importPrice = Math.min(
        Math.max(0, resolveItemImportPrice(item)),
        1_000_000_000_000,
      );
      setOpeningDetails((prev) => {
        const emptyIdx = prev.findIndex((row) => !row.productItemId);
        const row: OpeningDetailRow = {
          productItemId: item.id,
          quantity: 1,
          importPrice,
          note: "",
        };
        if (emptyIdx >= 0) {
          return prev.map((r, i) => (i === emptyIdx ? { ...r, ...row } : r));
        }
        return [...prev, row];
      });
    },
    [ensureOpeningProduct],
  );

  const removeOpeningRow = (idx: number) => {
    setOpeningDetails((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((_, rowIdx) => rowIdx !== idx);
      setOpeningRowErrors(getOpeningRowFieldErrors(next, getValidateOptions()));
      return next;
    });
  };

  const buildOpeningPayload = () =>
    openingDetails.map((item) => {
      const price = Number(item.importPrice) || 0;
      return {
        productItemId: item.productItemId,
        quantity: Number(item.quantity) || 0,
        ...(requireImportPrice || price > 0 ? { importPrice: price } : {}),
        note: item.note?.trim() || undefined,
      };
    });

  const validateOpening = () => {
    const payload = buildOpeningPayload();
    const rowErrors = getOpeningRowFieldErrors(payload, getValidateOptions());
    setOpeningRowErrors(rowErrors);
    return {
      payload,
      ok: !rowErrors.some(
        (e) => !!(e.productItemId || e.quantity || e.importPrice),
      ),
    };
  };

  const runAction = async (fn: () => Promise<void>) => {
    setIsActionLoading(true);
    try {
      await fn();
    } finally {
      setIsActionLoading(false);
    }
  };

  return {
    openingDetails,
    openingProducts,
    catalogProducts,
    openingRowErrors,
    receivedQtys,
    setReceivedQtys,
    showReceiveForm,
    setShowReceiveForm,
    isActionLoading,
    updateOpeningRow,
    addOpeningRow,
    pickOpeningProduct,
    ensureOpeningProduct,
    removeOpeningRow,
    validateOpening,
    runAction,
  };
}
