// [API – Role]
import client from '@/lib/api/client'
import type {
  PermissionCatalogEntry,
  PermissionResourceGroup,
  Role,
  RoleCreatePayload,
  RoleUpdatePayload,
} from '@/types/role'

/**
 * Hình dạng backend trả về. `_count.users` là số tài khoản đang giữ vai trò - được làm
 * phẳng thành `userCount` để phần còn lại của FE không phải biết đến quy ước đặt tên của
 * Prisma.
 */
interface RoleDoc {
  id: string
  name: string
  description?: string | null
  permissions?: { resource: string; action: string }[]
  _count?: { users?: number }
  createdAt?: string
  updatedAt?: string
}

function mapRole(doc: RoleDoc): Role {
  return {
    id: doc.id,
    name: doc.name,
    description: doc.description ?? null,
    permissions: doc.permissions ?? [],
    userCount: doc._count?.users ?? 0,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

/**
 * Gom danh mục phẳng thành từng nhóm tài nguyên.
 *
 * Backend trả 150 cặp (resource, action) đã sắp xếp sẵn; một danh sách phẳng 150 dòng
 * checkbox thì không ai chọn nổi, nên giao diện làm việc trên ~30 nhóm.
 */
/**
 * Tên nhóm quyền theo đúng chữ trên thanh điều hướng, kèm đường dẫn menu để đối chiếu.
 *
 * Nhãn trong danh mục backend (`PermissionCatalog.label`) là tên nghiệp vụ chung
 * ("Sản phẩm", "Ca thu ngân", "Xuất/nhập kho"...) và lệch với sidebar ("Hàng hóa",
 * "Két tiền", "Giao dịch"), nên người phân quyền phải đoán quyền nào mở màn hình nào.
 * Tài nguyên không có trong bảng này giữ nhãn backend.
 */
const RESOURCE_NAV_LABELS: Record<string, { label: string; hint: string }> = {
  reports: { label: 'Tổng quan & Sổ thu chi', hint: 'Quản lý › Tổng quan, Sổ thu chi' },
  ai_chat: { label: 'Trợ lý AI', hint: 'Quản lý › Trợ lý AI' },
  users: { label: 'Nhân viên - Danh sách', hint: 'Quản lý › Nhân viên › Danh sách' },
  staff: { label: 'Nhân viên (tài khoản)', hint: 'Quản lý › Nhân viên' },
  schedules: { label: 'Nhân viên - Lịch làm', hint: 'Quản lý › Nhân viên › Lịch làm' },
  leaveRequests: { label: 'Nhân viên - Nghỉ phép', hint: 'Quản lý › Nhân viên › Nghỉ phép' },
  holidays: { label: 'Nhân viên - Ngày lễ', hint: 'Quản lý › Nhân viên › Ngày lễ' },
  attendances: { label: 'Nhân viên - Chấm công', hint: 'Quản lý › Nhân viên › Lịch làm (chấm công)' },
  payroll: { label: 'Nhân viên - Bảng lương', hint: 'Quản lý › Nhân viên › Bảng lương' },
  paysheets: { label: 'Lương - Bảng lương mẫu', hint: 'Quản lý › Nhân viên › Bảng lương' },
  payslips: { label: 'Lương - Phiếu lương', hint: 'Quản lý › Nhân viên › Bảng lương' },
  payrollSettings: { label: 'Lương - Cấu hình', hint: 'Quản lý › Nhân viên › Bảng lương' },
  products: { label: 'Hàng hóa - Danh sách', hint: 'Quản lý bán hàng › Hàng hóa › Danh sách' },
  categories: { label: 'Hàng hóa - Danh mục', hint: 'Quản lý bán hàng › Hàng hóa › Danh mục' },
  brands: { label: 'Hàng hóa - Thương hiệu', hint: 'Quản lý bán hàng › Hàng hóa › Thương hiệu' },
  inventory: { label: 'Hàng hóa - Tồn kho', hint: 'Quản lý bán hàng › Hàng hóa (cột Tồn kho)' },
  suppliers: { label: 'Giao dịch - Nhà cung cấp', hint: 'Quản lý bán hàng › Giao dịch › Nhà cung cấp' },
  stock_movement: {
    label: 'Giao dịch - Nhập hàng / Chuyển kho / Điều chỉnh',
    hint: 'Quản lý bán hàng › Giao dịch › Nhập hàng, Chuyển kho, Điều chỉnh tồn kho',
  },
  orders: { label: 'Đơn hàng - Hoá đơn', hint: 'Quản lý bán hàng › Đơn hàng › Hoá đơn; Bán hàng' },
  cash_drawers: { label: 'Két tiền', hint: 'Quản lý bán hàng › Két tiền › Hôm nay, Lịch sử' },
  cash_flows: { label: 'Sổ thu chi (phiếu thu/chi)', hint: 'Quản lý › Sổ thu chi' },
  customers: { label: 'Khách hàng', hint: 'CRM › Khách hàng' },
  promotions: { label: 'Khuyến mãi', hint: 'CRM › Khuyến mãi' },
  tickets: { label: 'Phản ánh', hint: 'CSKH › Phản ánh' },
  branches: { label: 'Chi nhánh', hint: 'Bộ chọn chi nhánh (góc trên sidebar); Cài đặt' },
  warehouses: { label: 'Kho', hint: 'Bộ chọn kho (góc trên sidebar); Cài đặt' },
  notifications: { label: 'Thông báo', hint: 'Chuông thông báo trên thanh tiêu đề' },
  profile: { label: 'Hồ sơ cá nhân', hint: 'Cài đặt › Tài khoản' },
  subscriptions: { label: 'Gói dịch vụ', hint: 'Cài đặt › Thanh toán' },
  tenants: { label: 'Cửa hàng (doanh nghiệp)', hint: 'Cài đặt › Cửa hàng' },
}

export function groupCatalog(
  entries: PermissionCatalogEntry[],
): PermissionResourceGroup[] {
  const groups = new Map<string, PermissionResourceGroup>()
  for (const entry of entries) {
    const group = groups.get(entry.resource)
    if (group) {
      group.actions.push(entry.action)
    } else {
      const nav = RESOURCE_NAV_LABELS[entry.resource]
      groups.set(entry.resource, {
        resource: entry.resource,
        label: nav?.label ?? entry.label ?? entry.resource,
        hint: nav?.hint,
        actions: [entry.action],
      })
    }
  }
  return [...groups.values()].sort((a, b) => a.label.localeCompare(b.label, 'vi'))
}

export const roleApi = {
  getList: async (): Promise<Role[]> => {
    const res = await client.get<{ data: RoleDoc[] }>('/roles')
    return (res.data?.data ?? []).map(mapRole)
  },

  getById: async (id: string): Promise<Role> => {
    const res = await client.get<{ data: RoleDoc }>(`/roles/${id}`)
    return mapRole(res.data.data)
  },

  /** Danh mục quyền cố định - giống nhau với mọi tenant, nên chỉ cần tải một lần. */
  getPermissionCatalog: async (): Promise<PermissionCatalogEntry[]> => {
    const res = await client.get<{ data: PermissionCatalogEntry[] }>(
      '/roles/permission-catalog',
    )
    return res.data?.data ?? []
  },

  create: async (payload: RoleCreatePayload): Promise<Role> => {
    const res = await client.post<{ data: RoleDoc }>('/roles', payload)
    return mapRole(res.data.data)
  },

  update: async (id: string, payload: RoleUpdatePayload): Promise<Role> => {
    const res = await client.patch<{ data: RoleDoc }>(`/roles/${id}`, payload)
    return mapRole(res.data.data)
  },

  remove: async (id: string): Promise<void> => {
    await client.delete(`/roles/${id}`)
  },
}
