'use client'

import React, { useEffect, useRef, useState } from 'react'
import type { Product } from '@/types/product'
import type { ProductsDialogType, ProductFormValues } from '../_types/product.types'
import { useProductsMutations } from '../_hooks/use-products-mutations'
import { branchApi } from '@/lib/api/branch'
import { warehouseApi } from '@/lib/api/warehouse'
import { brandApi } from '@/lib/api/brand'
import { categoryApi } from '@/lib/api/category'
import { supplierApi } from '@/lib/api/supplier'
import { productApi } from '@/lib/api/product'
import type { Brand } from '@/types/brand'
import type { Category } from '@/types/category'
import type { Supplier } from '@/types/supplier'
import type { ProductScreen } from '../_constants/product-screen'

type LocationOption = { value: string; label: string }

type ProductsContextType = {
  screen: ProductScreen
  products: Product[]
  isLoading: boolean
  /** Tải lại danh sách từ BE - sau khi nhập file, khi hàng mới không đi qua handleAdd. */
  reloadProducts: () => Promise<void>
  open: ProductsDialogType | null
  setOpen: (str: ProductsDialogType | null) => void
  currentRow: Product | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Product | null>>
  handleAdd: (data: ProductFormValues, onDuplicateCode?: (message: string) => void) => Promise<boolean>
  handleEdit: (
    id: string,
    data: ProductFormValues,
    onDuplicateCode?: (message: string) => void,
  ) => Promise<boolean>
  handleDelete: (id: string) => Promise<boolean>
  selectedIds: string[]
  setSelectedIds: (ids: string[]) => void
  handleDeleteMany: (ids: string[]) => Promise<boolean>
  selectionVersion: number
  branchOptions: LocationOption[]
  warehouseOptions: LocationOption[]
  ensureLocationOptionsLoaded: () => void
  brands: Brand[]
  categories: Category[]
  suppliers: Supplier[]
  ensureSuppliersLoaded: () => void
  // Chuỗi sku + productCode (viết thường) theo productId cho ô tìm kiếm; GET /products không kèm trường cấp item (xem products-table.tsx).
  skuSearchIndex: Map<string, string>
}

const ProductsContext = React.createContext<ProductsContextType | null>(null)

export function ProductsProvider({
  screen,
  children,
}: {
  screen: ProductScreen
  children: React.ReactNode
}) {
  const { products, isLoading, reload, handleAdd, handleEdit, handleDelete, handleDeleteMany } =
    useProductsMutations(screen)
  const [open, setOpen] = useState<ProductsDialogType | null>(null)
  const [currentRow, setCurrentRow] = useState<Product | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectionVersion, setSelectionVersion] = useState(0)
  const [branchOptions, setBranchOptions] = useState<LocationOption[]>([])
  const [warehouseOptions, setWarehouseOptions] = useState<LocationOption[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [skuSearchIndex, setSkuSearchIndex] = useState<Map<string, string>>(new Map())
  const locationOptionsLoadedRef = useRef(false)
  const suppliersLoadedRef = useRef(false)

  useEffect(() => {
    Promise.allSettled([
      brandApi.getList({ limit: 100 }),
      categoryApi.getList({ limit: 100 }),
    ]).then(([brandRes, categoryRes]) => {
      setBrands(brandRes.status === 'fulfilled' ? brandRes.value.data : [])
      setCategories(categoryRes.status === 'fulfilled' ? categoryRes.value.data : [])
    })
  }, [])

  // Phục vụ tìm theo SKU/mã hàng ở ô tìm kiếm (xem products-table.tsx). GET /products không gắn trường cấp item, nên dựng index từ danh sách item phẳng.
  useEffect(() => {
    productApi
      .listItems({ limit: 500, productType: screen.listTypes })
      .then((items) => {
        const index = new Map<string, string>()
        for (const item of items) {
          const text = `${item.sku} ${item.productCode}`.toLowerCase()
          const existing = index.get(item.productId)
          index.set(item.productId, existing ? `${existing} ${text}` : text)
        }
        setSkuSearchIndex(index)
      })
      .catch(() => setSkuSearchIndex(new Map()))
  }, [screen.listTypes])

  // Chỉ cần trong picker/nhãn kho (dialog sửa, dialog phiên bản, detail sheet): tải khi mở lần đầu, không tải mỗi lần vào trang.
  function ensureLocationOptionsLoaded() {
    if (locationOptionsLoadedRef.current) return
    locationOptionsLoadedRef.current = true
    branchApi
      .getList({ limit: 100 })
      .then((res) => setBranchOptions((res.data ?? []).map((b) => ({ value: b.id, label: b.name }))))
      .catch(() => setBranchOptions([]))
    warehouseApi
      .getList({ limit: 100 })
      .then((res) => setWarehouseOptions((res.data ?? []).map((w) => ({ value: w.id, label: w.name }))))
      .catch(() => setWarehouseOptions([]))
  }

  // Chỉ cần trong dropdown/dòng chi tiết nhà cung cấp: tải khi mở lần đầu.
  function ensureSuppliersLoaded() {
    if (suppliersLoadedRef.current) return
    suppliersLoadedRef.current = true
    supplierApi
      .getList({ limit: 100 })
      .then((res) => setSuppliers(res.data))
      .catch(() => setSuppliers([]))
  }

  async function handleDeleteManyWrapper(ids: string[]): Promise<boolean> {
    const success = await handleDeleteMany(ids)
    if (success) {
      setSelectedIds([])
      setSelectionVersion((v) => v + 1)
    }
    return success
  }

  return (
    <ProductsContext.Provider
      value={{
        screen,
        products,
        isLoading,
        reloadProducts: reload,
        open,
        setOpen,
        currentRow,
        setCurrentRow,
        handleAdd,
        handleEdit,
        handleDelete,
        selectedIds,
        setSelectedIds,
        handleDeleteMany: handleDeleteManyWrapper,
        selectionVersion,
        branchOptions,
        warehouseOptions,
        ensureLocationOptionsLoaded,
        brands,
        categories,
        suppliers,
        ensureSuppliersLoaded,
        skuSearchIndex,
      }}
    >
      {children}
    </ProductsContext.Provider>
  )
}

export function useProducts() {
  const ctx = React.useContext(ProductsContext)
  if (!ctx) throw new Error('useProducts must be used within <ProductsProvider>')
  return ctx
}
