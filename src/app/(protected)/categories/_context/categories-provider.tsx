// [Context – UI State]
'use client'

import React, { useState } from 'react'
import type { Category } from '@/types/category'
import type { CategoriesDialogType, CategoryFormValues } from '../_types/category.types'
import { useCategoriesMutations } from '../_hooks/use-categories-mutations'

type CategoriesContextType = {
  categories: Category[]
  isLoading: boolean
  open: CategoriesDialogType | null
  setOpen: (str: CategoriesDialogType | null) => void
  currentRow: Category | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Category | null>>
  handleAdd: (data: CategoryFormValues) => Promise<boolean>
  handleEdit: (id: string, data: CategoryFormValues) => Promise<boolean>
  handleDelete: (id: string) => Promise<boolean>
  selectedIds: string[]
  setSelectedIds: (ids: string[]) => void
  handleDeleteMany: (ids: string[]) => Promise<boolean>
  selectionVersion: number
}

const CategoriesContext = React.createContext<CategoriesContextType | null>(null)

export function CategoriesProvider({ children }: { children: React.ReactNode }) {
  const { categories, isLoading, handleAdd, handleEdit, handleDelete, handleDeleteMany } =
    useCategoriesMutations()
  const [open, setOpen] = useState<CategoriesDialogType | null>(null)
  const [currentRow, setCurrentRow] = useState<Category | null>(null)
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
    <CategoriesContext.Provider
      value={{
        categories,
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
    </CategoriesContext.Provider>
  )
}

export function useCategories() {
  const ctx = React.useContext(CategoriesContext)
  if (!ctx) throw new Error('useCategories must be used within <CategoriesProvider>')
  return ctx
}
