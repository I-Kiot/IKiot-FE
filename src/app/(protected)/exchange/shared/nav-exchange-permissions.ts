/** Mục submenu "Giao dịch" được hiện theo quyền. */
import { allows } from "@/components/sidebar/constants/role-permissions";
import { INBOUND_CREATE_PERMISSIONS, INBOUND_READ_PERMISSIONS } from "./inbound-source";

const EXCHANGE_NAV_PERMISSION = {
  // Quyền đọc là điểm vào của mọi màn; tạo, duyệt, nhận được kiểm từng nút trong màn.
  suppliers: [["suppliers", "read"]],
  // Màn Nhập hàng gộp hai nguồn: xem được nguồn nào thì vào được màn đó.
  imports: [INBOUND_READ_PERMISSIONS.SUPPLIER, INBOUND_READ_PERMISSIONS.WORKSHOP],
  // Trang tạo mới: tạo được nguồn nào thì vào được (trang chỉ cho chọn nguồn đó).
  importsCreate: [INBOUND_CREATE_PERMISSIONS.SUPPLIER, INBOUND_CREATE_PERMISSIONS.WORKSHOP],
  exports: [["stock_movement", "read"]],
  adjustments: [["stock_movement", "read"]],
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
    "/exchange/imports/new": "importsCreate",
    "/exchange/imports": "imports",
    "/exchange/exports": "exports",
    "/exchange/adjustments": "adjustments",
  };

  return items.filter((item) => {
    const key = urlToKey[item.url];
    if (!key) return true;
    return canAccessExchangeNavItem(key, userRole);
  });
}
