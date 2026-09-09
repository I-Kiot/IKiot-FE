// [Table – Expanded Panel Brand]
'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { Brand } from '@/types/brand'
import { useBrands } from '../../_context/brands-provider'
import { getCachedUser } from '@/lib/auth'
import { canUpdateBrand, canDeleteBrand } from '@/components/sidebar/constants/role-permissions'

type BrandsExpandedPanelProps = {
  brand: Brand
  isExpanded: boolean
  isLastRow?: boolean
}

export function BrandsExpandedPanel({
  brand,
  isExpanded,
  isLastRow,
}: BrandsExpandedPanelProps) {
  const { setOpen, setCurrentRow } = useBrands()
  const role = getCachedUser()?.role
  const canEdit = canUpdateBrand(role)
  const canDelete = canDeleteBrand(role)
  const [loading, setLoading] = useState(false)
  const wasExpandedRef = useRef(false)

  useLayoutEffect(() => {
    if (isExpanded && !wasExpandedRef.current) {
      wasExpandedRef.current = true
      setLoading(true)
      const t = setTimeout(() => setLoading(false), 350)
      return () => clearTimeout(t)
    }
    if (!isExpanded) {
      wasExpandedRef.current = false
    }
  }, [isExpanded])

  if (loading) {
    return (
      <div className={cn('bg-background px-6 py-4 space-y-4', !isLastRow && 'border-b')}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-16 rounded-md" />
          <Skeleton className="h-8 w-32 rounded-md" />
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'bg-background px-6 py-4 animate-in fade-in-0 duration-200',
        !isLastRow && 'border-b',
      )}
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3 text-sm">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Tên thương hiệu</span>
          <span className="font-medium">{brand.name}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Ngày tạo</span>
          <span>{brand.createdAt}</span>
        </div>
        {brand.description && (
          <div className="flex flex-col gap-0.5 col-span-2 md:col-span-4">
            <span className="text-xs text-muted-foreground">Mô tả</span>
            <span className="text-muted-foreground">{brand.description}</span>
          </div>
        )}
      </div>
      <Separator className="mt-4" />
      <div className="flex items-center justify-between mt-3">
        {canDelete ? (
          <Button
            variant="destructive"
            size="sm"
            className="cursor-pointer"
            onClick={(e) => {
              e.stopPropagation()
              setCurrentRow(brand)
              setOpen('delete')
            }}
          >
            <Trash2 className="mr-2 size-4" />
            Xóa
          </Button>
        ) : <span />}
        {canEdit && (
          <Button
            size="sm"
            className="cursor-pointer"
            onClick={(e) => {
              e.stopPropagation()
              setCurrentRow(brand)
              setOpen('edit')
            }}
          >
            <Pencil className="mr-2 size-4" />
            Chỉnh sửa
          </Button>
        )}
      </div>
    </div>
  )
}
