// [Table – Expanded Panel Customer]
'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn, formatDateTime } from '@/lib/utils'
import type { Customer } from '@/types/customer'
import {
  GENDER_MAP,
  ORDER_STATUS_MAP,
  PAYMENT_LABEL,
} from '../../_constants/customer.constants'
import { useCustomers } from '../../_context/customers-provider'

const formatVND = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)

type CustomersExpandedPanelProps = {
  customer: Customer
  isExpanded: boolean
  isLastRow?: boolean
}

export function CustomersExpandedPanel({
  customer,
  isExpanded,
  isLastRow,
}: CustomersExpandedPanelProps) {
  const { setOpen, setCurrentRow } = useCustomers()
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

  const totalSpending = customer.orders
    .filter((o) => o.status === 'COMPLETED')
    .reduce((sum, o) => sum + o.grandTotal, 0)

  if (loading) {
    return (
      <div className={cn('bg-background px-6 py-4 space-y-4', !isLastRow && 'border-b')}>
        <div className="flex gap-4 mb-2">
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-32 rounded-md" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
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
      <Tabs defaultValue="info">
        <TabsList className="mb-4">
          <TabsTrigger value="info" className="cursor-pointer">
            Thông tin
          </TabsTrigger>
          <TabsTrigger value="history" className="cursor-pointer">
            Lịch sử mua hàng
            <Badge variant="secondary" className="ml-1.5 text-xs">
              {customer.orders.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3 text-sm">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Mã khách hàng</span>
              <span className="font-mono font-medium">{customer.customerCode}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Họ và tên</span>
              <span className="font-medium">{customer.name}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Số điện thoại</span>
              <span>{customer.phone || '-'}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Giới tính</span>
              <Badge
                variant="secondary"
                className={cn('w-fit text-xs', GENDER_MAP[customer.gender].className)}
              >
                {GENDER_MAP[customer.gender].label}
              </Badge>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Ngày sinh</span>
              <span>{customer.dob || '-'}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Ngày tạo</span>
              <span>{formatDateTime(customer.createdAt)}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Tổng chi tiêu</span>
              <span className="font-medium text-primary tabular-nums">
                {formatVND(totalSpending)}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Số đơn hàng</span>
              <span className="font-medium">{customer.orders.length}</span>
            </div>
            {customer.address && (
              <div className="flex flex-col gap-0.5 col-span-2 md:col-span-4">
                <span className="text-xs text-muted-foreground">Địa chỉ</span>
                <span className="text-muted-foreground">{customer.address}</span>
              </div>
            )}
          </div>
          <Separator className="mt-4" />
          <div className="flex items-center justify-between mt-3">
            <Button
              variant="destructive"
              size="sm"
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                setCurrentRow(customer)
                setOpen('delete')
              }}
            >
              <Trash2 className="mr-2 size-4" />
              Xóa
            </Button>
            <Button
              size="sm"
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                setCurrentRow(customer)
                setOpen('edit')
              }}
            >
              <Pencil className="mr-2 size-4" />
              Chỉnh sửa
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="history">
          {customer.orders.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Chưa có đơn hàng nào</p>
          ) : (
            <div className="space-y-2">
              <div className="rounded-md border [&_[data-slot=table-container]]:max-h-[300px] [&_[data-slot=table-container]]:overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow className="bg-muted">
                      <TableHead className="text-xs">Mã đơn</TableHead>
                      <TableHead className="text-xs">Ngày mua</TableHead>
                      <TableHead className="text-xs">Chi nhánh</TableHead>
                      <TableHead className="text-xs">Sản phẩm</TableHead>
                      <TableHead className="text-xs">Thanh toán</TableHead>
                      <TableHead className="text-xs">Trạng thái</TableHead>
                      <TableHead className="text-xs text-right">Tổng tiền</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customer.orders.map((order) => (
                      <TableRow key={order.id} className="text-sm">
                        <TableCell className="font-mono text-xs">{order.id}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {order.createdAt}
                        </TableCell>
                        <TableCell className="text-xs">{order.branchName}</TableCell>
                        <TableCell className="text-xs">
                          <div className="flex flex-col gap-0.5">
                            {order.items.map((item, i) => (
                              <span key={i} className="text-muted-foreground">
                                {item.productName}{' '}
                                <span className="text-foreground font-medium">×{item.quantity}</span>
                              </span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          {PAYMENT_LABEL[order.paymentMethod]}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={cn('text-xs', ORDER_STATUS_MAP[order.status].className)}
                          >
                            {ORDER_STATUS_MAP[order.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums text-xs">
                          {formatVND(order.grandTotal)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex justify-end text-sm font-medium pt-1 pr-1">
                Tổng chi tiêu (hoàn thành):&nbsp;
                <span className="text-primary tabular-nums">{formatVND(totalSpending)}</span>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
