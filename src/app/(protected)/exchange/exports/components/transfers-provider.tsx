'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import { stockMovementApi } from '@/lib/api/stock-movement'
import { getAuthScope } from '@/app/(protected)/exchange/shared/auth-scope'
import { getStockMovementErrorMessage } from '@/app/(protected)/exchange/shared/stock-movement-error'
import { getTransferUiLabels } from '@/app/(protected)/exchange/shared/transfer-ui-labels'
import type { StockMovement, MovementStatus } from '@/types/stock-movement'

export type TransfersDialogType = 'create'

interface TransfersContextType {
  transfers: StockMovement[]
  total: number
  isLoading: boolean
  open: TransfersDialogType | null
  setOpen: (v: TransfersDialogType | null) => void
  statusFilter: MovementStatus | 'ALL'
  setStatusFilter: (v: MovementStatus | 'ALL') => void
  fetchTransfers: () => Promise<void>
  handleOpen: (id: string) => Promise<void>
  handleUpdateDetails: (
    id: string,
    details: { productItemId: string; quantity: number; importPrice?: number; note?: string }[],
  ) => Promise<void>
  handleSubmitFromOpening: (
    id: string,
    details: { productItemId: string; quantity: number; importPrice?: number; note?: string }[],
  ) => Promise<void>
  handleShipFromOpening: (
    id: string,
    details: { productItemId: string; quantity: number; importPrice?: number; note?: string }[],
  ) => Promise<void>
  handleClose: (id: string) => Promise<void>
  handleShip: (id: string) => Promise<void>
  handleReceive: (id: string, receivedDetails: { productItemId: string; receivedQuantity: number }[]) => Promise<void>
  handleCancel: (id: string) => Promise<void>
  handleReturnGoods: (source: StockMovement, reason?: string) => Promise<void>
  labels: ReturnType<typeof getTransferUiLabels>
}

const TransfersContext = createContext<TransfersContextType | null>(null)

export function TransfersProvider({ children }: { children: React.ReactNode }) {
  const authScope = getAuthScope()
  const labels = React.useMemo(
    () => getTransferUiLabels(authScope.branchId, authScope.warehouseId),
    [authScope.branchId, authScope.warehouseId],
  )
  const [transfers, setTransfers] = useState<StockMovement[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [open, setOpen] = useState<TransfersDialogType | null>(null)
  const [statusFilter, setStatusFilter] = useState<MovementStatus | 'ALL'>('ALL')

  const fetchTransfers = useCallback(async () => {
    setIsLoading(true)
    try {
      const base = {
        limit: 50,
        ...(statusFilter !== 'ALL' && { status: statusFilter }),
      }
      const [exportRes, returnRes] = await Promise.all([
        stockMovementApi.getList({ ...base, movementType: 'EXPORT' }),
        stockMovementApi.getList({ ...base, movementType: 'RETURN' }),
      ])
      const data = [...exportRes.data, ...returnRes.data].sort((a, b) =>
        String(b.createdAt).localeCompare(String(a.createdAt)),
      )
      setTransfers(data)
      setTotal(data.length)
    } catch (error) {
      console.error(error)
      setTransfers([])
      setTotal(0)
      toast.error(getStockMovementErrorMessage(error, labels.listLoadError))
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter, labels.listLoadError])

  useEffect(() => { fetchTransfers() }, [fetchTransfers])

  const handleOpen = async (id: string) => {
    try {
      await stockMovementApi.open(id)
      toast.success('Đã mở phiếu')
      await fetchTransfers()
    } catch (error) {
      toast.error(getStockMovementErrorMessage(error, 'Không thể mở phiếu'))
    }
  }

  const handleUpdateDetails = async (
    id: string,
    details: { productItemId: string; quantity: number; importPrice?: number; note?: string }[],
  ) => {
    try {
      await stockMovementApi.updateDetails(id, { details })
      toast.success('Đã cập nhật phiếu')
      await fetchTransfers()
    } catch (error) {
      toast.error(getStockMovementErrorMessage(error, 'Không thể cập nhật danh sách hàng'))
      throw error
    }
  }

  const handleClose = async (id: string) => {
    try {
      await stockMovementApi.close(id)
      toast.success('Đã chốt phiếu')
      await fetchTransfers()
    } catch (error) {
      toast.error(getStockMovementErrorMessage(error, 'Không thể chốt phiếu'))
    }
  }

  const handleSubmitFromOpening = async (
    id: string,
    details: { productItemId: string; quantity: number; importPrice?: number; note?: string }[],
  ) => {
    try {
      await stockMovementApi.updateDetails(id, { details })
      toast.success('Đã cập nhật phiếu')
      await fetchTransfers()
    } catch (error) {
      toast.error(getStockMovementErrorMessage(error, 'Không thể cập nhật phiếu'))
      throw error
    }
  }

  const handleShipFromOpening = async (
    id: string,
    details: { productItemId: string; quantity: number; importPrice?: number; note?: string }[],
  ) => {
    try {
      await stockMovementApi.updateDetails(id, { details })
      await stockMovementApi.close(id)
      toast.success('Đã chốt phiếu')
      await fetchTransfers()
    } catch (error) {
      toast.error(getStockMovementErrorMessage(error, 'Không thể chốt phiếu'))
      throw error
    }
  }

  const handleShip = async (id: string) => {
    try {
      await stockMovementApi.ship(id)
      toast.success('Đã xuất hàng')
      await fetchTransfers()
    } catch (error) {
      toast.error(getStockMovementErrorMessage(error, 'Không thể xuất hàng'))
    }
  }

  const handleReceive = async (
    id: string,
    receivedDetails: { productItemId: string; receivedQuantity: number }[],
  ) => {
    try {
      await stockMovementApi.receive(id, { details: receivedDetails })
      toast.success(labels.receiveSuccess)
      await fetchTransfers()
    } catch (error) {
      toast.error(getStockMovementErrorMessage(error, labels.receiveError))
    }
  }

  const handleCancel = async (id: string) => {
    try {
      await stockMovementApi.cancel(id)
      toast.success(labels.cancelSuccess)
      await fetchTransfers()
    } catch (error) {
      toast.error(getStockMovementErrorMessage(error, labels.cancelError))
    }
  }

  const handleReturnGoods = async (source: StockMovement, reason?: string) => {
    try {
      await stockMovementApi.createAndShipReverseReturn(source, { reason })
      toast.success('Đã tạo phiếu trả hàng')
      await fetchTransfers()
    } catch (error) {
      toast.error(
        getStockMovementErrorMessage(error, 'Không thể tạo phiếu trả hàng'),
      )
      throw error
    }
  }

  return (
    <TransfersContext.Provider
      value={{
        transfers,
        total,
        isLoading,
        open,
        setOpen,
        statusFilter,
        setStatusFilter,
        fetchTransfers,
        handleOpen,
        handleUpdateDetails,
        handleSubmitFromOpening,
        handleShipFromOpening,
        handleClose,
        handleShip,
        handleReceive,
        handleCancel,
        handleReturnGoods,
        labels,
      }}
    >
      {children}
    </TransfersContext.Provider>
  )
}

export function useTransfers() {
  const ctx = useContext(TransfersContext)
  if (!ctx) throw new Error('useTransfers must be used within <TransfersProvider>')
  return ctx
}
