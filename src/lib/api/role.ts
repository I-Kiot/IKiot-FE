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
export function groupCatalog(
  entries: PermissionCatalogEntry[],
): PermissionResourceGroup[] {
  const groups = new Map<string, PermissionResourceGroup>()
  for (const entry of entries) {
    const group = groups.get(entry.resource)
    if (group) {
      group.actions.push(entry.action)
    } else {
      groups.set(entry.resource, {
        resource: entry.resource,
        label: entry.label || entry.resource,
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
