// [Mutations – Roles]
'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { groupCatalog, roleApi } from '@/lib/api/role'
import type { PermissionResourceGroup, Role } from '@/types/role'
import type { RoleFormValues } from '../_types/role.types'
import { splitPermissionKey } from '../_types/role.types'

/** Lấy thông điệp backend gửi về, vì ở đây nó nói đúng cái người dùng cần biết. */
function apiMessage(error: unknown, fallback: string): string {
  const message = (
    error as { response?: { data?: { message?: string | string[] } } }
  )?.response?.data?.message
  if (Array.isArray(message)) return message[0] ?? fallback
  return message ?? fallback
}

function toPayload(data: RoleFormValues) {
  return {
    name: data.name,
    description: data.description?.trim() || undefined,
    permissions: data.permissionKeys.map(splitPermissionKey),
  }
}

export function useRolesMutations() {
  const [roles, setRoles] = useState<Role[]>([])
  const [catalog, setCatalog] = useState<PermissionResourceGroup[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchRoles = useCallback(async () => {
    setIsLoading(true)
    try {
      // Danh mục quyền là hằng số của hệ thống, nhưng tải cùng lượt đầu để màn hình không
      // mở ra với một bộ chọn rỗng.
      const [list, entries] = await Promise.all([
        roleApi.getList(),
        roleApi.getPermissionCatalog(),
      ])
      setRoles(list)
      setCatalog(groupCatalog(entries))
    } catch (error) {
      toast.error(apiMessage(error, 'Tải danh sách vai trò thất bại'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchRoles()
  }, [fetchRoles])

  async function handleAdd(data: RoleFormValues): Promise<boolean> {
    try {
      const created = await roleApi.create(toPayload(data))
      setRoles((prev) =>
        [created, ...prev].sort((a, b) => a.name.localeCompare(b.name, 'vi')),
      )
      toast.success('Đã tạo vai trò')
      return true
    } catch (error) {
      // Trùng tên trả 409 kèm lý do - hiện nguyên văn thay vì "thất bại".
      toast.error(apiMessage(error, 'Tạo vai trò thất bại'))
      return false
    }
  }

  async function handleEdit(id: string, data: RoleFormValues): Promise<boolean> {
    try {
      const updated = await roleApi.update(id, toPayload(data))
      setRoles((prev) =>
        prev
          // `userCount` không có trong phản hồi PATCH, nên giữ lại con số đang có thay vì
          // để nó rơi về 0 và làm nút xóa trông như đang an toàn.
          .map((role) =>
            role.id === id ? { ...updated, userCount: role.userCount } : role,
          )
          .sort((a, b) => a.name.localeCompare(b.name, 'vi')),
      )
      toast.success('Đã cập nhật vai trò')
      return true
    } catch (error) {
      toast.error(apiMessage(error, 'Cập nhật vai trò thất bại'))
      return false
    }
  }

  async function handleDelete(id: string): Promise<boolean> {
    try {
      await roleApi.remove(id)
      setRoles((prev) => prev.filter((role) => role.id !== id))
      toast.success('Đã xóa vai trò')
      return true
    } catch (error) {
      // Backend từ chối khi còn tài khoản giữ vai trò và nói rõ bao nhiêu người.
      toast.error(apiMessage(error, 'Xóa vai trò thất bại'))
      return false
    }
  }

  return {
    roles,
    catalog,
    isLoading,
    fetchRoles,
    handleAdd,
    handleEdit,
    handleDelete,
  }
}
