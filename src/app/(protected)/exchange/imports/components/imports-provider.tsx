'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import { stockMovementApi } from '@/lib/api/stock-movement'
import { getStockMovementErrorMessage } from '@/app/(protected)/exchange/shared/stock-movement-error'
import type { StockMovement, MovementStatus } from '@/types/stock-movement'

export type ImportsDialogType = 'create'

interface ImportsContextType {
  imports: StockMovement[]
  total: number
  isLoading: boolean
  open: ImportsDialogType | null
  setOpen: (v: ImportsDialogType | null) => void
  statusFilter: MovementStatus | 'ALL'
  setStatusFilter: (v: MovementStatus | 'ALL') => void
  fetchImports: () => Promise<void>
  handleUpdateDetails: (
    id: string,
    details: { productItemId: string; quantity: number; importPrice?: number; note?: string }[],
  ) => Promise<void>
  handleShip: (id: string) => Promise<void>
  handleReceive: (id: string, receivedDetails: { productItemId: string; receivedQuantity: number }[]) => Promise<void>
  handleCancel: (id: string) => Promise<void>
}

const ImportsContext = createContext<ImportsContextType | null>(null)

export function ImportsProvider({ children }: { children: React.ReactNode }) {
  const [imports, setImports] = useState<StockMovement[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [open, setOpen] = useState<ImportsDialogType | null>(null)
  const [statusFilter, setStatusFilter] = useState<MovementStatus | 'ALL'>('ALL')

  const fetchImports = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = {
        movementType: 'IMPORT' as const,
        limit: 50,
        ...(statusFilter !== 'ALL' && { status: statusFilter }),
      }
      const res = await stockMovementApi.getList(params)
      setImports(res.data)
      setTotal(res.data.length)
    } catch (error) {
      console.error(error)
      setImports([])
      setTotal(0)
      toast.error(getStockMovementErrorMessage(error, 'Không thể tải danh sách nhập hàng'))
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    fetchImports()
  }, [fetchImports])

  const handleUpdateDetails = async (
    id: string,
    details: { productItemId: string; quantity: number; importPrice?: number; note?: string }[],
  ) => {
    try {
      await stockMovementApi.updateDetails(id, { details })
      toast.success('Đã cập nhật danh sách hàng')
      await fetchImports()
    } catch (error) {
      toast.error(getStockMovementErrorMessage(error, 'Không thể cập nhật danh sách hàng'))
      throw error
    }
  }

  const handleShip = async (id: string) => {
    try {
      await stockMovementApi.ship(id)
      toast.success('Đã giao hàng')
      setOpen(null)
      await fetchImports()
    } catch (error) {
      console.error(error)
      toast.error(getStockMovementErrorMessage(error, 'Không thể giao hàng, vui lòng thử lại'))
    }
  }

  const handleReceive = async (
    id: string,
    receivedDetails: { productItemId: string; receivedQuantity: number }[],
  ) => {
    try {
      await stockMovementApi.receive(id, { details: receivedDetails })
      toast.success('Đã nhận hàng')
      setOpen(null)
      await fetchImports()
    } catch (error) {
      console.error(error)
      toast.error(getStockMovementErrorMessage(error, 'Không thể nhận hàng, vui lòng thử lại'))
    }
  }

  const handleCancel = async (id: string) => {
    try {
      await stockMovementApi.cancel(id)
      toast.success('Đã huỷ đơn nhập hàng')
      setOpen(null)
      await fetchImports()
    } catch (error) {
      console.error(error)
      toast.error(getStockMovementErrorMessage(error, 'Không thể huỷ đơn, vui lòng thử lại'))
    }
  }

  return (
    <ImportsContext.Provider
      value={{
        imports,
        total,
        isLoading,
        open,
        setOpen,
        statusFilter,
        setStatusFilter,
        fetchImports,
        handleUpdateDetails,
        handleShip,
        handleReceive,
        handleCancel,
      }}
    >
      {children}
    </ImportsContext.Provider>
  )
}

export function useImports() {
  const ctx = useContext(ImportsContext)
  if (!ctx) throw new Error('useImports must be used within <ImportsProvider>')
  return ctx
}
