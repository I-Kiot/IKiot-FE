// [API – Invoice] Read-only: invoices are produced by the order lifecycle, never created from here.
import client from "@/lib/api/client";
import { useAuthStore } from "@/store/auth-store";
import { branchIdOf } from "@/lib/location-key";
import type { InvoiceDto, InvoiceQuery } from "@/types/invoice";
import type { Paginated } from "@/types/order-flow";

export const invoiceApi = {
  getList: async (params?: InvoiceQuery): Promise<Paginated<InvoiceDto>> => {
    // Same scoping the order list uses: the sidebar's branch narrows it, "Tổng" does not.
    const branchId = branchIdOf(useAuthStore.getState().locationKey);
    const res = await client.get<Paginated<InvoiceDto>>("/invoices", {
      params: { ...(branchId ? { branchId } : {}), ...params },
    });
    return { data: res.data.data, pagination: res.data.pagination };
  },

  getById: async (id: string): Promise<InvoiceDto> => {
    const res = await client.get<{ success: boolean; data: InvoiceDto }>(`/invoices/${id}`);
    return res.data.data;
  },
};
