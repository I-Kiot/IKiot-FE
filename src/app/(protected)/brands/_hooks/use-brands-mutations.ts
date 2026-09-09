// [Mutations – Brand]
'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import type { Brand } from '@/types/brand'
import type { BrandFormValues } from '../_types/brand.types'
import { brandApi } from '@/lib/api/brand'

export function useBrandsMutations() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchBrands = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await brandApi.getList({ limit: 100 })
      setBrands(res.data)
    } catch {
      toast.error('Tải danh sách thương hiệu thất bại')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBrands()
  }, [fetchBrands])

  async function handleAdd(data: BrandFormValues): Promise<boolean> {
    setIsLoading(true)
    try {
      const brand = await brandApi.create({
        name: data.name,
        description: data.description || undefined,
      })
      setBrands((prev) => [brand, ...prev])
      toast.success('Thêm thương hiệu thành công')
      return true
    } catch {
      toast.error('Thêm thương hiệu thất bại')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  async function handleEdit(id: string, data: BrandFormValues): Promise<boolean> {
    setIsLoading(true)
    try {
      const updated = await brandApi.update(id, {
        name: data.name,
        description: data.description || undefined,
      })
      setBrands((prev) => prev.map((b) => (b.id === id ? updated : b)))
      toast.success('Cập nhật thương hiệu thành công')
      return true
    } catch {
      toast.error('Cập nhật thương hiệu thất bại')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete(id: string): Promise<boolean> {
    setIsLoading(true)
    try {
      await brandApi.remove(id)
      setBrands((prev) => prev.filter((b) => b.id !== id))
      toast.success('Xóa thương hiệu thành công')
      return true
    } catch {
      toast.error('Xóa thương hiệu thất bại')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDeleteMany(ids: string[]): Promise<boolean> {
    setIsLoading(true)
    try {
      await Promise.all(ids.map((id) => brandApi.remove(id)))
      setBrands((prev) => prev.filter((b) => !ids.includes(b.id)))
      toast.success(`Xóa ${ids.length} thương hiệu thành công`)
      return true
    } catch {
      toast.error('Xóa thương hiệu thất bại')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return { brands, isLoading, handleAdd, handleEdit, handleDelete, handleDeleteMany }
}
