// [Component – Permission picker]
'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { PermissionResourceGroup } from '@/types/role'
import type { PermissionBlock } from '../_constants/permission-sections'
import { usePermissionSections } from '../_hooks/use-permission-sections'

type PermissionPickerProps = {
  groups: PermissionResourceGroup[]
  value: string[]
  onChange: (keys: string[]) => void
  disabled?: boolean
}

/** Viền ô chưa tick: mặc định (`border-input`) gần như biến mất trên nền khối ở chế độ sáng. */
const BOX = 'border-muted-foreground/60'

type CheckState = boolean | 'indeterminate'

function stateOf(keys: string[], selected: Set<string>): CheckState {
  const chosen = keys.filter((key) => selected.has(key)).length
  if (chosen === 0) return false
  return chosen === keys.length ? true : 'indeterminate'
}

/**
 * Chọn quyền cho một vai trò, bày theo công việc: Nhân viên bán hàng / Quản lý / Vận chuyển & kho / Xưởng
 * (`_constants/permission-sections.ts`). Cột trái chọn nhóm và cho thấy mỗi nhóm đã chọn bao nhiêu; cột
 * phải là các quyền của nhóm, chia khối, mỗi quyền một dòng có tên rõ nghĩa. Ô "chọn cả khối / cả nhóm" có
 * trạng thái thứ ba (chọn một phần) để một cú bấm nhầm không xoá mất các quyền đã chọn lẻ.
 */
export function PermissionPicker({ groups, value, onChange, disabled }: PermissionPickerProps) {
  const { sections, allKeys } = usePermissionSections(groups)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const selected = useMemo(() => new Set(value), [value])

  const active = sections.find((section) => section.id === activeId) ?? sections[0]
  const needle = query.trim().toLowerCase()

  // Đang tìm: hiện kết quả của mọi nhóm, mỗi nhóm một khối có tiền tố tên nhóm.
  const visibleBlocks: PermissionBlock[] = useMemo(() => {
    if (!needle) return active?.blocks ?? []
    return sections.flatMap((section) =>
      section.blocks
        .map((block) => ({
          title: `${section.title} › ${block.title}`,
          items: block.items.filter(
            (item) =>
              item.label.toLowerCase().includes(needle) ||
              (item.hint?.toLowerCase().includes(needle) ?? false) ||
              block.title.toLowerCase().includes(needle) ||
              item.key.includes(needle),
          ),
        }))
        .filter((block) => block.items.length > 0),
    )
  }, [needle, sections, active])

  function setKeys(keys: string[], checked: boolean) {
    const next = new Set(selected)
    for (const key of keys) {
      if (checked) next.add(key)
      else next.delete(key)
    }
    onChange([...next])
  }

  if (!active) {
    return <p className="text-muted-foreground text-sm">Đang tải danh mục quyền...</p>
  }

  const ActiveIcon = active.icon

  // Màn hẹp: nhóm thành hàng chip cuộn ngang, danh sách quyền trải dọc và cả hộp thoại cuộn chung. Từ md: hai cột, mỗi cột tự cuộn.
  return (
    <div className="flex flex-col gap-4 md:grid md:h-full md:min-h-0 md:grid-cols-[300px_1fr]">
      {/* Trái: các nhóm quyền chính */}
      <nav className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:thin] md:min-h-0 md:flex-col md:overflow-x-visible md:overflow-y-auto md:pr-1 md:pb-0">
        {sections.map((section) => {
          const chosen = section.keys.filter((key) => selected.has(key)).length
          const Icon = section.icon
          const isActive = !needle && section.id === active.id
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => {
                setActiveId(section.id)
                setQuery('')
              }}
              className={cn(
                'flex shrink-0 cursor-pointer items-start gap-3 rounded-lg border p-2.5 text-left transition-colors md:p-3',
                isActive ? 'border-primary bg-primary/10' : 'hover:bg-muted/60',
              )}
            >
              <Icon className={cn('mt-0.5 size-5 shrink-0', isActive ? 'text-primary' : 'text-muted-foreground')} />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{section.title}</span>
                  <Badge variant={chosen > 0 ? 'default' : 'secondary'} className="shrink-0">
                    {chosen}/{section.keys.length}
                  </Badge>
                </span>
                <span className="text-muted-foreground hidden text-xs md:block [@media(max-height:920px)]:md:hidden">{section.summary}</span>
              </span>
            </button>
          )
        })}

        <div className="text-muted-foreground mt-auto hidden flex-col gap-2 border-t pt-3 text-xs md:flex">
          <span>
            Đã chọn <strong className="text-foreground">{selected.size}</strong> / {allKeys.length} quyền
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1 cursor-pointer"
              disabled={disabled || selected.size === 0}
              onClick={() => onChange([])}
            >
              Bỏ chọn hết
            </Button>
          </div>
        </div>
      </nav>

      {/* Phải: quyền của nhóm đang chọn */}
      <div className="flex flex-col gap-3 rounded-lg border p-3 md:min-h-0 md:p-4">
        <div className="flex flex-wrap items-center gap-3">
          {needle ? (
            <span className="text-sm font-medium">Kết quả tìm &quot;{query}&quot;</span>
          ) : (
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <ActiveIcon className="text-primary size-5 shrink-0" />
              <span className="text-base font-semibold">{active.title}</span>
            </div>
          )}
          <div className="relative ml-auto w-full sm:w-64">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              className="pl-8"
              placeholder="Tìm quyền trong mọi nhóm..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              disabled={disabled}
            />
          </div>
          {!needle && (
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox
                className={BOX}
                checked={stateOf(active.keys, selected)}
                onCheckedChange={(checked) => setKeys(active.keys, checked !== false)}
                disabled={disabled}
              />
              Chọn cả nhóm
            </label>
          )}
        </div>
        {!needle && <p className="text-muted-foreground -mt-1 text-sm">{active.summary}</p>}

        <ScrollArea className="md:min-h-0 md:flex-1">
          {visibleBlocks.length === 0 ? (
            <p className="text-muted-foreground py-10 text-center text-sm">
              Không có quyền nào khớp &quot;{query}&quot;
            </p>
          ) : (
            <div className="grid gap-4 md:pr-3 xl:grid-cols-2">
              {visibleBlocks.map((block) => {
                const keys = block.items.map((item) => item.key)
                const chosen = keys.filter((key) => selected.has(key)).length
                return (
                  <section key={block.title} className="bg-card rounded-lg border">
                    <label className="flex cursor-pointer items-center gap-2 border-b px-3 py-2.5 md:px-4">
                      <Checkbox
                        className={BOX}
                        checked={stateOf(keys, selected)}
                        onCheckedChange={(checked) => setKeys(keys, checked !== false)}
                        disabled={disabled}
                      />
                      <span className="text-sm font-semibold">{block.title}</span>
                      <span className="text-muted-foreground ml-auto text-xs">
                        {chosen}/{keys.length}
                      </span>
                    </label>
                    <ul className="flex flex-col py-1">
                      {block.items.map((item) => (
                        <li key={item.key}>
                          <label className="hover:bg-muted/60 flex cursor-pointer items-start gap-3 px-3 py-2 md:px-4">
                            <Checkbox
                              className={cn(BOX, 'mt-0.5')}
                              checked={selected.has(item.key)}
                              onCheckedChange={(checked) => setKeys([item.key], checked !== false)}
                              disabled={disabled}
                            />
                            <span className="flex flex-col gap-0.5">
                              <span className="text-sm">{item.label}</span>
                              {item.hint && (
                                <span className="text-muted-foreground text-xs">{item.hint}</span>
                              )}
                            </span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </section>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  )
}
