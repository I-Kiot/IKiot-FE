// [Hook – Production] The pick-lists a production request is built from: the workshops it can be
// sent to and the locations goods can be delivered to. Loaded once per dialog opening; products
// are searched as typed (`MovementProductSearch`, catalogue scope).
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
      // Only workshops take production requests (SUPPLIER_NOT_WORKSHOP otherwise).
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
