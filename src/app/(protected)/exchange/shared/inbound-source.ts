/** Hai nguồn hàng vào của màn Nhập hàng và quyền của từng nguồn. */
import { allows } from "@/components/sidebar/constants/role-permissions";

export type InboundSource = "SUPPLIER" | "WORKSHOP";

export const INBOUND_SOURCE_LABELS: Record<InboundSource, string> = {
  SUPPLIER: "Nhà cung cấp",
  WORKSHOP: "Xưởng",
};

/** Quyền xem danh sách của từng nguồn - đúng quyền backend kiểm trên `GET` tương ứng. */
export const INBOUND_READ_PERMISSIONS: Record<InboundSource, readonly [string, string]> = {
  SUPPLIER: ["stock_movement", "read"],
  WORKSHOP: ["production_requests", "read"],
};

/** Quyền tạo mới của từng nguồn - đúng quyền backend kiểm trên `POST` tương ứng. */
export const INBOUND_CREATE_PERMISSIONS: Record<InboundSource, readonly [string, string]> = {
  SUPPLIER: ["stock_movement", "create"],
  WORKSHOP: ["production_requests", "create"],
};

// Thứ tự tab, nguồn đầu tiên là mặc định.
const ALL_SOURCES: InboundSource[] = ["WORKSHOP", "SUPPLIER"];

/** Những nguồn tài khoản được xem bảng. */
export function viewableInboundSources(role: string | null | undefined): InboundSource[] {
  return ALL_SOURCES.filter((source) => {
    const [resource, action] = INBOUND_READ_PERMISSIONS[source];
    return allows(role, resource, action);
  });
}

/** Những nguồn tài khoản được tạo mới. */
export function creatableInboundSources(role: string | null | undefined): InboundSource[] {
  return ALL_SOURCES.filter((source) => {
    const [resource, action] = INBOUND_CREATE_PERMISSIONS[source];
    return allows(role, resource, action);
  });
}

/** Nguồn đang dùng: từ URL nếu hợp lệ, không thì nguồn đầu tiên. */
export function resolveInboundSource(
  requested: string | null,
  allowed: InboundSource[],
): InboundSource | null {
  const match = allowed.find((source) => source === requested);
  if (match) return match;
  return allowed[0] ?? null;
}
