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
import { DataTableEmpty } from '@/components/data-table/data-table-empty'
import { DataTableLoading } from '@/components/data-table/data-table-loading'
import { useRoles } from '../../_context/roles-provider'
import { usePermissionSections } from '../../_hooks/use-permission-sections'
import { permissionKey } from '../../_types/role.types'

const COLUMN_COUNT = 4

export function RolesTable() {
  const { roles, catalog, isLoading, setOpen, setCurrentRow } = useRoles()
  const [query, setQuery] = useState('')

  const { sections } = usePermissionSections(catalog)
  // Tên dễ đọc của từng quyền, để chip của mỗi nhóm liệt kê được các việc vai trò làm khi rê chuột.
  const labelOf = useMemo(
    () =>
      new Map(
        sections.flatMap((section) =>
          section.blocks.flatMap((block) => block.items.map((item) => [item.key, item.label] as const)),
        ),
      ),
    [sections],
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
            {isLoading && roles.length === 0 && <DataTableLoading columnCount={COLUMN_COUNT} />}

            {!isLoading && visible.length === 0 && <DataTableEmpty columnCount={COLUMN_COUNT} />}

            {visible.map((role) => {
              // Gom theo các nhóm của màn chọn quyền (Nhân viên bán hàng, Quản lý, ...): đọc bảng là biết vai
              // trò thiên về việc gì, cùng cách người dùng đã tick lúc tạo.
              const granted = new Set(role.permissions.map((grant) => permissionKey(grant.resource, grant.action)))
              const chips = sections
                .map((section) => ({
                  section,
                  keys: section.keys.filter((key) => granted.has(key)),
                }))
                .filter((chip) => chip.keys.length > 0)

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
                        {chips.map(({ section, keys }) => {
                          const Icon = section.icon
                          return (
                            <Badge
                              key={section.id}
                              variant="outline"
                              className="gap-1"
                              title={keys.map((key) => labelOf.get(key) ?? key).join(', ')}
                            >
                              <Icon className="size-3" />
                              {section.title} {keys.length}/{section.keys.length}
                            </Badge>
                          )
                        })}
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
