// [Context – UI State]
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

type LocationOption = { value: string; label: string }

type ProductsContextType = {
  products: Product[]
  isLoading: boolean
  open: ProductsDialogType | null
  setOpen: (str: ProductsDialogType | null) => void
  currentRow: Product | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Product | null>>
  handleAdd: (data: ProductFormValues) => Promise<boolean>
  handleEdit: (id: string, data: ProductFormValues) => Promise<boolean>
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
  // productId -> lowercased "sku productCode" text, for the toolbar search box
  // (GET /products doesn't include item-level fields on each product; see products-table.tsx).
  skuSearchIndex: Map<string, string>
}

const ProductsContext = React.createContext<ProductsContextType | null>(null)

export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const { products, isLoading, handleAdd, handleEdit, handleDelete, handleDeleteMany } =
    useProductsMutations()
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

  // Powers the toolbar search box's SKU/product-code matching (see products-table.tsx) -
  // GET /products doesn't attach item-level fields per product, so build the index from
  // the flat item list instead.
  useEffect(() => {
    productApi
      .listItems({ limit: 500 })
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
  }, [])

  // Only needed inside stock-location pickers/labels (mutate dialog, item dialogs,
  // detail sheet) - fetched on first open instead of on every products page mount.
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

  // Only needed inside the Supplier dropdown/detail row - fetched on first open.
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
        products,
        isLoading,
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
