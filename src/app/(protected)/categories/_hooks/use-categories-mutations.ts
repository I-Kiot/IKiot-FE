// [Mutations – Category]
'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import type { Category } from '@/types/category'
import type { CategoryFormValues } from '../_types/category.types'
import { categoryApi } from '@/lib/api/category'

export function useCategoriesMutations() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchCategories = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await categoryApi.getList({ limit: 100 })
      setCategories(res.data)
    } catch {
      toast.error('Tải danh sách danh mục thất bại')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  async function handleAdd(data: CategoryFormValues): Promise<boolean> {
    setIsLoading(true)
    try {
      const category = await categoryApi.create({
        name: data.name,
        description: data.description || undefined,
        parentId: data.parentId || null,
      })
      setCategories((prev) => [category, ...prev])
      toast.success('Thêm danh mục thành công')
      return true
    } catch {
      toast.error('Thêm danh mục thất bại')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  async function handleEdit(id: string, data: CategoryFormValues): Promise<boolean> {
    setIsLoading(true)
    try {
      const updated = await categoryApi.update(id, {
        name: data.name,
        description: data.description || undefined,
        parentId: data.parentId || null,
      })
      setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)))
      toast.success('Cập nhật danh mục thành công')
      return true
    } catch {
      toast.error('Cập nhật danh mục thất bại')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete(id: string): Promise<boolean> {
    setIsLoading(true)
    try {
      await categoryApi.remove(id)
      setCategories((prev) => prev.filter((c) => c.id !== id))
      toast.success('Xóa danh mục thành công')
      return true
    } catch {
      toast.error('Xóa danh mục thất bại')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDeleteMany(ids: string[]): Promise<boolean> {
    setIsLoading(true)
    try {
      await Promise.all(ids.map((id) => categoryApi.remove(id)))
      setCategories((prev) => prev.filter((c) => !ids.includes(c.id)))
      toast.success(`Xóa ${ids.length} danh mục thành công`)
      return true
    } catch {
      toast.error('Xóa danh mục thất bại')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return { categories, isLoading, handleAdd, handleEdit, handleDelete, handleDeleteMany }
}
