"use client";

import * as React from "react";
import { productApi } from "@/lib/api/product";
import type { OrderLineDraft } from "../new/components/order-lines-editor";

type StockLocation = { id: string; type: "BRANCH" | "WAREHOUSE" } | null;

/** Đổi nguồn hàng thì đọc lại tồn của các dòng đã có, nếu không badge "Đủ hàng" nói về nơi khác. Lần đầu không đọc: dòng đã có tồn đúng lúc được thêm. */
export function useLineStockAt(
  location: StockLocation,
  lines: readonly OrderLineDraft[],
  setLines: React.Dispatch<React.SetStateAction<OrderLineDraft[]>>,
) {
  const key = location ? `${location.type}:${location.id}` : "";
  const readKey = React.useRef(key);

  React.useEffect(() => {
    if (key === readKey.current) return;
    readKey.current = key;
    if (!location || lines.length === 0) return;
    let stale = false;
    Promise.all(
      lines.map((line) =>
        productApi.search({
          q: line.sku,
          limit: 10,
          status: "ACTIVE",
          locationId: location.id,
          locationType: location.type,
        }),
      ),
    )
      .then((results) => {
        if (stale) return;
        const stock = new Map(
          results.flatMap((res) =>
            res.data.flatMap((product) =>
              (product.items ?? []).map((item) => [item.id, item.stock ?? 0] as const),
            ),
          ),
        );
        setLines((current) =>
          current.map((line) => ({
            ...line,
            stock: stock.get(line.productItemId) ?? line.stock,
          })),
        );
      })
      .catch(() => {
        // Tồn chỉ để tham khảo; đọc lỗi thì giữ số cũ.
      });
    return () => {
      stale = true;
    };
    // Chỉ đọc lại khi đổi nguồn; `location` và `lines` là giá trị tại lúc đổi.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
