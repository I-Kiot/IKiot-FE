// [Dialog – Orchestrator Brand]
'use client'

import { useBrands } from '../../_context/brands-provider'
import { BrandsMutateDialog } from './brands-mutate-dialog'
import { BrandsDeleteDialog } from './brands-delete-dialog'

export function BrandsDialogs() {
  const { open, setOpen, currentRow, setCurrentRow, selectedIds } = useBrands()

  return (
    <>
      <BrandsMutateDialog
        key="brand-add"
        open={open === 'add'}
        onOpenChange={(v) => {
          if (!v) setOpen(null)
        }}
      />
      {currentRow && (
        <BrandsMutateDialog
          key="brand-edit"
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
      <BrandsDeleteDialog
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
