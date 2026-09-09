// [Context – UI State]
'use client'

import React, { useState } from 'react'
import type { Supplier } from '@/types/supplier'
import type { SuppliersDialogType, SupplierFormValues } from '../_types/supplier.types'
import type { SupplierPayDebtPayload } from '@/types/supplier'
import { useSuppliersMutations } from '../_hooks/use-suppliers-mutations'

type SuppliersContextType = {
  suppliers: Supplier[]
  isLoading: boolean
  open: SuppliersDialogType | null
  setOpen: (str: SuppliersDialogType | null) => void
  currentRow: Supplier | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Supplier | null>>
  handleAdd: (data: SupplierFormValues) => Promise<boolean>
  handleEdit: (id: string, data: SupplierFormValues) => Promise<boolean>
  handleDelete: (id: string) => Promise<boolean>
  handleDeleteMany: (ids: string[]) => Promise<boolean>
  handlePayDebt: (id: string, payload: SupplierPayDebtPayload) => Promise<boolean>
  selectedIds: string[]
  setSelectedIds: (ids: string[]) => void
  selectionVersion: number
}

const SuppliersContext = React.createContext<SuppliersContextType | null>(null)

export function SuppliersProvider({ children }: { children: React.ReactNode }) {
  const { suppliers, isLoading, handleAdd, handleEdit, handleDelete, handleDeleteMany, handlePayDebt } =
    useSuppliersMutations()
  const [open, setOpen] = useState<SuppliersDialogType | null>(null)
  const [currentRow, setCurrentRow] = useState<Supplier | null>(null)
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
    <SuppliersContext.Provider
      value={{
        suppliers,
        isLoading,
        open,
        setOpen,
        currentRow,
        setCurrentRow,
        handleAdd,
        handleEdit,
        handleDelete,
        handleDeleteMany: handleDeleteManyWrapper,
        handlePayDebt,
        selectedIds,
        setSelectedIds,
        selectionVersion,
      }}
    >
      {children}
    </SuppliersContext.Provider>
  )
}

export function useSuppliers() {
  const ctx = React.useContext(SuppliersContext)
  if (!ctx) throw new Error('useSuppliers must be used within <SuppliersProvider>')
  return ctx
}
