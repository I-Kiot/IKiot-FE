// [Mutations – Payroll]
'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { payrollApi } from '@/lib/api/payroll'
import { staffApi } from '@/lib/api/staff'
import type {
  PayrollPeriod,
  PaySheet,
  PayrollSettings,
  PaySheetCreatePayload,
  PaySheetUpdatePayload,
} from '@/types/payroll'
import type { Staff } from '@/types/staff'
import type {
  PayrollSettingsFormValues,
  PeriodCreateFormValues,
  PayslipAdjustFormValues,
} from '../_types/payroll.types'
import { parsePriceAmount } from '../_constants/payroll.constants'

export function usePayrollMutations() {
  const [periods, setPeriods] = useState<PayrollPeriod[]>([])
  const [paysheets, setPaysheets] = useState<PaySheet[]>([])
  const [settings, setSettings] = useState<PayrollSettings | null>(null)
  const [activePeriod, setActivePeriod] = useState<PayrollPeriod | null>(null)
  const [staffs, setStaffs] = useState<Staff[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Initial load
  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      
      // Load periods
      try {
        const periodRes = await payrollApi.getPeriods({ page: 1, limit: 100 })
        setPeriods(periodRes.data)
      } catch (err) {
        console.error('Error loading periods:', err)
      }

      // Load paysheets
      try {
        const paysheetRes = await payrollApi.getPaysheets({ page: 1, limit: 100 })
        setPaysheets(paysheetRes.data)
      } catch (err) {
        console.error('Error loading paysheets:', err)
      }

      // Load settings
      try {
        const settingsRes = await payrollApi.getSettings()
        setSettings(settingsRes)
      } catch (err) {
        console.error('Error loading settings:', err)
      }

      // Load staffs
      try {
        const staffRes = await staffApi.getAllForOptions()
        setStaffs(staffRes)
      } catch (err) {
        console.error('Error loading staffs:', err)
      }

      setIsLoading(false)
    }
    loadData()
  }, [])

  // Refetch functions
  async function refreshPeriods() {
    try {
      const periodRes = await payrollApi.getPeriods({ page: 1, limit: 100 })
      setPeriods(periodRes.data)
    } catch {
      toast.error('Không thể cập nhật danh sách kỳ lương')
    }
  }

  async function refreshPaysheets() {
    try {
      const paysheetRes = await payrollApi.getPaysheets({ page: 1, limit: 100 })
      setPaysheets(paysheetRes.data)
    } catch {
      toast.error('Không thể cập nhật danh sách lương cơ bản')
    }
  }

  async function fetchPeriodDetails(id: string) {
    setIsLoading(true)
    try {
      const details = await payrollApi.getPeriodById(id)
      setActivePeriod(details)
      return details
    } catch {
      toast.error('Không thể tải chi tiết kỳ lương')
      return null
    } finally {
      setIsLoading(false)
    }
  }

  // --- Mutations ---
  async function handleAddPaysheet(payload: PaySheetCreatePayload): Promise<boolean> {
    setIsLoading(true)
    try {
      await payrollApi.createPaysheet(payload)
      await refreshPaysheets()
      toast.success('Thêm khung lương thành công')
      return true
    } catch {
      toast.error('Thêm khung lương thất bại')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  async function handleEditPaysheet(id: string, payload: PaySheetUpdatePayload): Promise<boolean> {
    setIsLoading(true)
    try {
      await payrollApi.updatePaysheet(id, payload)
      await refreshPaysheets()
      toast.success('Cập nhật khung lương thành công')
      return true
    } catch {
      toast.error('Cập nhật khung lương thất bại')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  async function handleUpdateSettings(data: PayrollSettingsFormValues): Promise<boolean> {
    setIsLoading(true)
    try {
      let savedSettings: PayrollSettings
      if (settings?.id) {
        savedSettings = await payrollApi.updateSettings(data)
      } else {
        savedSettings = await payrollApi.createSettings({
          cycle: data.cycle,
          approveAfterPeriodEndDays: data.approveAfterPeriodEndDays,
          payAfterPeriodEndDays: data.payAfterPeriodEndDays,
          autoGenerate: data.autoGenerate,
          standardWorkingDays: data.standardWorkingDays,
          standardWorkingHoursPerDay: data.standardWorkingHoursPerDay,
          weekendDays: data.weekendDays,
          lateGraceMinutes: data.lateGraceMinutes,
        })
      }
      setSettings(savedSettings)
      toast.success('Cập nhật cấu hình tính lương thành công')
      return true
    } catch {
      toast.error('Cập nhật cấu hình tính lương thất bại')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  async function handleCreatePeriod(data: PeriodCreateFormValues): Promise<boolean> {
    setIsLoading(true)
    try {
      const newPeriod = await payrollApi.createPeriod({
        payrollMonth: data.payrollMonth,
        userIds: data.userIds,
      })
      setPeriods((prev) => [newPeriod, ...prev])
      toast.success('Tạo kỳ lương mới thành công')
      return true
    } catch (err) {
      const axiosError = err as { response?: { data?: { message?: string } } }
      const msg = axiosError.response?.data?.message || 'Tạo kỳ lương mới thất bại'
      toast.error(msg)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  async function handleAdjustPayslip(
    periodId: string,
    payslipId: string,
    data: PayslipAdjustFormValues
  ): Promise<boolean> {
    setIsLoading(true)
    try {
      const adjustmentsMapped = data.manualCosts.map((c) => {
        const rawAmount = parsePriceAmount(c.amount)
        return {
          category: 'OTHER' as const,
          name: c.name,
          amount: c.type === 'DEDUCTION' ? -rawAmount : rawAmount,
        }
      })
      const updatedPayslip = await payrollApi.updatePayslip(periodId, payslipId, {
        note: data.note,
        manualAdjustments: adjustmentsMapped,
      })
      if (activePeriod && activePeriod.id === periodId) {
        const updatedPayslips = activePeriod.payslips.map((p) =>
          p.id === payslipId ? updatedPayslip : p
        )
        // Recalculate summary cost
        const newTotal = updatedPayslips.reduce((sum, p) => sum + p.netSalary, 0)
        setActivePeriod({ ...activePeriod, payslips: updatedPayslips, totalCost: newTotal })
      }
      toast.success('Điều chỉnh phiếu lương thành công')
      return true
    } catch {
      toast.error('Điều chỉnh phiếu lương thất bại')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSubmitPeriod(id: string): Promise<boolean> {
    setIsLoading(true)
    try {
      const updated = await payrollApi.submitPeriod(id)
      setPeriods((prev) => prev.map((p) => (p.id === id ? updated : p)))
      if (activePeriod && activePeriod.id === id) {
        setActivePeriod(updated)
      }
      toast.success('Đã gửi yêu cầu duyệt kỳ lương')
      return true
    } catch {
      toast.error('Gửi yêu cầu duyệt thất bại')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  async function handleReturnToDraft(id: string, reason?: string): Promise<boolean> {
    setIsLoading(true)
    try {
      const updated = await payrollApi.returnPeriodToDraft(id, reason)
      setPeriods((prev) => prev.map((p) => (p.id === id ? updated : p)))
      if (activePeriod && activePeriod.id === id) {
        setActivePeriod(updated)
      }
      toast.success('Đã trả kỳ lương về trạng thái Nháp')
      return true
    } catch {
      toast.error('Trả kỳ lương về nháp thất bại')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  async function handleApprovePeriod(id: string): Promise<boolean> {
    setIsLoading(true)
    try {
      const updated = await payrollApi.approvePeriod(id)
      setPeriods((prev) => prev.map((p) => (p.id === id ? updated : p)))
      if (activePeriod && activePeriod.id === id) {
        setActivePeriod(updated)
      }
      toast.success('Đã phê duyệt kỳ lương thành công')
      return true
    } catch {
      toast.error('Phê duyệt kỳ lương thất bại')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  async function handleMarkPaid(
    id: string,
    payload: { paymentReference?: string; paymentNote?: string }
  ): Promise<boolean> {
    setIsLoading(true)
    try {
      const updated = await payrollApi.markPeriodPaid(id, payload)
      setPeriods((prev) => prev.map((p) => (p.id === id ? updated : p)))
      if (activePeriod && activePeriod.id === id) {
        setActivePeriod(updated)
      }
      toast.success('Đã đánh dấu đã trả lương xong')
      return true
    } catch {
      toast.error('Đánh dấu đã trả lương thất bại')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return {
    periods,
    paysheets,
    settings,
    activePeriod,
    staffs,
    isLoading,
    fetchPeriodDetails,
    refreshPeriods,
    refreshPaysheets,
    handleAddPaysheet,
    handleEditPaysheet,
    handleUpdateSettings,
    handleCreatePeriod,
    handleAdjustPayslip,
    handleSubmitPeriod,
    handleReturnToDraft,
    handleApprovePeriod,
    handleMarkPaid,
    setActivePeriod,
  }
}
