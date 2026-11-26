/** Quyền của các mục hành trình đơn trên sidebar. */
import { allows } from "./role-permissions";

const ORDER_FLOW_NAV_PERMISSION: Record<string, readonly [string, string]> = {
  "/sales/orders/new": ["orders", "create"],
  "/sales/orders": ["orders", "read"],
  "/order-returns": ["returns", "read"],
  // Cần `orders:read`.
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
