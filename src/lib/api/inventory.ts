import client from "@/lib/api/client";

export const inventoryApi = {
  // DELETE /inventory/:id - removes a product item from a location; BE rejects if stock > 0
  removeLocation: async (inventoryId: string): Promise<void> => {
    await client.delete(`/inventory/${inventoryId}`);
  },
};
