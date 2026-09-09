// [Dialog – Thanh toán công nợ nhà cung cấp]
'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Banknote, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import type { Supplier } from '@/types/supplier'
import { useSuppliers } from '../../_context/suppliers-provider'

// --- Schema ---
const payDebtSchema = z.object({
  amount: z
    .number({ message: 'Số tiền phải là số' })
    .positive('Số tiền phải lớn hơn 0')
    .max(1_000_000_000_000, 'Số tiền vượt giới hạn'),
  note: z.string().max(500, 'Ghi chú tối đa 500 ký tự').optional(),
})

type PayDebtFormValues = z.infer<typeof payDebtSchema>

function formatVND(amount: number) {
  return amount.toLocaleString('vi-VN') + ' ₫'
}

type SuppliersPayDebtDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  supplier: Supplier | null
}

export function SuppliersPayDebtDialog({
  open,
  onOpenChange,
  supplier,
}: SuppliersPayDebtDialogProps) {
  const { handlePayDebt } = useSuppliers()

  const form = useForm<PayDebtFormValues>({
    resolver: zodResolver(payDebtSchema),
    defaultValues: {
      amount: undefined as unknown as number,
      note: '',
    },
  })

  // Reset khi đóng/mở dialog
  useEffect(() => {
    if (!open) {
      form.reset({
        amount: undefined as unknown as number,
        note: '',
      })
    }
  }, [open, form])

  const watchedAmount = form.watch('amount')
  const exceedsDebt =
    supplier && watchedAmount > 0 && watchedAmount > supplier.outstandingDebt

  const debtRatio =
    supplier && supplier.creditLimit > 0
      ? (supplier.outstandingDebt / supplier.creditLimit) * 100
      : 0

  async function onSubmit(data: PayDebtFormValues) {
    if (!supplier) return

    const success = await handlePayDebt(supplier.id, {
      amount: data.amount,
      paymentMethod: 'CASH',
      note: data.note || undefined,
    })

    if (success) {
      onOpenChange(false)
    }
  }

  if (!supplier) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="size-5 text-primary" />
            Thanh toán công nợ
          </DialogTitle>
          <DialogDescription>
            Thanh toán công nợ bằng tiền mặt cho nhà cung cấp
          </DialogDescription>
        </DialogHeader>

        {/* Thông tin công nợ */}
        <div className="rounded-lg border bg-muted/40 px-4 py-3 space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Nhà cung cấp</span>
            <span className="font-semibold">{supplier.supplierName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Công nợ hiện tại</span>
            <Badge
              variant={supplier.outstandingDebt > 0 ? 'destructive' : 'secondary'}
              className="tabular-nums font-bold text-sm px-2 py-0.5"
            >
              {formatVND(supplier.outstandingDebt)}
            </Badge>
          </div>
          {supplier.creditLimit > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Tỷ lệ hạn mức</span>
              <span
                className={
                  debtRatio >= 90
                    ? 'text-destructive font-semibold'
                    : debtRatio >= 60
                    ? 'text-orange-500 font-medium'
                    : 'text-muted-foreground'
                }
              >
                {debtRatio.toFixed(1)}% / {formatVND(supplier.creditLimit)}
              </span>
            </div>
          )}
        </div>

        {supplier.outstandingDebt <= 0 ? (
          <p className="text-center text-sm text-muted-foreground py-4">
            Nhà cung cấp này không có công nợ cần thanh toán.
          </p>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Số tiền */}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Số tiền thanh toán <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="VD: 5000000"
                        type="number"
                        min={1}
                        max={supplier.outstandingDebt}
                        {...field}
                        onChange={(e) => {
                          const val = e.target.valueAsNumber
                          field.onChange(isNaN(val) ? undefined : val)
                        }}
                      />
                    </FormControl>
                    {exceedsDebt && (
                      <p className="text-xs text-destructive">
                        Số tiền ({formatVND(watchedAmount)}) vượt quá công nợ ({formatVND(supplier.outstandingDebt)})
                      </p>
                    )}
                    <div className="flex gap-2 pt-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => form.setValue('amount', Math.floor(supplier.outstandingDebt / 2))}
                      >
                        50%
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => form.setValue('amount', supplier.outstandingDebt)}
                      >
                        Toàn bộ
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Phương thức thanh toán - cố định Tiền mặt */}
              <div className="space-y-1.5">
                <FormLabel>Phương thức thanh toán</FormLabel>
                <div className="flex items-center gap-2 px-3 py-2 rounded-md border bg-muted/30 text-sm">
                  <Banknote className="size-4 text-primary" />
                  <span className="font-medium">Tiền mặt</span>
                </div>
              </div>

              {/* Ghi chú */}
              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ghi chú</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ghi chú kèm theo thanh toán (tuỳ chọn)"
                        className="resize-none"
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="cursor-pointer"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  className="cursor-pointer"
                  disabled={!!exceedsDebt || form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? (
                    <><Loader2 className="mr-2 size-4 animate-spin" />Đang xử lý...</>
                  ) : (
                    <><Banknote className="mr-2 size-4" />Xác nhận thanh toán</>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}
