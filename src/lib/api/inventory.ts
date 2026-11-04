import client from "@/lib/api/client";

export const inventoryApi = {
  // DELETE /inventory/:id: gỡ một mặt hàng khỏi kho; BE từ chối nếu tồn > 0.
  removeLocation: async (inventoryId: string): Promise<void> => {
    await client.delete(`/inventory/${inventoryId}`);
  },
};
