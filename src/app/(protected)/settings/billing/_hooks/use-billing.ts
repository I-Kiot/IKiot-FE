'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  getCurrentSubscription,
  listInvoices,
  type CurrentSubscription,
  type Invoice,
} from '@/lib/api/subscription'

 /**
 * Dữ liệu màn billing (gói và hoá đơn) cùng hàm `refresh`. Hai phần đổi cùng lúc khi thanh toán xong,
 * nên được fetch chung; payment dialog gọi `refresh` khi nhận sự kiện kích hoạt.
 */
export function useBilling() {
  const [subscription, setSubscription] = useState<CurrentSubscription | null>(
    null,
  )
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(async () => {
    // Dùng allSettled, không dùng all: staff thiếu quyền subscriptions:read bị 403 ở gói nhưng vẫn xem được hoá đơn.
    const [plan, list] = await Promise.allSettled([
      getCurrentSubscription(),
      listInvoices(),
    ])
    if (plan.status === 'fulfilled') setSubscription(plan.value)
    if (list.status === 'fulfilled') setInvoices(list.value)
    if (plan.status === 'rejected' && list.status === 'rejected') {
      toast.error('Không thể tải thông tin gói dịch vụ.')
    }
  }, [])

  useEffect(() => {
    let active = true
    void refresh().finally(() => {
      if (active) setIsLoading(false)
    })
    return () => {
      active = false
    }
  }, [refresh])

  return { subscription, invoices, isLoading, refresh }
}
