// [Query – số liệu trang Thống kê] Mọi số liệu theo kỳ đang chọn và địa điểm đang xem, tải một lần cùng nhau.
'use client'

import { useCallback } from 'react'
import { statsApi } from '@/lib/api/stats'
import { useAsyncData } from '../../dashboard/hooks/use-async-data'
import { resolvePeriod, type ReportPeriod } from '../../reports/hooks/use-dashboard-stats'

/** Một biểu đồ lỗi chỉ làm trống biểu đồ đó, không cả trang. */
function optional<T>(request: Promise<T>): Promise<T | null> {
  return request.catch((err) => {
    console.error(err)
    return null
  })
}

/** `place`: id chi nhánh hoặc kho đang xem (dropdown trên trang; id dùng chung nên báo cáo bán hàng lọc thẳng theo id). */
export function useStatistics(period: ReportPeriod, place: string | undefined, reloadKey: number) {

  const load = useCallback(async () => {
    const range = resolvePeriod(period)
    const params = { fromDate: range.fromDate, toDate: range.toDate, branchId: place }
    const [overview, previousOverview, series, byBranch, byPayment, topProducts, comparison, heatmap] = await Promise.all([
      optional(statsApi.getOverview(params)),
      optional(statsApi.getOverview({ fromDate: range.previousFromDate, toDate: range.previousToDate, branchId: place })),
      optional(statsApi.getRevenue({ ...params, groupBy: range.groupBy })),
      optional(statsApi.getRevenueByBranch(params)),
      optional(statsApi.getRevenueByPaymentMethod(params)),
      optional(statsApi.getTopProducts({ ...params, sortBy: 'revenue', limit: 50 })),
      optional(statsApi.getRevenueComparison({ branchId: place })),
      optional(statsApi.getSalesHeatmap(params)),
    ])
    return { range, overview, previousOverview, series, byBranch, byPayment, topProducts, comparison, heatmap }
  }, [period, place])

  const { data, isLoading } = useAsyncData(load, reloadKey)
  return { data, isLoading }
}
