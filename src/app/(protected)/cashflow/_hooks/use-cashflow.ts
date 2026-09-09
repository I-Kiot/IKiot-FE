// [Query – Cashflow (sổ thu chi)]
'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth-store'
import { locationFilter } from '@/lib/location-key'
import { statsApi, type Cashflow, type CashflowList } from '@/lib/api/stats'

export type CashflowRange = '7d' | '30d' | '90d' | '12m'
export type FlowTypeFilter = 'ALL' | 'INCOME' | 'EXPENSE'
export type FlowPrefixFilter = 'ALL' | 'ORD' | 'SUP' | 'PAYR'

const RANGE_DAYS: Record<CashflowRange, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  '12m': 365,
}

const PAGE_SIZE = 15

function toDateOnly(date: Date): string {
  return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' })
}

export function useCashflow() {
  const locationKey = useAuthStore((state) => state.locationKey)
  const { branchId, warehouseId } = locationFilter(locationKey)

  const [range, setRangeState] = useState<CashflowRange>('30d')
  const [flowType, setFlowTypeState] = useState<FlowTypeFilter>('ALL')
  const [flow, setFlowState] = useState<FlowPrefixFilter>('ALL')
  const [page, setPage] = useState(1)

  const [summary, setSummary] = useState<Cashflow | null>(null)
  const [list, setList] = useState<CashflowList | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Changing any filter resets back to the first page. Reset in the setters
  // (rather than an effect) to avoid a cascading re-render. The active
  // branch/warehouse from the sidebar switcher scopes the ledger too.
  const setRange = useCallback((value: CashflowRange) => {
    setRangeState(value)
    setPage(1)
  }, [])
  const setFlowType = useCallback((value: FlowTypeFilter) => {
    setFlowTypeState(value)
    setPage(1)
  }, [])
  const setFlow = useCallback((value: FlowPrefixFilter) => {
    setFlowState(value)
    setPage(1)
  }, [])

  const fetchAll = useCallback(async () => {
    setIsLoading(true)
    try {
      const toDate = new Date()
      const fromDate = new Date(toDate.getTime() - RANGE_DAYS[range] * 24 * 60 * 60 * 1000)
      const dateParams = {
        fromDate: toDateOnly(fromDate),
        toDate: toDateOnly(toDate),
        branchId,
        warehouseId,
      }
      const flowTypeParam = flowType === 'ALL' ? undefined : flowType
      const flowParam = flow === 'ALL' ? undefined : flow

      const [summaryRes, listRes] = await Promise.all([
        statsApi.getCashflow({ ...dateParams, flowType: flowTypeParam, flow: flowParam }),
        statsApi.getCashflowList({
          ...dateParams,
          flowType: flowTypeParam,
          flow: flowParam,
          page,
          limit: PAGE_SIZE,
        }),
      ])

      setSummary(summaryRes)
      setList(listRes)
    } catch (err) {
      console.error(err)
      toast.error('Tải sổ thu chi thất bại')
    } finally {
      setIsLoading(false)
    }
  }, [range, flowType, flow, branchId, warehouseId, page])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  return {
    summary,
    list,
    isLoading,
    range,
    setRange,
    flowType,
    setFlowType,
    flow,
    setFlow,
    page,
    setPage,
    pageSize: PAGE_SIZE,
    refetch: fetchAll,
  }
}
