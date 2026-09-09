// [Mutations – Product]
'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import type { Product } from '@/types/product'
import type { ProductFormValues } from '../_types/product.types'
import { productApi } from '@/lib/api/product'
import { parsePriceAmount, getDeleteProductErrorMessage } from '../_constants/product.constants'
import { useAuthStore } from '@/store/auth-store'

function extractErrorMessage(err: unknown): string | undefined {
  return (err as { response?: { data?: { message?: string } } })?.response?.data?.message
}

export function useProductsMutations() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const locationKey = useAuthStore((state) => state.locationKey)

  useEffect(() => {
    productApi
      .getList()
      .then((res) => setProducts(res.data))
      .catch(() => toast.error('Tải danh sách hàng hóa thất bại'))
  }, [locationKey])

  async function handleAdd(data: ProductFormValues): Promise<boolean> {
    setIsLoading(true)
    try {
      const itemProductName = data.useParentNameForItem
        ? data.name
        : (data.itemProductName?.trim() || data.name)
      const product = await productApi.create({
        name: data.name,
        brandId: data.brandId ?? undefined,
        categoryId: data.categoryId ?? undefined,
        status: data.status,
        images: data.images,
        items: [
          {
            productName: itemProductName,
            productCode: data.productCode!,
            sku: data.sku!,
            barcode: data.barcode,
            retailPrice: parsePriceAmount(data.retailPrice),
            costPrice: parsePriceAmount(data.costPrice),
            vat: data.vat ? Math.min(Number(data.vat), 100) : undefined,
            warrantyPeriod: data.warrantyPeriod,
            description: data.description,
            images: data.itemImages?.length ? data.itemImages : data.images,
            productDetails: data.productDetails?.filter((d) => d.name.trim() && d.value.trim()),
          },
        ],
      })
      // Hàng vừa tạo chưa có ở đâu cả - chưa có phiếu nhập nào - nên cả hai con số đều 0.
      setProducts((prev) => [
        { ...product, totalStock: 0, totalStockAllLocations: 0 },
        ...prev,
      ])
      toast.success('Thêm hàng hóa thành công')
      return true
    } catch {
      toast.error('Thêm hàng hóa thất bại')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  async function handleEdit(id: string, data: ProductFormValues): Promise<boolean> {
    setIsLoading(true)
    try {
      const product = await productApi.update(id, {
        name: data.name,
        brandId: data.brandId ?? undefined,
        categoryId: data.categoryId ?? undefined,
        status: data.status,
        images: data.images,
      })
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...product } : p)))
      toast.success('Cập nhật hàng hóa thành công')
      return true
    } catch {
      toast.error('Cập nhật hàng hóa thất bại')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete(id: string): Promise<boolean> {
    setIsLoading(true)
    try {
      await productApi.remove(id)
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: 'DISCONTINUED' } : p)),
      )
      toast.success('Xóa hàng hóa thành công')
      return true
    } catch (err) {
      toast.error(getDeleteProductErrorMessage(extractErrorMessage(err)))
      return false
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDeleteMany(ids: string[]): Promise<boolean> {
    // Khớp với logic xóa đơn lẻ: hàng hóa đã DISCONTINUED thì không xóa lại được.
    const eligibleIds = ids.filter((id) => {
      const product = products.find((p) => p.id === id)
      return product ? product.status !== 'DISCONTINUED' : true
    })
    const skippedCount = ids.length - eligibleIds.length

    if (eligibleIds.length === 0) {
      toast.error('Các hàng hóa đã chọn đều đang ngừng sản xuất, không thể xóa lại')
      return false
    }

    setIsLoading(true)
    try {
      // allSettled: mỗi hàng hóa giờ được BE kiểm tra riêng (tồn kho / phiếu
      // chuyển kho / đơn hàng chờ xử lý), nên một mục thất bại không được phép
      // làm rollback các mục còn lại đã xóa thành công.
      const results = await Promise.allSettled(
        eligibleIds.map((id) => productApi.remove(id)),
      )

      const succeededIds: string[] = []
      const failures: string[] = []
      results.forEach((result, idx) => {
        if (result.status === 'fulfilled') {
          succeededIds.push(eligibleIds[idx])
        } else {
          failures.push(getDeleteProductErrorMessage(extractErrorMessage(result.reason)))
        }
      })

      if (succeededIds.length > 0) {
        setProducts((prev) =>
          prev.map((p) => (succeededIds.includes(p.id) ? { ...p, status: 'DISCONTINUED' } : p)),
        )
      }

      if (failures.length === 0) {
        toast.success(
          skippedCount > 0
            ? `Xóa ${succeededIds.length} hàng hóa thành công (bỏ qua ${skippedCount} hàng hóa đã ngừng sản xuất)`
            : `Xóa ${succeededIds.length} hàng hóa thành công`,
        )
      } else if (succeededIds.length > 0) {
        toast.warning(
          `Xóa thành công ${succeededIds.length} hàng hóa. ${failures.length} hàng hóa không thể xóa: ${failures[0]}${failures.length > 1 ? ` (và ${failures.length - 1} lỗi khác)` : ''}`,
        )
      } else {
        toast.error(failures[0])
      }

      return succeededIds.length > 0
    } finally {
      setIsLoading(false)
    }
  }

  return { products, isLoading, handleAdd, handleEdit, handleDelete, handleDeleteMany }
}
