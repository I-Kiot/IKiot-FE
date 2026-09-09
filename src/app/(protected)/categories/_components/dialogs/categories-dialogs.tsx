// [Dialog – Orchestrator Category]
'use client'

import { useCategories } from '../../_context/categories-provider'
import { CategoriesMutateDialog } from './categories-mutate-dialog'
import { CategoriesDeleteDialog } from './categories-delete-dialog'

export function CategoriesDialogs() {
  const { open, setOpen, currentRow, setCurrentRow, selectedIds } = useCategories()

  return (
    <>
      <CategoriesMutateDialog
        key="category-add"
        open={open === 'add'}
        onOpenChange={(v) => {
          if (!v) setOpen(null)
        }}
      />
      {currentRow && (
        <CategoriesMutateDialog
          key="category-edit"
          open={open === 'edit'}
          onOpenChange={(v) => {
            if (!v) {
              setOpen(null)
              setCurrentRow(null)
            }
          }}
          currentRow={currentRow}
        />
      )}
      <CategoriesDeleteDialog
        open={open === 'delete' || open === 'deleteMany'}
        mode={open === 'deleteMany' ? 'deleteMany' : 'delete'}
        onOpenChange={(v) => {
          if (!v) {
            setOpen(null)
            setCurrentRow(null)
          }
        }}
        currentRow={currentRow}
        selectedIds={selectedIds}
      />
    </>
  )
}
