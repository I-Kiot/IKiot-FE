// [Dialog – Orchestrator Customer]
'use client'

import { useCustomers } from '../../_context/customers-provider'
import { CustomersMutateDialog } from './customers-mutate-dialog'
import { CustomersDeleteDialog } from './customers-delete-dialog'

export function CustomersDialogs() {
  const { open, setOpen, currentRow, setCurrentRow, selectedIds } = useCustomers()

  return (
    <>
      <CustomersMutateDialog
        key="customer-add"
        open={open === 'add'}
        onOpenChange={(v) => {
          if (!v) setOpen(null)
        }}
      />
      {currentRow && (
        <CustomersMutateDialog
          key="customer-edit"
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
      <CustomersDeleteDialog
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
