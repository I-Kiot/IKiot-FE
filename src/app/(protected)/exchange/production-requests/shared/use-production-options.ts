"use client";

import * as React from "react";
import { toast } from "sonner";
import { supplierApi } from "@/lib/api/supplier";
import { stockMovementApi } from "@/lib/api/stock-movement";
import type { StockMovementLocationOption } from "@/types/stock-movement";

export interface WorkshopOption {
  id: string;
  name: string;
}

export interface ProductionOptions {
  workshops: WorkshopOption[];
  locations: StockMovementLocationOption[];
  loading: boolean;
}

export function useProductionOptions(): ProductionOptions {
  const [state, setState] = React.useState<ProductionOptions>({
    workshops: [],
    locations: [],
    loading: true,
  });

  React.useEffect(() => {
    let stale = false;
    Promise.all([
      // Chỉ xưởng mới nhận yêu cầu sản xuất (không thì BE trả SUPPLIER_NOT_WORKSHOP).
      supplierApi.getList({ type: "WORKSHOP", limit: 100 }),
      stockMovementApi.getLocationOptions(),
    ])
      .then(([workshops, locations]) => {
        if (stale) return;
        setState({
          workshops: workshops.data.map((w) => ({ id: w.id, name: w.supplierName })),
          locations,
          loading: false,
        });
      })
      .catch(() => {
        if (stale) return;
        toast.error("Không tải được danh sách xưởng / kho");
        setState((prev) => ({ ...prev, loading: false }));
      });
    return () => {
      stale = true;
    };
  }, []);

  return state;
}
