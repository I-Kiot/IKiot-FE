// [Context – UI State]
'use client'

import React, { useState } from 'react'
import type { Role } from '@/types/role'
import type { RoleFormValues, RolesDialogType } from '../_types/role.types'
import { useRolesMutations } from '../_hooks/use-roles-mutations'

type RolesContextType = ReturnType<typeof useRolesMutations> & {
  open: RolesDialogType | null
  setOpen: (value: RolesDialogType | null) => void
  currentRow: Role | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Role | null>>
}

const RolesContext = React.createContext<RolesContextType | null>(null)

export function RolesProvider({ children }: { children: React.ReactNode }) {
  const mutations = useRolesMutations()
  const [open, setOpen] = useState<RolesDialogType | null>(null)
  const [currentRow, setCurrentRow] = useState<Role | null>(null)

  return (
    <RolesContext.Provider
      value={{ ...mutations, open, setOpen, currentRow, setCurrentRow }}
    >
      {children}
    </RolesContext.Provider>
  )
}

export function useRoles() {
  const context = React.useContext(RolesContext)
  if (!context) {
    throw new Error('useRoles phải được dùng bên trong <RolesProvider>')
  }
  return context
}

export type { RoleFormValues }
