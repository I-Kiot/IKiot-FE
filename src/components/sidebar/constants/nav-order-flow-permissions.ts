/**
 * Các mục submenu của hành trình đơn (P0-7): "Đơn hàng" và "Vận hành". Mỗi URL ghi quyền mà route danh sách cần ở backend (docs/api-contract-order-flow.md).
 * `getAllowedSidebarUrls` đọc kết quả này nên mục bị lọc ở đây cũng bị chặn khi gõ URL tay. "Hoá đơn" không có trong map nên vẫn hiện như cũ.
 */
import { allows } from "./role-permissions";

const ORDER_FLOW_NAV_PERMISSION: Record<string, readonly [string, string]> = {
  "/sales/orders/new": ["orders", "create"],
  "/sales/orders": ["orders", "read"],
  "/order-returns": ["returns", "read"],
  // Không dùng ["fulfillments", "read"]: cặp này không có trong CATALOG nên menu sẽ ẩn với mọi STAFF.
  // Màn này chỉ để đóng gói; xem được danh sách còn cần `orders:read` (GET /orders).
  "/fulfillments": ["orders", "pack"],
  "/shipments": ["shipments", "read"],
};

export function filterOrderFlowNavItems<T extends { title: string; url: string }>(
  items: T[],
  userRole?: string | null,
): T[] {
  return items.filter((item) => {
    const permission = ORDER_FLOW_NAV_PERMISSION[item.url];
    if (!permission) return true;
    return allows(userRole, permission[0], permission[1]);
  });
}
