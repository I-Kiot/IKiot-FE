'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  getCurrentSubscription,
  listInvoices,
  type CurrentSubscription,
  type Invoice,
} from '@/lib/api/subscription'

 /** Dữ liệu màn billing: gói và hoá đơn. */
export function useBilling() {
  const [subscription, setSubscription] = useState<CurrentSubscription | null>(
    null,
  )
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(async () => {
    // Dùng allSettled để thiếu quyền một phần vẫn xem được phần kia.
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
