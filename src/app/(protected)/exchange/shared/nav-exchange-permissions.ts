/**
 * Mục submenu "Giao dịch" nào được vẽ. Nhóm này từng thiếu hẳn trong sidebar STAFF nên vai trò có đủ quyền vẫn không
 * vào được nhập, chuyển, điều chỉnh kho. Mỗi mục gắn với quyền backend kiểm tra cho màn đó, giống `nav-hr-permissions.ts`.
 */
import { allows } from "@/components/sidebar/constants/role-permissions";

const EXCHANGE_NAV_PERMISSION = {
  // Quyền đọc là điểm vào của mọi màn; tạo, duyệt, nhận được kiểm từng nút trong màn.
  suppliers: ["suppliers", "read"],
  imports: ["stock_movement", "read"],
  exports: ["stock_movement", "read"],
  adjustments: ["stock_movement", "read"],
  productionRequests: ["production_requests", "read"],
  // Dùng chung quyền đọc: danh sách là nơi tạo yêu cầu sản xuất.
  productionList: ["production_requests", "read"],
  // `GET /production-deliveries`; nhận / từ chối còn cần `production:receive` (kiểm trong màn).
  productionDeliveries: ["production_requests", "read"],
} as const;

export type ExchangeNavItemKey = keyof typeof EXCHANGE_NAV_PERMISSION;

export function canAccessExchangeNavItem(
  item: ExchangeNavItemKey,
  userRole?: string | null,
): boolean {
  if (!userRole) return false;
  const [resource, action] = EXCHANGE_NAV_PERMISSION[item];
  return allows(userRole, resource, action);
}

export function filterExchangeNavItems<
  T extends { title: string; url: string },
>(items: T[], userRole?: string | null): T[] {
  const urlToKey: Record<string, ExchangeNavItemKey> = {
    "/exchange/suppliers": "suppliers",
    "/exchange/imports": "imports",
    "/exchange/exports": "exports",
    "/exchange/adjustments": "adjustments",
    "/exchange/production-requests": "productionRequests",
    "/exchange/production-list": "productionList",
    "/exchange/production-deliveries": "productionDeliveries",
  };

  return items.filter((item) => {
    const key = urlToKey[item.url];
    if (!key) return true;
    return canAccessExchangeNavItem(key, userRole);
  });
}
