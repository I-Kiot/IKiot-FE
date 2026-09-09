// [Query – Billing]
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
 * Everything the billing screen draws, plus the one call that redraws it.
 *
 * The two halves are fetched together because they change at the same moment: when a
 * payment settles the plan becomes ACTIVE *and* the pending invoice becomes PAID. The
 * screen used to read the plan off `user.subscription` in the auth store - a field
 * `GET /auth/me` stopped returning - so nothing here could update without an F5.
 *
 * `refresh` is what the payment dialog calls when the activation event arrives.
 */
export function useBilling() {
  const [subscription, setSubscription] = useState<CurrentSubscription | null>(
    null,
  )
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(async () => {
    // Settled, not `all`: this is a read-only screen, and a failing half should leave the
    // last good render standing rather than blank the whole page. A staff account without
    // `subscriptions:read` gets 403 on the plan and still sees its own invoice list.
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
