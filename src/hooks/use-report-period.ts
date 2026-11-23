"use client"

// [Hook – kỳ báo cáo trên URL] Kỳ đang xem nằm ở `?from=YYYY-MM-DD&to=YYYY-MM-DD`, để F5 hay gửi link vẫn đúng kỳ.
// Không có (hoặc sai) thì mặc định 30 ngày gần nhất. Trang dùng hook này phải bọc Suspense vì đọc `useSearchParams`.

import { useCallback, useMemo } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  MAX_PERIOD_DAYS,
  defaultPeriod,
  periodDays,
  type ReportPeriod,
} from "@/app/(protected)/reports/hooks/use-dashboard-stats"

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

/** Ngày `YYYY-MM-DD` có thật (không phải 2026-02-31). */
function isRealDay(day: string | null): day is string {
  if (!day || !DAY_PATTERN.test(day)) return false
  const parsed = new Date(`${day}T00:00:00Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === day
}

/** Kỳ hợp lệ: hai ngày có thật, đầu không sau cuối, không dài quá một năm. */
export function isValidPeriod(period: { fromDate: string | null; toDate: string | null }): period is ReportPeriod {
  const { fromDate, toDate } = period
  if (!isRealDay(fromDate) || !isRealDay(toDate) || fromDate > toDate) return false
  return periodDays({ fromDate, toDate }) <= MAX_PERIOD_DAYS
}

export function useReportPeriod() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const from = searchParams.get("from")
  const to = searchParams.get("to")

  const period = useMemo<ReportPeriod>(() => {
    const candidate = { fromDate: from, toDate: to }
    return isValidPeriod(candidate) ? candidate : defaultPeriod()
  }, [from, to])

  /** Đổi kỳ: thay URL (không thêm lịch sử, không cuộn), giữ các tham số khác của trang. */
  const setPeriod = useCallback(
    (next: ReportPeriod) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set("from", next.fromDate)
      params.set("to", next.toDate)
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  return { period, setPeriod }
}
