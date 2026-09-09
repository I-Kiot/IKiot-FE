// [Mutations – Customer]
'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import type { Customer } from '@/types/customer'
import { branchIdOf } from '@/lib/location-key'
import type { CustomerFormValues } from '../_types/customer.types'
import { customerApi } from '@/lib/api/customer'
import { useAuthStore } from '@/store/auth-store'

import { formatDateTime } from '@/lib/utils'

export function useCustomersMutations() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const locationKey = useAuthStore((state) => state.locationKey)

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await customerApi.getList({
        limit: 100,
        branchId: branchIdOf(locationKey),
      })
      const customersData = res.data

      // Map raw ISO date strings of orders into the formatDateTime string format
      const enrichedCustomers = customersData.map((customer) => ({
        ...customer,
        orders: (customer.orders || []).map((o) => ({
          ...o,
          createdAt: formatDateTime(o.createdAt),
        })),
      }))

      setCustomers(enrichedCustomers)
    } catch (err) {
      console.error(err)
      toast.error('Tải danh sách khách hàng thất bại')
    } finally {
      setIsLoading(false)
    }
  }, [locationKey])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  async function handleAdd(data: CustomerFormValues): Promise<boolean> {
    setIsLoading(true)
    try {
      const customer = await customerApi.create({
        customerCode: data.customerCode || undefined,
        name: data.name,
        phone: data.phone || undefined,
        gender: data.gender,
        address: data.address || undefined,
        dob: data.dob || undefined,
      })
      setCustomers((prev) => [customer, ...prev])
      toast.success('Thêm khách hàng thành công')
      return true
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Thêm khách hàng thất bại')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  async function handleEdit(id: string, data: CustomerFormValues): Promise<boolean> {
    setIsLoading(true)
    try {
      const updated = await customerApi.update(id, {
        customerCode: data.customerCode || undefined,
        name: data.name,
        phone: data.phone || undefined,
        gender: data.gender,
        address: data.address || undefined,
        dob: data.dob || undefined,
      })
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...updated,
                orders: c.orders, // Preserve existing orders/spending data
              }
            : c,
        ),
      )
      toast.success('Cập nhật khách hàng thành công')
      return true
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Cập nhật khách hàng thất bại')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete(id: string): Promise<boolean> {
    setIsLoading(true)
    try {
      await customerApi.remove(id)
      setCustomers((prev) => prev.filter((c) => c.id !== id))
      toast.success('Xóa khách hàng thành công')
      return true
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Xóa khách hàng thất bại')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDeleteMany(ids: string[]): Promise<boolean> {
    setIsLoading(true)
    try {
      await customerApi.removeMany(ids)
      setCustomers((prev) => prev.filter((c) => !ids.includes(c.id)))
      toast.success(`Xóa ${ids.length} khách hàng thành công`)
      return true
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Xóa khách hàng thất bại')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return { customers, isLoading, handleAdd, handleEdit, handleDelete, handleDeleteMany }
}
