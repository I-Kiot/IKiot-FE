// [Context – UI State]
'use client'

import React, { useState } from 'react'
import type { Promotion } from '@/types/promotion'
import type { PromotionsDialogType, PromotionFormValues } from '../_types/promotion.types'
import { usePromotionsMutations } from '../_hooks/use-promotions-mutations'

type PromotionsContextType = {
  promotions: Promotion[]
  isLoading: boolean
  open: PromotionsDialogType | null
  setOpen: (str: PromotionsDialogType | null) => void
  currentRow: Promotion | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Promotion | null>>
  handleAdd: (data: PromotionFormValues) => Promise<boolean>
  handleEdit: (id: string, data: PromotionFormValues) => Promise<boolean>
  handleDelete: (id: string) => Promise<boolean>
  selectedIds: string[]
  setSelectedIds: (ids: string[]) => void
  handleDeleteMany: (ids: string[]) => Promise<boolean>
  selectionVersion: number
}

const PromotionsContext = React.createContext<PromotionsContextType | null>(null)

export function PromotionsProvider({ children }: { children: React.ReactNode }) {
  const { promotions, isLoading, handleAdd, handleEdit, handleDelete, handleDeleteMany } =
    usePromotionsMutations()
  const [open, setOpen] = useState<PromotionsDialogType | null>(null)
  const [currentRow, setCurrentRow] = useState<Promotion | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectionVersion, setSelectionVersion] = useState(0)

  async function handleDeleteManyWrapper(ids: string[]): Promise<boolean> {
    const success = await handleDeleteMany(ids)
    if (success) {
      setSelectedIds([])
      setSelectionVersion((v) => v + 1)
    }
    return success
  }

  return (
    <PromotionsContext.Provider
      value={{
        promotions,
        isLoading,
        open,
        setOpen,
        currentRow,
        setCurrentRow,
        handleAdd,
        handleEdit,
        handleDelete,
        selectedIds,
        setSelectedIds,
        handleDeleteMany: handleDeleteManyWrapper,
        selectionVersion,
      }}
    >
      {children}
    </PromotionsContext.Provider>
  )
}

export function usePromotions() {
  const ctx = React.useContext(PromotionsContext)
  if (!ctx) throw new Error('usePromotions must be used within <PromotionsProvider>')
  return ctx
}
