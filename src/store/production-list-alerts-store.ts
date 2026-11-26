import { create } from "zustand";
import { productionRequestApi } from "@/lib/api/production-request";
import type { ProductionListRow } from "@/types/order-flow";

interface ProductionListAlertsState {
  /** Số mặt hàng cần đặt xưởng; null là chưa tải. */
  needCount: number | null;
  /** Không throw: lỗi làm mới badge không được hiện thành lỗi trên mọi trang. */
  fetchNeed: () => Promise<void>;
}

// Trần `limit` của mọi danh sách phân trang ở BE.
const PAGE_LIMIT = 100;

/** Dòng cần đặt xưởng: còn thiếu và làm được ở xưởng. */
function needsWorkshopOrder(row: ProductionListRow): boolean {
  return row.isManufacturable && row.shortQuantity > 0;
}

/** Số cảnh báo của "Danh sách cần sản xuất" trên sidebar và trên nút cùng tên ở màn Nhập hàng. */
export const useProductionListAlertsStore = create<ProductionListAlertsState>((set) => ({
  needCount: null,
  fetchNeed: async () => {
    try {
      // Tải hết các trang rồi lọc.
      let count = 0;
      let page = 1;
      let totalPages = 1;
      while (page <= totalPages) {
        const result = await productionRequestApi.getProductionList({
          page,
          limit: PAGE_LIMIT,
          onlyShort: true,
        });
        count += result.data.filter(needsWorkshopOrder).length;
        totalPages = result.pagination.totalPages;
        page += 1;
      }
      set({ needCount: count });
    } catch {
      // Giữ số liệu của lần tải thành công gần nhất.
    }
  },
}));
