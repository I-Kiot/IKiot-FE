// [Table – Expanded Panel Category]
'use client'

import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type { Category } from '@/types/category'
import { useCategories } from '../../_context/categories-provider'
import { getCachedUser } from '@/lib/auth'
import { canUpdateCategory, canDeleteCategory, canCreateCategory } from '@/components/sidebar/constants/role-permissions'
import { CategoriesMutateDialog } from '../dialogs/categories-mutate-dialog'

function resolveParentId(category: Category): string | null {
  if (!category.parentId) return null
  if (typeof category.parentId === 'string') return category.parentId
  return (category.parentId as { id: string }).id
}

type CategoriesExpandedPanelProps = {
  category: Category
  isExpanded: boolean
  isLastRow?: boolean
}

export function CategoriesExpandedPanel({
  category,
  isExpanded,
  isLastRow,
}: CategoriesExpandedPanelProps) {
  const { categories, setOpen, setCurrentRow } = useCategories()
  const role = getCachedUser()?.role
  const canEdit = canUpdateCategory(role)
  const canDelete = canDeleteCategory(role)
  const canAdd = canCreateCategory(role)

  const [subAddOpen, setSubAddOpen] = useState(false)
  const [editingChild, setEditingChild] = useState<Category | null>(null)

  const children = categories.filter((c) => resolveParentId(c) === category.id)

  return (
    <>
      <div
        className={cn(
          'bg-background px-6 py-4 animate-in fade-in-0 duration-200',
          !isLastRow && 'border-b',
        )}
      >
        {children.length > 0 ? (
          <div>
            {children.map((child) => (
              <div key={child.id}>
                <div className="flex items-center gap-4 py-3 px-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{child.name}</p>
                    {child.description && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {child.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {canEdit && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingChild(child)
                        }}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7 cursor-pointer text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => {
                          e.stopPropagation()
                          setCurrentRow(child)
                          setOpen('delete')
                        }}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
                <Separator />
              </div>
            ))}
          </div>
        ) : (
          <div>
            <p className="py-4 text-center text-sm text-muted-foreground">
              Chưa có danh mục con
            </p>
            <Separator />
          </div>
        )}

        <div className="flex items-center justify-between mt-3">
          {canDelete ? (
            <Button
              variant="destructive"
              size="sm"
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                setCurrentRow(category)
                setOpen('delete')
              }}
            >
              <Trash2 className="mr-2 size-4" />
              Xóa danh mục
            </Button>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2">
            {canAdd && (
              <Button
                size="sm"
                variant="outline"
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation()
                  setSubAddOpen(true)
                }}
              >
                <Plus className="mr-2 size-4" />
                Thêm danh mục con
              </Button>
            )}
            {canEdit && (
              <Button
                size="sm"
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation()
                  setCurrentRow(category)
                  setOpen('edit')
                }}
              >
                <Pencil className="mr-2 size-4" />
                Chỉnh sửa
              </Button>
            )}
          </div>
        </div>
      </div>

      <CategoriesMutateDialog
        open={subAddOpen}
        onOpenChange={setSubAddOpen}
        defaultParentId={category.id}
      />

      {editingChild && (
        <CategoriesMutateDialog
          open={!!editingChild}
          onOpenChange={(v) => {
            if (!v) setEditingChild(null)
          }}
          currentRow={editingChild}
        />
      )}
    </>
  )
}
