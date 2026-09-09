// [Component – Permission picker]
'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import type { PermissionResourceGroup } from '@/types/role'
import { actionLabel, permissionKey } from '../_types/role.types'

type PermissionPickerProps = {
  groups: PermissionResourceGroup[]
  value: string[]
  onChange: (keys: string[]) => void
  disabled?: boolean
}

/**
 * Chọn quyền cho một vai trò.
 *
 * Danh mục có 150 cặp (tài nguyên, hành động). Ba quyết định làm nó dùng được:
 *
 *  - **Gom theo tài nguyên**, mỗi nhóm một hàng, kèm ô chọn cả nhóm ở tiêu đề. Gần như mọi
 *    vai trò thật đều được cấp theo nhóm ("toàn quyền hàng hóa"), không phải theo từng ô.
 *  - **Ô của nhóm có trạng thái thứ ba**: chọn một phần. Nếu chỉ có bật/tắt thì một nhóm
 *    đang chọn 2/5 sẽ hiện như chưa chọn gì, và một cú bấm nhầm sẽ xóa mất hai quyền đó.
 *  - **Lọc theo tên**, khớp cả nhãn tiếng Việt lẫn mã tài nguyên - người dùng gõ "kho"
 *    hoặc "inventory" đều ra.
 */
export function PermissionPicker({
  groups,
  value,
  onChange,
  disabled,
}: PermissionPickerProps) {
  const [query, setQuery] = useState('')
  const selected = useMemo(() => new Set(value), [value])

  const visibleGroups = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return groups
    return groups.filter(
      (group) =>
        group.label.toLowerCase().includes(needle) ||
        group.resource.toLowerCase().includes(needle) ||
        group.actions.some((action) =>
          actionLabel(action).toLowerCase().includes(needle),
        ),
    )
  }, [groups, query])

  const allKeys = useMemo(
    () =>
      groups.flatMap((group) =>
        group.actions.map((action) => permissionKey(group.resource, action)),
      ),
    [groups],
  )

  function toggle(key: string, checked: boolean) {
    const next = new Set(selected)
    if (checked) next.add(key)
    else next.delete(key)
    onChange([...next])
  }

  function toggleGroup(group: PermissionResourceGroup, checked: boolean) {
    const next = new Set(selected)
    for (const action of group.actions) {
      const key = permissionKey(group.resource, action)
      if (checked) next.add(key)
      else next.delete(key)
    }
    onChange([...next])
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            className="pl-8"
            placeholder="Tìm nhóm quyền..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            disabled={disabled}
          />
        </div>
        <Badge variant="secondary" className="shrink-0">
          Đã chọn {selected.size}/{allKeys.length}
        </Badge>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="cursor-pointer"
          disabled={disabled || selected.size === allKeys.length}
          onClick={() => onChange(allKeys)}
        >
          Chọn tất cả
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="cursor-pointer"
          disabled={disabled || selected.size === 0}
          onClick={() => onChange([])}
        >
          Bỏ chọn
        </Button>
      </div>

      <ScrollArea className="h-[46vh] rounded-md border">
        <div className="divide-y">
          {visibleGroups.length === 0 && (
            <p className="text-muted-foreground px-4 py-8 text-center text-sm">
              Không có nhóm quyền nào khớp &quot;{query}&quot;
            </p>
          )}

          {visibleGroups.map((group) => {
            const keys = group.actions.map((action) =>
              permissionKey(group.resource, action),
            )
            const chosen = keys.filter((key) => selected.has(key)).length
            const all = chosen === keys.length
            const some = chosen > 0 && !all

            return (
              <div key={group.resource} className="px-4 py-3">
                <label className="flex cursor-pointer items-center gap-2">
                  <Checkbox
                    checked={all ? true : some ? 'indeterminate' : false}
                    onCheckedChange={(checked) =>
                      toggleGroup(group, checked !== false)
                    }
                    disabled={disabled}
                  />
                  <span className="text-sm font-medium">{group.label}</span>
                  <span className="text-muted-foreground text-xs">
                    {chosen}/{keys.length}
                  </span>
                </label>

                <Separator className="my-2" />

                <div className="grid grid-cols-2 gap-x-4 gap-y-2 pl-6 sm:grid-cols-3">
                  {group.actions.map((action) => {
                    const key = permissionKey(group.resource, action)
                    return (
                      <label
                        key={key}
                        className="flex cursor-pointer items-center gap-2 text-sm"
                      >
                        <Checkbox
                          checked={selected.has(key)}
                          onCheckedChange={(checked) =>
                            toggle(key, checked !== false)
                          }
                          disabled={disabled}
                        />
                        <span className="truncate">{actionLabel(action)}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
