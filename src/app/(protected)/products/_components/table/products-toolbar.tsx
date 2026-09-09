'use client'

import { useMemo } from 'react'
import { type Table } from '@tanstack/react-table'
import { Building2, Funnel, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CascadeSelect } from '@/components/ui/cascade-select'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { COLUMN_LABELS } from '../../_constants/product.constants'
import type { Product } from '@/types/product'
import { useProducts } from '../../_context/products-provider'

type ProductsToolbarProps = {
  table: Table<Product>
}

export function ProductsToolbar({ table }: ProductsToolbarProps) {
  const { brands, categories, setOpen } = useProducts()

  const brandFilter = table.getColumn('brandId')?.getFilterValue() as string | undefined
  const categoryFilter = table.getColumn('categoryId')?.getFilterValue() as string | undefined
  const statusFilter = table.getColumn('status')?.getFilterValue() as string | undefined

  const categoryItems = useMemo(
    () => [
      { id: 'all', label: 'Tất cả danh mục', parentId: null },
      ...categories.map((c) => ({
        id: c.id,
        label: c.name,
        parentId: !c.parentId
          ? null
          : typeof c.parentId === 'string'
            ? c.parentId
            : (c.parentId as { id: string }).id,
      })),
    ],
    [categories],
  )

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên, mã hàng, SKU..."
            value={(table.getState().globalFilter as string) ?? ''}
            onChange={(e) => table.setGlobalFilter(String(e.target.value))}
            className="pl-9 h-9"
          />
        </div>

        <Select
          value={brandFilter ?? ''}
          onValueChange={(value) =>
            table.getColumn('brandId')?.setFilterValue(value === 'all' ? '' : value)
          }
        >
          <SelectTrigger className="cursor-pointer w-36 h-9 text-sm">
            <SelectValue placeholder="Thương hiệu" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả thương hiệu</SelectItem>
            {brands.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <CascadeSelect
          items={categoryItems}
          value={categoryFilter || null}
          onValueChange={(val) =>
            table.getColumn('categoryId')?.setFilterValue(val && val !== 'all' ? val : '')
          }
          placeholder="Danh mục"
          className="w-36 h-9 text-sm cursor-pointer"
        />

        <Select
          onValueChange={(value) => {
            if (value === 'all') table.getColumn('stock')?.setFilterValue(undefined)
            else if (value === 'out') table.getColumn('stock')?.setFilterValue('out')
            else if (value === 'low') table.getColumn('stock')?.setFilterValue('low')
          }}
        >
          <SelectTrigger className="cursor-pointer w-28 h-9 text-sm">
            <SelectValue placeholder="Tồn kho" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="out">Hết hàng (= 0)</SelectItem>
            <SelectItem value="low">Sắp hết (&lt; 10)</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={statusFilter ?? ''}
          onValueChange={(value) =>
            table.getColumn('status')?.setFilterValue(value === 'all' ? '' : value)
          }
        >
          <SelectTrigger className="cursor-pointer w-36 h-9 text-sm">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="ACTIVE">Đang kinh doanh</SelectItem>
            <SelectItem value="INACTIVE">Ngừng kinh doanh</SelectItem>
            <SelectItem value="DISCONTINUED">Ngừng sản xuất</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="cursor-pointer h-9"
          onClick={() => setOpen('crossBranchSearch')}
        >
          <Building2 className="mr-1.5 size-4" />
          Tìm ở chi nhánh khác
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="cursor-pointer h-9">
              <Funnel />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((col) => col.getCanHide())
              .map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.id}
                  className="capitalize"
                  checked={col.getIsVisible()}
                  onCheckedChange={(value) => col.toggleVisibility(!!value)}
                >
                  {COLUMN_LABELS[col.id] ?? col.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
