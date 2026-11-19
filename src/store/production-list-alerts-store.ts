import { create } from "zustand";
import { productionRequestApi } from "@/lib/api/production-request";
import type { ProductionListRow } from "@/types/order-flow";

interface ProductionListAlertsState {
  /** Số mặt hàng đơn đang cần mà kho và xưởng chưa lo đủ, và đặt xưởng làm được. `null` = chưa tải lần nào. */
  needCount: number | null;
  /** Không throw: lỗi làm mới badge không được hiện thành lỗi trên mọi trang. */
  fetchNeed: () => Promise<void>;
}

// Trần `limit` của mọi danh sách phân trang ở BE.
const PAGE_LIMIT = 100;

/**
 * Dòng cần đặt xưởng: còn thiếu sau tồn kho, hàng đang đặt và nháp (`shortQuantity`), và làm được ở xưởng.
 * Hàng chỉ nhập từ NCC không đếm: trang hiện "Nhập từ NCC" cho nó, không có nút "Thêm vào yêu cầu".
 */
function needsWorkshopOrder(row: ProductionListRow): boolean {
  return row.isManufacturable && row.shortQuantity > 0;
}

/** Số cảnh báo của "Danh sách cần sản xuất" trên sidebar và trên nút cùng tên ở màn Nhập hàng. */
export const useProductionListAlertsStore = create<ProductionListAlertsState>((set) => ({
  needCount: null,
  fetchNeed: async () => {
    try {
      // BE chỉ trả tổng số dòng thiếu (gồm cả hàng nhập từ NCC), nên tải hết các trang rồi lọc (thường chỉ một trang).
      // Bộ lọc giống mặc định của trang: chỉ hàng còn thiếu, mọi kho.
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
