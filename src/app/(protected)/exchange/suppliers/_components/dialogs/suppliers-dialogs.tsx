'use client'

import { useSuppliers } from '../../_context/suppliers-provider'
import { SuppliersMutateDialog } from './suppliers-mutate-dialog'
import { SuppliersDeleteDialog } from './suppliers-delete-dialog'
import { SuppliersPayDebtDialog } from './suppliers-pay-debt-dialog'
import { SuppliersDebtLedgerDialog } from './suppliers-debt-ledger-dialog'

export function SuppliersDialogs() {
  const { open, setOpen, currentRow, setCurrentRow, selectedIds } = useSuppliers()

  return (
    <>
      <SuppliersMutateDialog
        key="supplier-add"
        open={open === 'add'}
        onOpenChange={(v) => {
          if (!v) setOpen(null)
        }}
      />
      {currentRow && (
        <SuppliersMutateDialog
          key="supplier-edit"
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
      <SuppliersDeleteDialog
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
      <SuppliersPayDebtDialog
        open={open === 'payDebt'}
        onOpenChange={(v) => {
          if (!v) {
            setOpen(null)
            setCurrentRow(null)
          }
        }}
        supplier={currentRow}
      />
      <SuppliersDebtLedgerDialog
        open={open === 'ledger'}
        onOpenChange={(v) => {
          if (!v) {
            setOpen(null)
            setCurrentRow(null)
          }
        }}
        supplier={currentRow}
      />
    </>
  )
}
