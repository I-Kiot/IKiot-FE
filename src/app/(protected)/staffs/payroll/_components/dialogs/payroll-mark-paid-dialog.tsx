'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { usePayroll } from '../../_context/payroll-provider'
import type { PayrollPeriod } from '@/types/payroll'

type PayrollMarkPaidDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: PayrollPeriod | null
}

export function PayrollMarkPaidDialog({ open, onOpenChange, currentRow }: PayrollMarkPaidDialogProps) {
  const { handleMarkPaid } = usePayroll()
  const [paymentReference, setPaymentReference] = useState('')
  const [paymentNote, setPaymentNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function handleOpenChange(val: boolean) {
    if (!val) {
      setPaymentReference('')
      setPaymentNote('')
      setSubmitting(false)
    }
    onOpenChange(val)
  }

  async function handleConfirm() {
    if (!currentRow) return
    setSubmitting(true)
    const success = await handleMarkPaid(currentRow.id, {
      paymentReference: paymentReference || undefined,
      paymentNote: paymentNote || undefined,
    })
    setSubmitting(false)
    if (success) {
      handleOpenChange(false)
    }
  }

  const periodStart = currentRow?.periodStart
    ? new Intl.DateTimeFormat('vi-VN').format(new Date(currentRow.periodStart))
    : '-'
  const periodEnd = currentRow?.periodEnd
    ? new Intl.DateTimeFormat('vi-VN').format(new Date(currentRow.periodEnd))
    : '-'

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Xác nhận thanh toán lương</DialogTitle>
          <DialogDescription>
            Đánh dấu kỳ lương từ ngày <strong>{periodStart}</strong> đến{' '}
            <strong>{periodEnd}</strong> là <strong>Đã thanh toán</strong>. Hành động này chỉ nên thực hiện sau khi chuyển khoản thành công.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="payment-ref">Mã tham chiếu thanh toán (Tùy chọn)</Label>
            <Input
              id="payment-ref"
              placeholder="VD: FT26078129837, UNC-7728..."
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-note">Ghi chú thanh toán (Tùy chọn)</Label>
            <Input
              id="payment-note"
              placeholder="VD: Ủy nhiệm chi VCB, Chuyển khoản lương T7..."
              value={paymentNote}
              onChange={(e) => setPaymentNote(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            className="cursor-pointer"
            disabled={submitting}
          >
            Hủy
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            className="cursor-pointer bg-green-600 hover:bg-green-700 text-white"
            disabled={submitting}
          >
            <Check className="mr-2 size-4" />
            Xác nhận đã trả lương
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

