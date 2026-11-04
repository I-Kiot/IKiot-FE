// Chỉ đọc: hóa đơn sinh ra từ vòng đời đơn hàng, không tạo từ đây.
import client from "@/lib/api/client";
import { useAuthStore } from "@/store/auth-store";
import { branchIdOf } from "@/lib/location-key";
import type { InvoiceDto, InvoiceQuery } from "@/types/invoice";
import type { Paginated } from "@/types/order-flow";

export const invoiceApi = {
  getList: async (params?: InvoiceQuery): Promise<Paginated<InvoiceDto>> => {
    // Cùng phạm vi như danh sách đơn: chi nhánh ở sidebar thu hẹp, còn "Tổng" thì không.
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
