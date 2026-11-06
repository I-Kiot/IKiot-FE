/**
 * Mục submenu "Giao dịch" nào được vẽ. Nhóm này từng thiếu hẳn trong sidebar STAFF nên vai trò có đủ quyền vẫn không
 * vào được nhập, chuyển, điều chỉnh kho. Mỗi mục gắn với quyền backend kiểm tra cho màn đó, giống `nav-hr-permissions.ts`.
 * Một mục có nhiều cặp quyền thì giữ một trong các cặp là vào được.
 */
import { allows } from "@/components/sidebar/constants/role-permissions";
import { INBOUND_READ_PERMISSIONS } from "./inbound-source";

const EXCHANGE_NAV_PERMISSION = {
  // Quyền đọc là điểm vào của mọi màn; tạo, duyệt, nhận được kiểm từng nút trong màn.
  suppliers: [["suppliers", "read"]],
  // Màn Nhập hàng gộp hai nguồn: xem được nguồn nào thì vào được màn đó.
  imports: [INBOUND_READ_PERMISSIONS.SUPPLIER, INBOUND_READ_PERMISSIONS.WORKSHOP],
  exports: [["stock_movement", "read"]],
  adjustments: [["stock_movement", "read"]],
  // Dùng chung quyền đọc: danh sách là nơi tạo yêu cầu sản xuất.
  productionList: [["production_requests", "read"]],
  // `GET /production-deliveries`; nhận / từ chối còn cần `production:receive` (kiểm trong màn).
  productionDeliveries: [["production_requests", "read"]],
} as const;

export type ExchangeNavItemKey = keyof typeof EXCHANGE_NAV_PERMISSION;

export function canAccessExchangeNavItem(
  item: ExchangeNavItemKey,
  userRole?: string | null,
): boolean {
  if (!userRole) return false;
  return EXCHANGE_NAV_PERMISSION[item].some(([resource, action]) =>
    allows(userRole, resource, action),
  );
}

export function filterExchangeNavItems<
  T extends { title: string; url: string },
>(items: T[], userRole?: string | null): T[] {
  const urlToKey: Record<string, ExchangeNavItemKey> = {
    "/exchange/suppliers": "suppliers",
    "/exchange/imports": "imports",
    "/exchange/exports": "exports",
    "/exchange/adjustments": "adjustments",
    "/exchange/production-list": "productionList",
    "/exchange/production-deliveries": "productionDeliveries",
  };

  return items.filter((item) => {
    const key = urlToKey[item.url];
    if (!key) return true;
    return canAccessExchangeNavItem(key, userRole);
  });
}
