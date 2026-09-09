import { useState, useEffect } from 'react'
import { productApi } from '@/lib/api/product'
import type { Product } from '@/types/product'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth-store'
import { getCachedUser } from '@/lib/auth'

export function useCheckoutProducts(searchQuery: string) {
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
        const params: any = { q: searchQuery, limit: 20, status: 'ACTIVE' }
        if (branchId) {
          params.locationId = branchId
          params.locationType = 'branch'
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
  }, [searchQuery, locationKey])

  return { products, loading }
}
