// [Mutations – Promotion]
'use client'

import { useState, useEffect } from 'react'
import { AxiosError } from 'axios'
import { toast } from 'sonner'
import { branchIdOf } from '@/lib/location-key'
import type { Promotion } from '@/types/promotion'
import type { PromotionFormValues } from '../_types/promotion.types'
import { promotionApi } from '@/lib/api/promotion'
import { getApiErrorBody, messageForCode } from '@/lib/api/error-codes'
import { useAuthStore } from '@/store/auth-store'
import { vnStartOfDayToIso, vnEndOfDayToIso } from '../_shared/promotion-date'

function getErrorMessage(err: unknown, fallback: string): string {
  const mapped = messageForCode(getApiErrorBody(err)?.code)
  if (mapped) return mapped

  if (err instanceof AxiosError) {
    const data = err.response?.data as { message?: string } | undefined
    if (typeof data?.message === 'string' && data.message.trim()) return data.message
  }
  return fallback
}

function toPayload(data: PromotionFormValues) {
  return {
    promoName: data.promoName,
    description: data.description || undefined,
    branchIds: data.branchIds,
    discountType: data.discountType,
    discountValue: data.discountValue,
    maxDiscountAmount: data.maxDiscountAmount,
    minOrderValue: data.minOrderValue,
    applicableRule: {
      type: data.applicableRuleType,
      categoryIds: data.applicableRuleType === 'category' ? data.categoryIds : [],
      productItemIds: data.applicableRuleType === 'product' ? data.productItemIds : [],
    },
    // Ngày chọn trên form là ngày lịch VN (input date-only, không có timezone) - quy đổi
    // đúng sang mốc UTC của đầu/cuối ngày giờ VN thay vì hiểu nhầm thành UTC midnight.
    startDate: vnStartOfDayToIso(data.startDate),
    endDate: vnEndOfDayToIso(data.endDate),
    stackable: data.stackable,
    usageLimit: data.usageLimit,
    usageLimitPerCustomer: data.usageLimitPerCustomer,
    ...(data.status ? { status: data.status } : {}),
  }
}

export function usePromotionsMutations() {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const locationKey = useAuthStore((state) => state.locationKey)

  useEffect(() => {
    promotionApi
      .getList({ limit: 100, branchId: branchIdOf(locationKey) })
      .then((res) => res.data)
      .catch(() => {
        toast.error('Tải danh sách khuyến mãi thất bại')
        return [] as Promotion[]
      })
      .then((data) => setPromotions(data))
  }, [locationKey])

  async function handleAdd(data: PromotionFormValues): Promise<boolean> {
    setIsLoading(true)
    try {
      const promotion = await promotionApi.create(toPayload(data))
      setPromotions((prev) => [promotion, ...prev])
      toast.success('Thêm khuyến mãi thành công')
      return true
    } catch (err) {
      toast.error(getErrorMessage(err, 'Thêm khuyến mãi thất bại'))
      return false
    } finally {
      setIsLoading(false)
    }
  }

  async function handleEdit(id: string, data: PromotionFormValues): Promise<boolean> {
    setIsLoading(true)
    try {
      const updated = await promotionApi.update(id, toPayload(data))
      setPromotions((prev) => prev.map((p) => (p.id === id ? updated : p)))
      toast.success('Cập nhật khuyến mãi thành công')
      return true
    } catch (err) {
      toast.error(getErrorMessage(err, 'Cập nhật khuyến mãi thất bại'))
      return false
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete(id: string): Promise<boolean> {
    setIsLoading(true)
    try {
      await promotionApi.remove(id)
      setPromotions((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: 'INACTIVE' } : p)),
      )
      toast.success('Đã tắt khuyến mãi')
      return true
    } catch (err) {
      toast.error(getErrorMessage(err, 'Tắt khuyến mãi thất bại'))
      return false
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDeleteMany(ids: string[]): Promise<boolean> {
    setIsLoading(true)
    try {
      await Promise.all(ids.map((id) => promotionApi.remove(id)))
      setPromotions((prev) =>
        prev.map((p) => (ids.includes(p.id) ? { ...p, status: 'INACTIVE' } : p)),
      )
      toast.success(`Đã tắt ${ids.length} khuyến mãi`)
      return true
    } catch (err) {
      toast.error(getErrorMessage(err, 'Tắt khuyến mãi thất bại'))
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return { promotions, isLoading, handleAdd, handleEdit, handleDelete, handleDeleteMany }
}
