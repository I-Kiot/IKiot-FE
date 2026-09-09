import client from './client'
import type {
  PayrollSettings,
  PaySheet,
  PaySheetCreatePayload,
  PaySheetUpdatePayload,
  PayrollPeriod,
  PeriodCreatePayload,
  PreviewPayload,
  PreviewResult,
  PayrollPeriodQueryParams,
  Payslip,
  ManualAdjustment,
} from '@/types/payroll'

export const payrollApi = {
  // --- Settings ---
  getSettings: async (): Promise<PayrollSettings | null> => {
    try {
      const res = await client.get<PayrollSettings>('/payroll/settings')
      return res.data
    } catch (err) {
      // 404 means settings haven't been created yet
      const axiosError = err as { response?: { status?: number } }
      if (axiosError.response?.status === 404) {
        return null
      }
      throw err
    }
  },
  createSettings: async (payload: PayrollSettings): Promise<PayrollSettings> => {
    const res = await client.post<{ success: boolean; data: PayrollSettings }>('/payroll/settings', payload)
    return res.data.data
  },
  updateSettings: async (payload: Partial<PayrollSettings>): Promise<PayrollSettings> => {
    const res = await client.put<{ success: boolean; data: PayrollSettings }>('/payroll/settings', payload)
    return res.data.data
  },

  // --- Paysheets ---
  getPaysheets: async (params?: { page?: number; limit?: number; name?: string }): Promise<{
    data: PaySheet[]
    total: number
    page: number
    totalPages: number
  }> => {
    const res = await client.get<{
      success: boolean
      data: PaySheet[]
      pagination?: { total: number; page: number; limit: number; totalPages: number }
    }>('/payroll/paysheets', { params })
    return {
      data: res.data.data || [],
      total: res.data.pagination?.total || 0,
      page: res.data.pagination?.page || 1,
      totalPages: res.data.pagination?.totalPages || 1,
    }
  },
  getPaysheetById: async (id: string): Promise<PaySheet> => {
    const res = await client.get<{ success: boolean; data: PaySheet }>(`/payroll/paysheets/${id}`)
    return res.data.data
  },
  createPaysheet: async (payload: PaySheetCreatePayload): Promise<PaySheet> => {
    const res = await client.post<{ success: boolean; data: PaySheet }>('/payroll/paysheets', payload)
    return res.data.data
  },
  updatePaysheet: async (id: string, payload: PaySheetUpdatePayload): Promise<PaySheet> => {
    const res = await client.put<{ success: boolean; data: PaySheet }>(`/payroll/paysheets/${id}`, payload)
    return res.data.data
  },

  preview: async (payload: PreviewPayload): Promise<PreviewResult> => {
    const res = await client.post<{ success: boolean; data: PreviewResult }>('/payroll/preview', payload)
    return res.data.data
  },

  // --- Periods ---
  createPeriod: async (payload: PeriodCreatePayload): Promise<PayrollPeriod> => {
    const res = await client.post<{ success: boolean; data: PayrollPeriod }>('/payroll/periods', payload)
    return res.data.data
  },
  getPeriods: async (params?: PayrollPeriodQueryParams): Promise<{
    data: PayrollPeriod[]
    total: number
    page: number
    totalPages: number
  }> => {
    const res = await client.get<{
      success: boolean
      data: PayrollPeriod[]
      pagination?: { total: number; page: number; limit: number; totalPages: number }
    }>('/payroll/periods', { params })
    return {
      data: res.data.data || [],
      total: res.data.pagination?.total || 0,
      page: res.data.pagination?.page || 1,
      totalPages: res.data.pagination?.totalPages || 1,
    }
  },
  getPeriodById: async (id: string): Promise<PayrollPeriod> => {
    const res = await client.get<{
      success: boolean
      data: { payrollPeriod: PayrollPeriod; payslips: Payslip[] }
    }>(`/payroll/periods/${id}`)
    return {
      ...res.data.data.payrollPeriod,
      payslips: res.data.data.payslips,
    }
  },

  // --- Payslips inside a Period ---
  getPayslipById: async (periodId: string, payslipId: string): Promise<Payslip> => {
    const res = await client.get<{ success: boolean; data: Payslip }>(
      `/payroll/periods/${periodId}/payslips/${payslipId}`
    )
    return res.data.data
  },
  updatePayslip: async (
    periodId: string,
    payslipId: string,
    payload: { note?: string; manualAdjustments?: ManualAdjustment[] }
  ): Promise<Payslip> => {
    const res = await client.patch<{ success: boolean; data: Payslip }>(
      `/payroll/periods/${periodId}/payslips/${payslipId}`,
      payload
    )
    return res.data.data
  },

  // --- Period Lifecycle Actions ---
  submitPeriod: async (id: string): Promise<PayrollPeriod> => {
    const res = await client.post<{ success: boolean; data: PayrollPeriod }>(`/payroll/periods/${id}/submit`)
    return res.data.data
  },
  returnPeriodToDraft: async (id: string, reason?: string): Promise<PayrollPeriod> => {
    const res = await client.post<{ success: boolean; data: PayrollPeriod }>(`/payroll/periods/${id}/return-to-draft`, {
      reason,
    })
    return res.data.data
  },
  approvePeriod: async (id: string): Promise<PayrollPeriod> => {
    const res = await client.post<{ success: boolean; data: PayrollPeriod }>(`/payroll/periods/${id}/approve`)
    return res.data.data
  },
  markPeriodPaid: async (
    id: string,
    payload: { paymentReference?: string; paymentNote?: string }
  ): Promise<PayrollPeriod> => {
    const res = await client.post<{ success: boolean; data: PayrollPeriod }>(`/payroll/periods/${id}/mark-paid`, payload)
    return res.data.data
  },

  // --- My Payslips (For Employees) ---
  getMyPayslips: async (params?: { page?: number; limit?: number }): Promise<{
    data: Payslip[]
    total: number
    page: number
    totalPages: number
  }> => {
    const res = await client.get<{
      success: boolean
      data: Payslip[]
      pagination?: { total: number; page: number; limit: number; totalPages: number }
    }>('/payroll/my-payslips', { params })
    return {
      data: res.data.data || [],
      total: res.data.pagination?.total || 0,
      page: res.data.pagination?.page || 1,
      totalPages: res.data.pagination?.totalPages || 1,
    }
  },
  getMyPayslipById: async (id: string): Promise<Payslip> => {
    const res = await client.get<{ success: boolean; data: Payslip }>(`/payroll/my-payslips/${id}`)
    return res.data.data
  },
}
