// [Mutations – Supplier]
'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import type { Supplier } from '@/types/supplier'
import type { SupplierFormValues } from '../_types/supplier.types'
import { supplierApi } from '@/lib/api/supplier'
import type { SupplierPayDebtPayload } from '@/types/supplier'

function extractErrorMessage(error: unknown, fallback: string): string {
  const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
  return message ?? fallback
}

export function useSuppliersMutations() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Tải danh sách khi mount - chỉ dùng một setter duy nhất trong `.then()`.
  useEffect(() => {
    supplierApi
      .getList({ limit: 100 })
      .then((res) => setSuppliers(res.data))
      .catch(() => toast.error('Tải danh sách nhà cung cấp thất bại'))
  }, [])

  async function handleAdd(data: SupplierFormValues): Promise<boolean> {
    setIsLoading(true)
    try {
      const supplier = await supplierApi.create({
        supplierName: data.supplierName,
        contactName: data.contactName || undefined,
        phoneNumber: data.phoneNumber || undefined,
        email: data.email || undefined,
        address: data.address || undefined,
        creditLimit: data.creditLimit,
      })
      setSuppliers((prev) => [supplier, ...prev])
      toast.success('Thêm nhà cung cấp thành công')
      return true
    } catch {
      toast.error('Thêm nhà cung cấp thất bại')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  async function handleEdit(id: string, data: SupplierFormValues): Promise<boolean> {
    setIsLoading(true)
    try {
      const updated = await supplierApi.update(id, {
        supplierName: data.supplierName,
        contactName: data.contactName || undefined,
        phoneNumber: data.phoneNumber || undefined,
        email: data.email || undefined,
        address: data.address || undefined,
        creditLimit: data.creditLimit,
      })
      setSuppliers((prev) => prev.map((s) => (s.id === id ? updated : s)))
      toast.success('Cập nhật nhà cung cấp thành công')
      return true
    } catch {
      toast.error('Cập nhật nhà cung cấp thất bại')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete(id: string): Promise<boolean> {
    setIsLoading(true)
    try {
      await supplierApi.remove(id)
      setSuppliers((prev) => prev.filter((s) => s.id !== id))
      toast.success('Xóa nhà cung cấp thành công')
      return true
    } catch (error) {
      // Backend từ chối xóa NCC còn công nợ (outstandingDebt > 0)
      toast.error(extractErrorMessage(error, 'Xóa nhà cung cấp thất bại'))
      return false
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDeleteMany(ids: string[]): Promise<boolean> {
    setIsLoading(true)
    try {
      await Promise.all(ids.map((id) => supplierApi.remove(id)))
      setSuppliers((prev) => prev.filter((s) => !ids.includes(s.id)))
      toast.success(`Xóa ${ids.length} nhà cung cấp thành công`)
      return true
    } catch {
      toast.error('Xóa nhà cung cấp thất bại (kiểm tra công nợ)')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  async function handlePayDebt(id: string, payload: SupplierPayDebtPayload): Promise<boolean> {
    setIsLoading(true)
    try {
      const updated = await supplierApi.payDebt(id, payload)
      setSuppliers((prev) => prev.map((s) => (s.id === id ? updated : s)))
      toast.success(`Thanh toán ${payload.amount.toLocaleString('vi-VN')} ₫ thành công`)
      return true
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Thanh toán công nợ thất bại'))
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return { suppliers, isLoading, handleAdd, handleEdit, handleDelete, handleDeleteMany, handlePayDebt }
}
