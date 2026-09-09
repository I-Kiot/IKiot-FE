'use client'

import { useProducts } from '../../_context/products-provider'
import { ProductsMutateDialog } from './products-mutate-dialog'
import { ProductsDeleteDialog } from './products-delete-dialog'
import { ProductsCrossBranchSearchDialog } from './products-cross-branch-search-dialog'

export function ProductsDialogs() {
  const { open, setOpen, currentRow, setCurrentRow, selectedIds } = useProducts()

  return (
    <>
      <ProductsMutateDialog
        key="product-add"
        open={open === 'add'}
        onOpenChange={(v) => {
          if (!v) setOpen(null)
        }}
      />
      {currentRow && (
        <ProductsMutateDialog
          key="product-edit"
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
      <ProductsDeleteDialog
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
      <ProductsCrossBranchSearchDialog
        open={open === 'crossBranchSearch'}
        onOpenChange={(v) => {
          if (!v) setOpen(null)
        }}
      />
    </>
  )
}
