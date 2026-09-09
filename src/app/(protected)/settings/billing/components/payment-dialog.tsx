"use client"

import { useEffect, useRef, useState } from "react"
import { CheckCircle2, Copy, Loader2, TimerOff } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { type InitiateUpgradeResult } from "@/lib/api/subscription"
import { getSocket } from "@/lib/socket"

interface PaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoice: InitiateUpgradeResult | null
  /** Reloads the billing screen. Called once the activation event lands. */
  onActivated: () => void | Promise<void>
}

type PaymentState = "pending" | "paid" | "expired"

export function PaymentDialog({
  open,
  onOpenChange,
  invoice,
  onActivated,
}: PaymentDialogProps) {
  const [paymentState, setPaymentState] = useState<PaymentState>("pending")
  const [secondsLeft, setSecondsLeft] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!open || !invoice) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      setPaymentState("pending")
      return
    }

    const expiry = new Date(invoice.expiredAt).getTime()

    // Countdown timer
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((expiry - Date.now()) / 1000))
      setSecondsLeft(remaining)
      if (remaining === 0) {
        if (intervalRef.current) clearInterval(intervalRef.current)
        setPaymentState("expired")
      }
    }
    tick()
    intervalRef.current = setInterval(tick, 1000)

    // The backend joins this socket to `tenant:<id>` itself, so there is nothing to
    // subscribe to here - only something to listen for.
    const socket = getSocket()

    const handleActivated = async () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      setPaymentState("paid")
      // Was `fetchMe()`, which reloaded a profile that has never carried the subscription -
      // the dialog said "thành công" while the plan card behind it still showed the old
      // plan until the page was reloaded by hand.
      await onActivated()
      toast.success(`Nâng cấp lên gói ${invoice.plan.planName} thành công!`)
    }

    socket.on("subscription:activated", handleActivated)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      socket.off("subscription:activated", handleActivated)
    }
  }, [open, invoice, onActivated])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, "0")}`
  }

  const copyRef = () => {
    if (!invoice) return
    navigator.clipboard.writeText(invoice.paymentReference)
    toast.success("Đã sao chép mã chuyển khoản")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Thanh toán nâng cấp gói</DialogTitle>
          <DialogDescription>
            Quét mã QR hoặc chuyển khoản theo thông tin bên dưới. Hệ thống sẽ tự động kích hoạt sau khi nhận được thanh toán.
          </DialogDescription>
        </DialogHeader>

        {paymentState === "paid" && (
          <div className="flex flex-col items-center gap-3 py-6">
            <CheckCircle2 className="size-16 text-green-500" />
            <p className="text-lg font-semibold">Thanh toán thành công!</p>
            <p className="text-sm text-muted-foreground text-center">
              Gói {invoice?.plan.planName} đã được kích hoạt cho tài khoản của bạn.
            </p>
            <Button onClick={() => onOpenChange(false)}>Đóng</Button>
          </div>
        )}

        {paymentState === "expired" && (
          <div className="flex flex-col items-center gap-3 py-6">
            <TimerOff className="size-16 text-destructive" />
            <p className="text-lg font-semibold">Mã QR đã hết hạn</p>
            <p className="text-sm text-muted-foreground text-center">
              Vui lòng đóng và thử lại để tạo mã QR mới.
            </p>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Đóng</Button>
          </div>
        )}

        {paymentState === "pending" && invoice && (
          <div className="space-y-4">
            {/* QR Code */}
            <div className="flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={invoice.qrDataUrl}
                alt="QR thanh toán VietQR"
                className="w-56 h-56 rounded-lg border object-contain"
              />
            </div>

            <Separator />

            {/* Payment info */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gói nâng cấp</span>
                <span className="font-medium">{invoice.plan.planName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Số tiền</span>
                <span className="font-semibold">{invoice.amount.toLocaleString("vi-VN")}đ</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Nội dung CK</span>
                <div className="flex items-center gap-1.5">
                  <code className="font-mono font-semibold tracking-wider">
                    {invoice.paymentReference}
                  </code>
                  <button onClick={copyRef} className="text-muted-foreground hover:text-foreground transition-colors">
                    <Copy className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <Separator />

            {/* Countdown + waiting indicator */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" />
                <span>Đang chờ thanh toán...</span>
              </div>
              <Badge variant={secondsLeft < 60 ? "destructive" : "secondary"}>
                {formatTime(secondsLeft)}
              </Badge>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
