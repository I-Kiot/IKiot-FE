'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { stockMovementApi } from '@/lib/api/stock-movement'
import { getStockMovementErrorMessage } from '@/app/(protected)/exchange/shared/stock-movement-error'
import type { StockMovement, MovementStatus } from '@/types/stock-movement'

interface ImportsContextType {
  imports: StockMovement[]
  isLoading: boolean
  statusFilter: MovementStatus | 'ALL'
  setStatusFilter: (v: MovementStatus | 'ALL') => void
  handleUpdateDetails: (
    id: string,
    details: { productItemId: string; quantity: number; importPrice?: number; note?: string }[],
  ) => Promise<void>
  handleShip: (id: string) => Promise<void>
  handleReceive: (id: string, receivedDetails: { productItemId: string; receivedQuantity: number }[]) => Promise<void>
  handleCancel: (id: string) => Promise<void>
}

const ImportsContext = createContext<ImportsContextType | null>(null)

type Props = {
  children: React.ReactNode
  /** Tăng lên khi dữ liệu đổi từ bên ngoài bảng (vừa tạo đơn trong dialog chung) để tải lại. */
  refreshSignal: number
}

/** Dữ liệu tab Nhà cung cấp. Chỉ lấy phiếu `SUPPLIER`: phiếu nhận hàng xưởng mở từ chi tiết yêu cầu sản xuất. */
export function ImportsProvider({ children, refreshSignal }: Props) {
  const [statusFilter, setStatusFilter] = useState<MovementStatus | 'ALL'>('ALL')
  const [reloads, setReloads] = useState(0)
  // Gắn kèm query đã trả lời: khi tag khác nghĩa là có yêu cầu mới đang chạy.
  const query = `${statusFilter}|${refreshSignal}|${reloads}`
  const [loaded, setLoaded] = useState<{ query: string; rows: StockMovement[] } | null>(null)
  const isLoading = loaded?.query !== query
  const imports = loaded?.rows ?? []

  useEffect(() => {
    let stale = false
    stockMovementApi
      .getList({
        movementType: 'IMPORT',
        importSource: 'SUPPLIER',
        limit: 50,
        ...(statusFilter !== 'ALL' && { status: statusFilter }),
      })
      .then((res) => {
        if (!stale) setLoaded({ query, rows: res.data })
      })
      .catch((error) => {
        if (stale) return
        console.error(error)
        toast.error(getStockMovementErrorMessage(error, 'Không thể tải danh sách nhập hàng'))
        setLoaded({ query, rows: [] })
      })
    return () => {
      stale = true
    }
  }, [statusFilter, query])

  const reload = () => setReloads((n) => n + 1)

  const handleUpdateDetails = async (
    id: string,
    details: { productItemId: string; quantity: number; importPrice?: number; note?: string }[],
  ) => {
    try {
      await stockMovementApi.updateDetails(id, { details })
      toast.success('Đã cập nhật danh sách hàng')
      reload()
    } catch (error) {
      toast.error(getStockMovementErrorMessage(error, 'Không thể cập nhật danh sách hàng'))
      throw error
    }
  }

  const handleShip = async (id: string) => {
    try {
      await stockMovementApi.ship(id)
      toast.success('Đã giao hàng')
      reload()
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
      reload()
    } catch (error) {
      console.error(error)
      toast.error(getStockMovementErrorMessage(error, 'Không thể nhận hàng, vui lòng thử lại'))
    }
  }

  const handleCancel = async (id: string) => {
    try {
      await stockMovementApi.cancel(id)
      toast.success('Đã huỷ đơn nhập hàng')
      reload()
    } catch (error) {
      console.error(error)
      toast.error(getStockMovementErrorMessage(error, 'Không thể huỷ đơn, vui lòng thử lại'))
    }
  }

  return (
    <ImportsContext.Provider
      value={{
        imports,
        isLoading,
        statusFilter,
        setStatusFilter,
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
