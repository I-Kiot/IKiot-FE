// [Context – UI State]
'use client'

import React, { useState } from 'react'
import type { Customer } from '@/types/customer'
import type { CustomersDialogType, CustomerFormValues } from '../_types/customer.types'
import { useCustomersMutations } from '../_hooks/use-customers-mutations'

type CustomersContextType = {
  customers: Customer[]
  isLoading: boolean
  open: CustomersDialogType | null
  setOpen: (str: CustomersDialogType | null) => void
  currentRow: Customer | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Customer | null>>
  handleAdd: (data: CustomerFormValues) => Promise<boolean>
  handleEdit: (id: string, data: CustomerFormValues) => Promise<boolean>
  handleDelete: (id: string) => Promise<boolean>
  selectedIds: string[]
  setSelectedIds: (ids: string[]) => void
  handleDeleteMany: (ids: string[]) => Promise<boolean>
  selectionVersion: number
}

const CustomersContext = React.createContext<CustomersContextType | null>(null)

export function CustomersProvider({ children }: { children: React.ReactNode }) {
  const { customers, isLoading, handleAdd, handleEdit, handleDelete, handleDeleteMany } =
    useCustomersMutations()
  const [open, setOpen] = useState<CustomersDialogType | null>(null)
  const [currentRow, setCurrentRow] = useState<Customer | null>(null)
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
    <CustomersContext.Provider
      value={{
        customers,
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
    </CustomersContext.Provider>
  )
}

export function useCustomers() {
  const ctx = React.useContext(CustomersContext)
  if (!ctx) throw new Error('useCustomers must be used within <CustomersProvider>')
  return ctx
}
