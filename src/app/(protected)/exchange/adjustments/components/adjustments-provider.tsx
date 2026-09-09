'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import { stockMovementApi } from '@/lib/api/stock-movement'
import { getStockMovementErrorMessage } from '@/app/(protected)/exchange/shared/stock-movement-error'
import type { StockMovement, MovementStatus } from '@/types/stock-movement'

export type AdjustmentsDialogType = 'create'

interface AdjustmentsContextType {
  adjustments: StockMovement[]
  total: number
  isLoading: boolean
  open: AdjustmentsDialogType | null
  setOpen: (v: AdjustmentsDialogType | null) => void
  statusFilter: MovementStatus | 'ALL'
  setStatusFilter: (v: MovementStatus | 'ALL') => void
  fetchAdjustments: () => Promise<void>
  handleUpdateDetails: (
    id: string,
    details: { productItemId: string; receivedQuantity: number; note?: string }[],
  ) => Promise<void>
  handleApprove: (id: string) => Promise<void>
  handleCancel: (id: string) => Promise<void>
}

const AdjustmentsContext = createContext<AdjustmentsContextType | null>(null)

export function AdjustmentsProvider({ children }: { children: React.ReactNode }) {
  const [adjustments, setAdjustments] = useState<StockMovement[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [open, setOpen] = useState<AdjustmentsDialogType | null>(null)
  const [statusFilter, setStatusFilter] = useState<MovementStatus | 'ALL'>('ALL')

  const fetchAdjustments = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await stockMovementApi.getList({
        movementType: 'ADJUST',
        limit: 100,
        ...(statusFilter !== 'ALL' && { status: statusFilter }),
      })
      setAdjustments(res.data)
      setTotal(res.total ?? res.data.length)
    } catch (error) {
      console.error(error)
      setAdjustments([])
      setTotal(0)
      toast.error(
        getStockMovementErrorMessage(error, 'Không thể tải danh sách điều chỉnh tồn kho'),
      )
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    void fetchAdjustments()
  }, [fetchAdjustments])

  const handleUpdateDetails = async (
    id: string,
    details: { productItemId: string; receivedQuantity: number; note?: string }[],
  ) => {
    try {
      await stockMovementApi.updateDetails(id, { details })
      toast.success('Đã cập nhật chi tiết kiểm kê')
      await fetchAdjustments()
    } catch (error) {
      toast.error(getStockMovementErrorMessage(error, 'Không thể cập nhật chi tiết'))
      throw error
    }
  }

  const handleApprove = async (id: string) => {
    try {
      await stockMovementApi.approveAdjust(id)
      toast.success('Đã duyệt phiếu điều chỉnh')
      await fetchAdjustments()
    } catch (error) {
      toast.error(getStockMovementErrorMessage(error, 'Không thể duyệt phiếu điều chỉnh'))
      throw error
    }
  }

  const handleCancel = async (id: string) => {
    try {
      await stockMovementApi.cancel(id)
      toast.success('Đã huỷ phiếu điều chỉnh')
      await fetchAdjustments()
    } catch (error) {
      toast.error(getStockMovementErrorMessage(error, 'Không thể huỷ phiếu'))
      throw error
    }
  }

  return (
    <AdjustmentsContext.Provider
      value={{
        adjustments,
        total,
        isLoading,
        open,
        setOpen,
        statusFilter,
        setStatusFilter,
        fetchAdjustments,
        handleUpdateDetails,
        handleApprove,
        handleCancel,
      }}
    >
      {children}
    </AdjustmentsContext.Provider>
  )
}

export function useAdjustments() {
  const ctx = useContext(AdjustmentsContext)
  if (!ctx) throw new Error('useAdjustments must be used within <AdjustmentsProvider>')
  return ctx
}
