// [Table – Expanded Panel Promotion]
'use client'

import { useEffect, useState } from 'react'
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
import { getCachedUser } from '@/lib/auth'
import {
  canUpdatePromotion,
  canDeletePromotion,
} from '@/components/sidebar/constants/role-permissions'
import type { Promotion, PromotionLog } from '@/types/promotion'
import { promotionApi } from '@/lib/api/promotion'
import {
  APPLICABLE_RULE_LABEL,
  DISCOUNT_TYPE_MAP,
} from '../../_constants/promotion.constants'
import { usePromotions } from '../../_context/promotions-provider'

const formatVND = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)

type PromotionsExpandedPanelProps = {
  promotion: Promotion
  isExpanded: boolean
  isLastRow?: boolean
}

export function PromotionsExpandedPanel({
  promotion,
  isExpanded,
  isLastRow,
}: PromotionsExpandedPanelProps) {
  const { setOpen, setCurrentRow } = usePromotions()
  const role = getCachedUser()?.role
  const canEdit = canUpdatePromotion(role)
  const canDelete = canDeletePromotion(role)

  const [logs, setLogs] = useState<PromotionLog[] | null>(null)
  const logsLoading = isExpanded && logs === null

  useEffect(() => {
    if (!isExpanded || logs !== null) return
    promotionApi
      .getLogs(promotion.id, { limit: 50 })
      .then((res) => res.data)
      .catch(() => [] as PromotionLog[])
      .then((data) => setLogs(data))
  }, [isExpanded, logs, promotion.id])

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
            Lịch sử sử dụng
            <Badge variant="secondary" className="ml-1.5 text-xs">
              {promotion.usedCount}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3 text-sm">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Loại giảm giá</span>
              <span className="font-medium">{DISCOUNT_TYPE_MAP[promotion.discountType]}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Giá trị giảm</span>
              <span className="font-medium tabular-nums">
                {promotion.discountType === 'PERCENT'
                  ? `${promotion.discountValue}%`
                  : formatVND(promotion.discountValue)}
              </span>
            </div>
            {promotion.maxDiscountAmount != null && (
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">Mức giảm tối đa</span>
                <span className="font-medium tabular-nums">
                  {formatVND(promotion.maxDiscountAmount)}
                </span>
              </div>
            )}
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Giá trị đơn tối thiểu</span>
              <span className="tabular-nums">{formatVND(promotion.minOrderValue)}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Phạm vi áp dụng</span>
              <span>{APPLICABLE_RULE_LABEL[promotion.applicableRule.type]}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Cộng dồn</span>
              <span>{promotion.stackable ? 'Có' : 'Không'}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Thời gian áp dụng</span>
              <span>
                {formatDateTime(promotion.startDate)} - {formatDateTime(promotion.endDate)}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Giới hạn lượt dùng</span>
              <span className="tabular-nums">
                {promotion.usageLimit != null ? promotion.usageLimit : 'Không giới hạn'}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Giới hạn / khách hàng</span>
              <span className="tabular-nums">
                {promotion.usageLimitPerCustomer != null
                  ? promotion.usageLimitPerCustomer
                  : 'Không giới hạn'}
              </span>
            </div>
            {promotion.description && (
              <div className="flex flex-col gap-0.5 col-span-2 md:col-span-4">
                <span className="text-xs text-muted-foreground">Mô tả</span>
                <span className="text-muted-foreground">{promotion.description}</span>
              </div>
            )}
          </div>
          {(canEdit || canDelete) && (
            <>
              <Separator className="mt-4" />
              <div className="flex items-center justify-between mt-3">
                {canDelete ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation()
                      setCurrentRow(promotion)
                      setOpen('delete')
                    }}
                  >
                    <Trash2 className="mr-2 size-4" />
                    Tắt
                  </Button>
                ) : (
                  <span />
                )}
                {canEdit && (
                  <Button
                    size="sm"
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation()
                      setCurrentRow(promotion)
                      setOpen('edit')
                    }}
                  >
                    <Pencil className="mr-2 size-4" />
                    Chỉnh sửa
                  </Button>
                )}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="history">
          {logsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : (logs ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Chưa có lượt sử dụng nào
            </p>
          ) : (
            <div className="rounded-md border [&_[data-slot=table-container]]:max-h-[300px] [&_[data-slot=table-container]]:overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow className="bg-muted">
                    <TableHead className="text-xs">Mã hóa đơn</TableHead>
                    <TableHead className="text-xs">Thời gian</TableHead>
                    <TableHead className="text-xs text-right">Số tiền giảm</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(logs ?? []).map((log) => (
                    <TableRow key={log.id} className="text-sm">
                      <TableCell className="font-mono text-xs">{log.paymentReference ?? '-'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDateTime(log.createdAt)}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums text-xs">
                        {formatVND(log.discountAmount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
