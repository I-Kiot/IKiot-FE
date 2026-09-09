// [Context – UI State]
'use client'

import React, { createContext, useContext, useState } from 'react'
import { usePayrollMutations } from '../_hooks/use-payroll-mutations'
import type {
  PayrollDialogType,
  PayrollSettingsFormValues,
  PeriodCreateFormValues,
  PayslipAdjustFormValues,
} from '../_types/payroll.types'
import type {
  PayrollPeriod,
  PaySheet,
  Payslip,
  PayrollSettings,
  PaySheetCreatePayload,
  PaySheetUpdatePayload,
} from '@/types/payroll'
import type { Staff } from '@/types/staff'

interface PayrollContextProps {
  periods: PayrollPeriod[]
  paysheets: PaySheet[]
  settings: PayrollSettings | null
  activePeriod: PayrollPeriod | null
  staffs: Staff[]
  isLoading: boolean
  open: PayrollDialogType | null
  setOpen: (open: PayrollDialogType | null) => void
  currentRow: PayrollPeriod | null
  setCurrentRow: (row: PayrollPeriod | null) => void
  currentPayslip: Payslip | null
  setCurrentPayslip: (slip: Payslip | null) => void
  activePeriodId: string | null
  setActivePeriodId: (id: string | null) => void
  activePaysheetId: string | null
  setActivePaysheetId: (id: string | null) => void
  activeTab: string
  setActiveTab: (tab: string) => void
  fetchPeriodDetails: (id: string) => Promise<PayrollPeriod | null>
  refreshPeriods: () => Promise<void>
  refreshPaysheets: () => Promise<void>
  handleAddPaysheet: (data: PaySheetCreatePayload) => Promise<boolean>
  handleEditPaysheet: (id: string, data: PaySheetUpdatePayload) => Promise<boolean>
  handleUpdateSettings: (data: PayrollSettingsFormValues) => Promise<boolean>
  handleCreatePeriod: (data: PeriodCreateFormValues) => Promise<boolean>
  handleAdjustPayslip: (
    periodId: string,
    payslipId: string,
    data: PayslipAdjustFormValues
  ) => Promise<boolean>
  handleSubmitPeriod: (id: string) => Promise<boolean>
  handleReturnToDraft: (id: string, reason?: string) => Promise<boolean>
  handleApprovePeriod: (id: string) => Promise<boolean>
  handleMarkPaid: (
    id: string,
    payload: { paymentReference?: string; paymentNote?: string }
  ) => Promise<boolean>
  setActivePeriod: (period: PayrollPeriod | null) => void
}

const PayrollContext = createContext<PayrollContextProps | null>(null)

export function PayrollProvider({ children }: { children: React.ReactNode }) {
  const mutations = usePayrollMutations()
  const [open, setOpen] = useState<PayrollDialogType | null>(null)
  const [currentRow, setCurrentRow] = useState<PayrollPeriod | null>(null)
  const [currentPayslip, setCurrentPayslip] = useState<Payslip | null>(null)
  const [activePeriodId, setActivePeriodId] = useState<string | null>(null)
  const [activePaysheetId, setActivePaysheetId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>('periods')

  return (
    <PayrollContext.Provider
      value={{
        ...mutations,
        open,
        setOpen,
        currentRow,
        setCurrentRow,
        currentPayslip,
        setCurrentPayslip,
        activePeriodId,
        setActivePeriodId,
        activePaysheetId,
        setActivePaysheetId,
        activeTab,
        setActiveTab,
      }}
    >
      {children}
    </PayrollContext.Provider>
  )
}

export function usePayroll() {
  const ctx = useContext(PayrollContext)
  if (!ctx) throw new Error('usePayroll must be used within <PayrollProvider>')
  return ctx
}

