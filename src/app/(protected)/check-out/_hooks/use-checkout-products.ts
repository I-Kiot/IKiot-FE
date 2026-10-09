import { useState, useEffect } from 'react'
import { productApi } from '@/lib/api/product'
import type { Product, ProductSearchParams } from '@/types/product'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth-store'
import { getCachedUser } from '@/lib/auth'

export type CheckoutLocation = { id: string; type: 'BRANCH' | 'WAREHOUSE' }

/**
 * `location` overrides where stock is read: undefined = the sale's own branch (account posting /
 * switcher), null = no location, a value = that location (the manual-order form reads the
 * branch/warehouse the order ships from).
 */
export function useCheckoutProducts(searchQuery: string, location?: CheckoutLocation | null) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const locationKey = useAuthStore((state) => state.locationKey)

  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setProducts([])
      return
    }

    const resolveBranchId = (): string => {
      const cachedUser = getCachedUser() as any;
      if (cachedUser?.branchId) return cachedUser.branchId;
      if (typeof window !== "undefined") {
        const activeSwitcherItemId = localStorage.getItem("activeSwitcherItemId");
        const activeSwitcherItemType = localStorage.getItem("activeSwitcherItemType");
        if (activeSwitcherItemId && activeSwitcherItemType === "branch" && activeSwitcherItemId !== "all-branches") {
          return activeSwitcherItemId;
        }
      }
      return "";
    };

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true)
      try {
        const branchId = resolveBranchId()
        const params: ProductSearchParams = { q: searchQuery, limit: 20, status: 'ACTIVE' }
        if (location !== undefined) {
          if (location) {
            params.locationId = location.id
            params.locationType = location.type
          }
        } else if (branchId) {
          params.locationId = branchId
          params.locationType = 'BRANCH'
        }
        const res = await productApi.search(params)
        setProducts(res.data)
      } catch (error) {
        console.error('Search products failed:', error)
        toast.error('Không thể tìm kiếm sản phẩm')
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery, locationKey, location?.id, location?.type])

  return { products, loading }
}
