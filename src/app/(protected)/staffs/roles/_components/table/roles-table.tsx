// [Table – Roles]
'use client'

import { useMemo, useState } from 'react'
import { Pencil, ShieldCheck, Trash2, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useRoles } from '../../_context/roles-provider'
import { actionLabel } from '../../_types/role.types'

/** Nhiều nhất bao nhiêu chip quyền hiện trên một dòng trước khi gộp thành "+N". */
const PERMISSION_CHIP_LIMIT = 4

export function RolesTable() {
  const { roles, catalog, isLoading, setOpen, setCurrentRow } = useRoles()
  const [query, setQuery] = useState('')

  const labelOf = useMemo(
    () => new Map(catalog.map((group) => [group.resource, group.label])),
    [catalog],
  )

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return roles
    return roles.filter(
      (role) =>
        role.name.toLowerCase().includes(needle) ||
        (role.description ?? '').toLowerCase().includes(needle),
    )
  }, [roles, query])

  if (!isLoading && roles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-16 text-center">
        <ShieldCheck className="text-muted-foreground size-10" />
        <h2 className="mt-4 text-lg font-semibold">Chưa có vai trò nào</h2>
        <p className="text-muted-foreground mt-2 max-w-md text-sm">
          Nhân viên phải được gán một vai trò khi tạo tài khoản, nên hãy tạo ít
          nhất một vai trò trước khi thêm nhân viên.
        </p>
        <Button className="mt-4 cursor-pointer" onClick={() => setOpen('add')}>
          Tạo vai trò đầu tiên
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Input
        className="max-w-sm"
        placeholder="Tìm vai trò..."
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-56">Vai trò</TableHead>
              <TableHead>Quyền</TableHead>
              <TableHead className="w-32">Đang dùng</TableHead>
              <TableHead className="w-28 text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && roles.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground py-10 text-center">
                  Đang tải...
                </TableCell>
              </TableRow>
            )}

            {!isLoading && visible.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground py-10 text-center">
                  Không có vai trò nào khớp &quot;{query}&quot;
                </TableCell>
              </TableRow>
            )}

            {visible.map((role) => {
              // Gom theo tài nguyên: "Hàng hóa (4)" đọc được, còn 20 chip
              // "products:create, products:read, ..." thì không.
              const byResource = new Map<string, number>()
              for (const grant of role.permissions) {
                byResource.set(
                  grant.resource,
                  (byResource.get(grant.resource) ?? 0) + 1,
                )
              }
              const chips = [...byResource.entries()]
              const shown = chips.slice(0, PERMISSION_CHIP_LIMIT)
              const hidden = chips.length - shown.length

              return (
                <TableRow key={role.id}>
                  <TableCell className="align-top">
                    <div className="font-medium">{role.name}</div>
                    {role.description && (
                      <div className="text-muted-foreground mt-0.5 text-xs">
                        {role.description}
                      </div>
                    )}
                  </TableCell>

                  <TableCell className="align-top">
                    {role.permissions.length === 0 ? (
                      <span className="text-muted-foreground text-sm">
                        Chưa có quyền nào
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {shown.map(([resource, count]) => (
                          <Badge
                            key={resource}
                            variant="outline"
                            title={role.permissions
                              .filter((grant) => grant.resource === resource)
                              .map((grant) => actionLabel(grant.action))
                              .join(', ')}
                          >
                            {labelOf.get(resource) ?? resource} ({count})
                          </Badge>
                        ))}
                        {hidden > 0 && (
                          <Badge variant="secondary">+{hidden} nhóm</Badge>
                        )}
                      </div>
                    )}
                  </TableCell>

                  <TableCell className="align-top">
                    <span className="text-muted-foreground flex items-center gap-1.5 text-sm">
                      <Users className="size-3.5" />
                      {role.userCount} tài khoản
                    </span>
                  </TableCell>

                  <TableCell className="align-top text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="cursor-pointer"
                      aria-label={`Sửa vai trò ${role.name}`}
                      onClick={() => {
                        setCurrentRow(role)
                        setOpen('edit')
                      }}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive cursor-pointer"
                      aria-label={`Xóa vai trò ${role.name}`}
                      onClick={() => {
                        setCurrentRow(role)
                        setOpen('delete')
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
