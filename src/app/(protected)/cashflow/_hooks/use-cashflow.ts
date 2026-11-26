// [Query – Cashflow (sổ thu chi)]
'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  statsApi,
  type Cashflow,
  type CashflowCategory,
  type CashflowFund,
  type CashflowList,
} from '@/lib/api/stats'

export type FlowTypeFilter = 'ALL' | 'INCOME' | 'EXPENSE'
export type FlowPrefixFilter = 'ALL' | 'ORD' | 'SUP'
export type CategoryFilter = 'ALL' | CashflowCategory
export type FundFilter = 'ALL' | CashflowFund

const DEFAULT_PAGE_SIZE = 15

/** Bộ lọc chung của trang báo cáo: kỳ và nơi. */
export interface CashflowScope {
  fromDate: string
  toDate: string
  branchId?: string
  warehouseId?: string
}

export function useCashflow({ fromDate, toDate, branchId, warehouseId }: CashflowScope) {
  const [flowType, setFlowTypeState] = useState<FlowTypeFilter>('ALL')
  const [flow, setFlowState] = useState<FlowPrefixFilter>('ALL')
  const [category, setCategoryState] = useState<CategoryFilter>('ALL')
  const [fund, setFundState] = useState<FundFilter>('ALL')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSizeState] = useState(DEFAULT_PAGE_SIZE)

  const [summary, setSummary] = useState<Cashflow | null>(null)
  const [list, setList] = useState<CashflowList | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Đổi bộ lọc bất kỳ sẽ về trang đầu. Reset trong setter (không dùng effect) để tránh render lặp.
  const setFlowType = useCallback((value: FlowTypeFilter) => {
    setFlowTypeState(value)
    setPage(1)
  }, [])
  const setFlow = useCallback((value: FlowPrefixFilter) => {
    setFlowState(value)
    setPage(1)
  }, [])
  const setCategory = useCallback((value: CategoryFilter) => {
    setCategoryState(value)
    setPage(1)
  }, [])
  const setFund = useCallback((value: FundFilter) => {
    setFundState(value)
    setPage(1)
  }, [])
  const setPageSize = useCallback((value: number) => {
    setPageSizeState(value)
    setPage(1)
  }, [])

  // Một bộ lọc cho tổng, bảng và file xuất, để ba thứ luôn nói về cùng các dòng.
  const filters = useMemo(
    () => ({
      fromDate,
      toDate,
      branchId,
      warehouseId,
      flowType: flowType === 'ALL' ? undefined : flowType,
      flow: flow === 'ALL' ? undefined : flow,
      category: category === 'ALL' ? undefined : category,
      fund: fund === 'ALL' ? undefined : fund,
    }),
    [fromDate, toDate, branchId, warehouseId, flowType, flow, category, fund],
  )

  const exportFile = useCallback(() => statsApi.exportCashflow(filters), [filters])

  const fetchAll = useCallback(async () => {
    setIsLoading(true)
    try {
      const [summaryRes, listRes] = await Promise.all([
        statsApi.getCashflow(filters),
        statsApi.getCashflowList({ ...filters, page, limit: pageSize }),
      ])

      setSummary(summaryRes)
      setList(listRes)
    } catch (err) {
      console.error(err)
      toast.error('Tải sổ thu chi thất bại')
    } finally {
      setIsLoading(false)
    }
  }, [filters, page, pageSize])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  return {
    summary,
    list,
    isLoading,
    flowType,
    setFlowType,
    flow,
    setFlow,
    category,
    setCategory,
    fund,
    setFund,
    page,
    setPage,
    pageSize,
    setPageSize,
    refetch: fetchAll,
    exportFile,
  }
}
