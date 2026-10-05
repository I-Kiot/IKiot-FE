/**
 * Which order-journey submenu entries to draw (P0-7, 2026-10-02) - "Đơn hàng" and
 * "Vận hành". Each URL names the permission its list route is gated on server-side
 * (Ikiot_BE/docs/api-contract-order-flow.md), the same way `nav-exchange-permissions.ts`
 * does for "Giao dịch". `getAllowedSidebarUrls` reads the result, so an entry filtered out
 * here is also refused when its URL is typed by hand.
 *
 * "Hoá đơn" (`/sales/invoices`) is deliberately absent: it was drawn for everyone before
 * this file existed, and a URL missing from the map keeps that behaviour.
 */
import { allows } from "./role-permissions";

const ORDER_FLOW_NAV_PERMISSION: Record<string, readonly [string, string]> = {
  "/sales/orders": ["orders", "read"],
  "/order-returns": ["returns", "read"],
  // [C-6] SỬA: trước là ["fulfillments", "read"] - cặp này không có trong CATALOG nên menu bị ẩn với mọi STAFF.
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
