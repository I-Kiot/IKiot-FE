import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Crown, AlertTriangle, Clock, Loader2 } from "lucide-react"
import type { CurrentSubscription } from "@/lib/api/subscription"

const STATUS_LABEL: Record<string, string> = {
  TRIAL: "Dùng thử",
  ACTIVE: "Đang hoạt động",
  EXPIRED: "Đã hết hạn",
  PAST_DUE: "Quá hạn thanh toán",
  CANCELLED: "Đã huỷ",
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  TRIAL: "secondary",
  ACTIVE: "default",
  EXPIRED: "destructive",
  PAST_DUE: "destructive",
  CANCELLED: "outline",
}

function getDaysLeft(dateStr: string | null | undefined): number {
  if (!dateStr) return 0
  return Math.max(0, Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000))
}

function getProgress(startDate: string, endDate: string): number {
  const start = new Date(startDate).getTime()
  const end = new Date(endDate).getTime()
  const now = Date.now()
  if (now >= end) return 100
  if (now <= start) return 0
  return Math.round(((now - start) / (end - start)) * 100)
}

interface CurrentPlanCardProps {
  subscription: CurrentSubscription | null
  isLoading: boolean
}

export function CurrentPlanCard({ subscription, isLoading }: CurrentPlanCardProps) {
  // "Chưa có gói" and "chưa tải xong" look identical once rendered, and telling a paying
  // shop it has no plan while the request is still in flight is the worse of the two.
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gói hiện tại</CardTitle>
          <CardDescription>Thông tin gói đăng ký của bạn.</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gói hiện tại</CardTitle>
          <CardDescription>Bạn chưa có gói đăng ký nào.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Liên hệ hỗ trợ để được kích hoạt gói dùng thử.</p>
        </CardContent>
      </Card>
    )
  }

  const isTrial = subscription.status === "TRIAL"
  const isExpired = subscription.status === "EXPIRED" || subscription.status === "PAST_DUE"
  const activeEndDate = isTrial ? subscription.trialEndDate : subscription.endDate
  const daysLeft = getDaysLeft(activeEndDate)
  const progress = subscription.startDate && activeEndDate
    ? getProgress(subscription.startDate, activeEndDate)
    : 0
  const needsAttention = isExpired || daysLeft <= 3

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gói hiện tại</CardTitle>
        <CardDescription>Thông tin gói đăng ký của bạn.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-yellow-500" />
          <span className="font-semibold">{subscription.planName}</span>
          <Badge variant={STATUS_VARIANT[subscription.status] ?? "secondary"}>
            {STATUS_LABEL[subscription.status] ?? subscription.status}
          </Badge>
        </div>

        {needsAttention && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="font-medium text-destructive">
                    {isExpired ? "Gói đã hết hạn" : "Sắp hết hạn"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isExpired
                      ? "Vui lòng nâng cấp gói để tiếp tục sử dụng đầy đủ tính năng."
                      : `Gói của bạn sẽ hết hạn sau ${daysLeft} ngày.`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!isExpired && activeEndDate && (
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Clock className="size-3.5" />
                {isTrial ? "Thời gian dùng thử" : "Chu kỳ thanh toán"}
              </span>
              <span className="text-muted-foreground">còn {daysLeft} ngày</span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Hết hạn vào {new Date(activeEndDate).toLocaleDateString("vi-VN")}
            </p>
          </div>
        )}

        {subscription.currentQuotaSnapshot && (
          <div className="grid grid-cols-3 gap-3 pt-1">
            {[
              { label: "Chi nhánh", value: subscription.currentQuotaSnapshot.maxBranches },
              { label: "Sản phẩm", value: subscription.currentQuotaSnapshot.maxProducts },
              { label: "Nhân viên", value: subscription.currentQuotaSnapshot.maxUsers },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg border bg-muted/40 px-3 py-2 text-center">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-semibold">
                  {value == null ? "—" : value === -1 ? "∞" : value}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
