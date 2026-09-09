// [Context – UI State]
'use client'

import React, { useState } from 'react'
import type { Brand } from '@/types/brand'
import type { BrandsDialogType, BrandFormValues } from '../_types/brand.types'
import { useBrandsMutations } from '../_hooks/use-brands-mutations'

type BrandsContextType = {
  brands: Brand[]
  isLoading: boolean
  open: BrandsDialogType | null
  setOpen: (str: BrandsDialogType | null) => void
  currentRow: Brand | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Brand | null>>
  handleAdd: (data: BrandFormValues) => Promise<boolean>
  handleEdit: (id: string, data: BrandFormValues) => Promise<boolean>
  handleDelete: (id: string) => Promise<boolean>
  selectedIds: string[]
  setSelectedIds: (ids: string[]) => void
  handleDeleteMany: (ids: string[]) => Promise<boolean>
  selectionVersion: number
}

const BrandsContext = React.createContext<BrandsContextType | null>(null)

export function BrandsProvider({ children }: { children: React.ReactNode }) {
  const { brands, isLoading, handleAdd, handleEdit, handleDelete, handleDeleteMany } =
    useBrandsMutations()
  const [open, setOpen] = useState<BrandsDialogType | null>(null)
  const [currentRow, setCurrentRow] = useState<Brand | null>(null)
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
    <BrandsContext.Provider
      value={{
        brands,
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
    </BrandsContext.Provider>
  )
}

export function useBrands() {
  const ctx = React.useContext(BrandsContext)
  if (!ctx) throw new Error('useBrands must be used within <BrandsProvider>')
  return ctx
}
