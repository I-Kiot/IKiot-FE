import client from "@/lib/api/client";
import type { Paginated } from "@/types/order-flow";
import type {
  SepayResolution,
  SepayTransaction,
  SepayTransactionQuery,
} from "@/types/sepay-transaction";

export const sepayTransactionApi = {
  getList: async (params?: SepayTransactionQuery): Promise<Paginated<SepayTransaction>> => {
    const res = await client.get<Paginated<SepayTransaction>>("/sepay-transactions", { params });
    return { data: res.data.data, pagination: res.data.pagination };
  },

  /** Đánh dấu đã xử lý (một lần). `REFUNDED_MANUALLY` chỉ được với khoản đã vào sổ là thu chưa gắn đơn. */
  resolve: async (
    id: string,
    payload: { resolution: SepayResolution; note?: string },
  ): Promise<SepayTransaction> => {
    const res = await client.post<{ success: boolean; data: SepayTransaction }>(
      `/sepay-transactions/${id}/resolve`,
      payload,
    );
    return res.data.data;
  },
};
