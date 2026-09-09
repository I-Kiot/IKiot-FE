'use client'

import * as React from 'react'
import { Check, ChevronDown, ChevronRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export interface CascadeSelectItem {
  id: string
  label: string
  parentId?: string | null
}

type MenuColumnProps = {
  items: CascadeSelectItem[]
  depth: number
  openPath: string[]
  value?: string | null
  allItems: CascadeSelectItem[]
  onHover: (depth: number, id: string) => void
  onSelect: (item: CascadeSelectItem) => void
}

function MenuColumn({
  items,
  depth,
  openPath,
  value,
  allItems,
  onHover,
  onSelect,
}: MenuColumnProps) {
  return (
    <div className={cn('min-w-[180px] max-h-60 overflow-y-auto py-1', depth > 0 && 'border-l')}>
      {items.map((item) => {
        const isActive = openPath[depth] === item.id
        const isSelected = value === item.id
        const hasKids = allItems.some((c) => c.parentId === item.id)

        return (
          <div
            key={item.id}
            className={cn(
              'flex items-center justify-between gap-2 px-3 py-1.5 cursor-pointer text-sm select-none',
              'hover:bg-accent',
              isActive && 'bg-accent',
            )}
            onMouseEnter={() => onHover(depth, item.id)}
            onClick={() => onSelect(item)}
          >
            <span className="flex items-center gap-1.5 min-w-0">
              {isSelected && <Check className="size-3.5 text-primary shrink-0" />}
              <span className={cn('truncate', isSelected && 'font-medium')}>{item.label}</span>
            </span>
            {hasKids && <ChevronRight className="size-3.5 text-muted-foreground shrink-0" />}
          </div>
        )
      })}
    </div>
  )
}

export interface CascadeSelectProps {
  items: CascadeSelectItem[]
  value?: string | null
  onValueChange: (value: string | null) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

function CascadeSelect({
  items,
  value,
  onValueChange,
  placeholder = 'Chọn...',
  disabled,
  className,
}: CascadeSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [openPath, setOpenPath] = React.useState<string[]>([])

  const topLevel = items.filter((c) => !c.parentId)
  const selected = value ? items.find((c) => c.id === value) : null

  function handleHover(depth: number, id: string) {
    setOpenPath((prev) => [...prev.slice(0, depth), id])
  }

  function handleSelect(item: CascadeSelectItem) {
    onValueChange(item.id)
    setOpen(false)
    setOpenPath([])
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation()
    onValueChange(null)
  }

  const levels: CascadeSelectItem[][] = [topLevel]
  for (let i = 0; i < openPath.length; i++) {
    const children = items.filter((c) => c.parentId === openPath[i])
    if (children.length > 0) {
      levels.push(children)
    } else {
      break
    }
  }

  return (
    <Popover
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) setOpenPath([])
      }}
    >
      <PopoverTrigger asChild disabled={disabled}>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          className={cn(
            'w-full justify-between font-normal h-9 px-3',
            !selected && 'text-muted-foreground',
            className,
          )}
        >
          <span className="truncate text-sm">{selected?.label ?? placeholder}</span>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            {value && (
              <X
                className="size-3.5 text-muted-foreground hover:text-foreground"
                onClick={handleClear}
              />
            )}
            <ChevronDown className="size-4 text-muted-foreground" />
          </div>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="p-0 w-auto min-w-[200px]"
        align="start"
        onMouseLeave={() => setOpenPath([])}
      >
        {items.length === 0 ? (
          <p className="px-3 py-2 text-sm text-muted-foreground">Không có lựa chọn</p>
        ) : (
          <div className="flex">
            {levels.map((levelItems, depth) => (
              <MenuColumn
                key={depth}
                items={levelItems}
                depth={depth}
                openPath={openPath}
                value={value}
                allItems={items}
                onHover={handleHover}
                onSelect={handleSelect}
              />
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

export { CascadeSelect }
