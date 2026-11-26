import client from "@/lib/api/client";

/** Body chung của ba route hàng hỏng. */
export interface DamagedStockPayload {
  quantity: number;
  orderItemId?: string;
  note?: string;
}

export type DamagedAction = "mark" | "repair" | "writeOff";

const DAMAGED_ROUTE: Record<DamagedAction, string> = {
  mark: "mark-damaged",
  repair: "repair-damaged",
  writeOff: "write-off-damaged",
};

export const inventoryApi = {
  // DELETE /inventory/:id: gỡ một mặt hàng khỏi kho; BE từ chối nếu còn hàng, kể cả hàng hỏng.
  removeLocation: async (inventoryId: string): Promise<void> => {
    await client.delete(`/inventory/${inventoryId}`);
  },

  /** Đánh dấu hỏng / sửa xong / huỷ hàng hỏng trên một dòng tồn. */
  changeDamaged: async (
    inventoryId: string,
    action: DamagedAction,
    payload: DamagedStockPayload,
  ): Promise<void> => {
    await client.post(`/inventory/${inventoryId}/${DAMAGED_ROUTE[action]}`, payload);
  },
};
