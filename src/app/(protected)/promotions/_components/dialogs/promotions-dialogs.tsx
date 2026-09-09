// [Dialog – Orchestrator Promotion]
'use client'

import { usePromotions } from '../../_context/promotions-provider'
import { PromotionsMutateDialog } from './promotions-mutate-dialog'
import { PromotionsDeleteDialog } from './promotions-delete-dialog'

export function PromotionsDialogs() {
  const { open, setOpen, currentRow, setCurrentRow, selectedIds } = usePromotions()

  return (
    <>
      <PromotionsMutateDialog
        key="promotion-add"
        open={open === 'add'}
        onOpenChange={(v) => {
          if (!v) setOpen(null)
        }}
      />
      {currentRow && (
        <PromotionsMutateDialog
          key="promotion-edit"
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
      <PromotionsDeleteDialog
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
