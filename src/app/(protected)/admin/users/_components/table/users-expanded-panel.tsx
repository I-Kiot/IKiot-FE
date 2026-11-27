"use client"

import * as React from "react"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Users,
  Store,
  CreditCard,
  Mail,
  Phone,
  Calendar,
} from "lucide-react"
import { type Tenant } from "@/lib/api/tenant"
import { listAllPlans, PLAN_TIER_ORDER, basePlanTier, type Plan } from "@/lib/api/subscription"
import client from "@/lib/api/client"
import { toast } from "sonner"
import { ownerName, tenantPlanCode } from "./tenant-display"

/** Danh sách gói dùng chung cho mọi panel: tải một lần khi admin bấm "Chỉnh sửa" lần đầu. */
let plansRequest: Promise<Plan[]> | null = null
function loadPlans(): Promise<Plan[]> {
  plansRequest ??= listAllPlans().catch((err) => {
    plansRequest = null
    throw err
  })
  return plansRequest
}

/** Thứ tự TRIAL → PLUS → PRO, trong mỗi hạng gói tháng trước gói năm. */
function sortPlans(plans: Plan[]): Plan[] {
  const rank = (plan: Plan) => {
    const tier = (PLAN_TIER_ORDER as readonly string[]).indexOf(basePlanTier(plan.planCode))
    return (tier === -1 ? PLAN_TIER_ORDER.length : tier) * 2 + (plan.billingCycle === "YEARLY" ? 1 : 0)
  }
  return [...plans].sort((a, b) => rank(a) - rank(b) || a.planCode.localeCompare(b.planCode))
}

const CYCLE_LABEL: Record<Plan["billingCycle"], string> = { MONTHLY: "tháng", YEARLY: "năm", NONE: "" }

interface UsersExpandedPanelProps {
  tenant: Tenant
  onRefresh: () => void
  getStatusBadge: (status: string) => React.ReactNode
  getPlanBadge: (plan?: string) => React.ReactNode
}

export function UsersExpandedPanel({
  tenant,
  onRefresh,
  getStatusBadge,
  getPlanBadge,
}: UsersExpandedPanelProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editStatus, setEditStatus] = useState(tenant.status)
  const currentPlan = tenantPlanCode(tenant) ?? ""
  const [editPlan, setEditPlan] = useState(currentPlan)
  const [isSaving, setIsSaving] = useState(false)
  const [plans, setPlans] = useState<Plan[] | null>(null)

  React.useEffect(() => {
    setEditStatus(tenant.status)
    setEditPlan(tenantPlanCode(tenant) ?? "")
  }, [tenant])

  // Gói lấy từ bảng gói (gồm cả gói năm), không viết cứng.
  React.useEffect(() => {
    if (!isEditing || plans) return
    let cancelled = false
    loadPlans()
      .then((list) => {
        if (!cancelled) setPlans(sortPlans(list))
      })
      .catch(() => toast.error("Không tải được danh sách gói dịch vụ"))
    return () => {
      cancelled = true
    }
  }, [isEditing, plans])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      if (editStatus !== tenant.status) {
        await client.patch(`/tenants/${tenant.id}`, { status: editStatus })
      }

      if (editPlan && editPlan !== currentPlan) {
        await client.post(`/subscription/upgrade/${tenant.id}`, { planCode: editPlan })
      }

      toast.success("Cập nhật thông tin thành công!")
      setIsEditing(false)
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.message || "Lỗi khi cập nhật thông tin!")
    } finally {
      setIsSaving(false)
      // Tải lại cả khi lỗi: bước đổi trạng thái có thể đã lưu trước khi bước đổi gói lỗi.
      onRefresh()
    }
  }

  const ownerLabel = ownerName(tenant) || "Chưa thiết lập"
  const owner = tenant.tenantOwner
  const subscription = tenant.subscription

  return (
    <div className="bg-muted/10 p-6 border-t animate-in fade-in-0 duration-200">
      <Tabs defaultValue="owner" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4 bg-muted">
          <TabsTrigger value="owner" className="cursor-pointer">Chủ cửa hàng</TabsTrigger>
          <TabsTrigger value="store" className="cursor-pointer">Cửa hàng</TabsTrigger>
          <TabsTrigger value="transactions" className="cursor-pointer">Lịch sử giao dịch ({tenant.invoices?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="owner" className="focus-visible:outline-none">
          <div className="w-full space-y-4 pt-2">
            <div className="flex items-center justify-between pb-2 border-b">
              <div className="flex items-center gap-2">
                <Users className="h-4.5 w-4.5 text-primary shrink-0" />
                <h4 className="text-sm font-bold text-foreground">Thông tin chủ cửa hàng</h4>
              </div>
              {!isEditing ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="h-8 text-xs cursor-pointer"
                >
                  Chỉnh sửa
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsEditing(false)
                      setEditStatus(tenant.status)
                      setEditPlan(currentPlan)
                    }}
                    disabled={isSaving}
                    className="h-8 text-xs cursor-pointer"
                  >
                    Hủy
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="h-8 text-xs cursor-pointer"
                  >
                    {isSaving ? "Đang lưu..." : "Lưu"}
                  </Button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3.5 text-xs">
              <div className="flex justify-between border-b pb-2 items-center">
                <span className="text-muted-foreground">Họ tên:</span>
                <span className="font-semibold text-foreground">{ownerLabel}</span>
              </div>
              <div className="flex justify-between border-b pb-2 items-center">
                <span className="text-muted-foreground">Số điện thoại:</span>
                <span className="font-semibold text-foreground flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> {owner?.phoneNumber || "N/A"}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2 items-center">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-semibold text-foreground flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> {owner?.email || "N/A"}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2 items-center">
                <span className="text-muted-foreground">Ngày tham gia:</span>
                <span className="font-semibold text-foreground flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> {owner?.createdAt ? new Date(owner.createdAt).toLocaleDateString("vi-VN") : "N/A"}
                </span>
              </div>

              <div className="flex justify-between border-b pb-2 items-center">
                <span className="text-muted-foreground">Gói dịch vụ:</span>
                {isEditing ? (
                  <div className="w-[220px]">
                    {/* Đổi gói sửa bản ghi subscription hiện có: shop chưa từng nhận gói thì không đổi được. */}
                    <Select value={editPlan} onValueChange={setEditPlan} disabled={!subscription || !plans}>
                      <SelectTrigger className="h-8 text-xs cursor-pointer">
                        <SelectValue placeholder={!subscription ? "Shop chưa có gói" : plans ? "Chọn gói dịch vụ" : "Đang tải gói..."} />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Gói đã tắt chỉ hiện khi đang là gói của shop; BE không cho chuyển sang gói đã tắt. */}
                        {(plans ?? [])
                          .filter((plan) => plan.isActive || plan.planCode === currentPlan)
                          .map((plan) => (
                            <SelectItem key={plan.id} value={plan.planCode} disabled={!plan.isActive} className="cursor-pointer text-xs">
                              {plan.planName}
                              {CYCLE_LABEL[plan.billingCycle] ? ` / ${CYCLE_LABEL[plan.billingCycle]}` : ""}
                              {!plan.isActive ? " (đã tắt)" : ""}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <span>{getPlanBadge(currentPlan || undefined)}</span>
                )}
              </div>

              <div className="flex justify-between border-b pb-2 items-center">
                <span className="text-muted-foreground">Thời gian hết hạn:</span>
                <span className="font-semibold text-foreground">
                  {subscription?.endDate ? new Date(subscription.endDate).toLocaleDateString("vi-VN") : "-"}
                </span>
              </div>

              <div className="flex justify-between border-b pb-2 items-center md:col-span-2">
                <span className="text-muted-foreground">Trạng thái tài khoản:</span>
                {isEditing ? (
                  <div className="w-[180px]">
                    <Select value={editStatus} onValueChange={(val) => setEditStatus(val as "ACTIVE" | "INACTIVE" | "SUSPENDED")}>
                      <SelectTrigger className="h-8 text-xs cursor-pointer">
                        <SelectValue placeholder="Chọn trạng thái" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Hoạt động (ACTIVE)</SelectItem>
                        <SelectItem value="INACTIVE">Chưa kích hoạt (INACTIVE)</SelectItem>
                        <SelectItem value="SUSPENDED">Bị tạm khóa (SUSPENDED)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <span>{getStatusBadge(tenant.status)}</span>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="store" className="focus-visible:outline-none">
          <div className="w-full space-y-4 pt-2">
            <div className="flex items-center gap-2 pb-2 border-b">
              <Store className="h-4.5 w-4.5 text-primary shrink-0" />
              <h4 className="text-sm font-bold text-foreground">Thông tin cửa hàng (Tenant)</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3.5 text-xs">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Tên cửa hàng:</span>
                <span className="font-semibold text-foreground">{tenant.name || "N/A"}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Mã cửa hàng (Domain ID):</span>
                <span className="font-semibold text-foreground">{tenant.id}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Số điện thoại liên hệ:</span>
                <span className="font-semibold text-foreground">{tenant.phoneNumber || "N/A"}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Mã số thuế:</span>
                <span className="font-semibold text-foreground">{tenant.taxNumber || "N/A"}</span>
              </div>
              <div className="flex justify-between border-b pb-2 md:col-span-2">
                <span className="text-muted-foreground">Địa chỉ hoạt động:</span>
                <span className="font-semibold text-foreground text-right" title={tenant.mainAddress}>{tenant.mainAddress || "N/A"}</span>
              </div>
              <div className="flex flex-col gap-1.5 pt-1 md:col-span-2">
                <span className="text-muted-foreground font-semibold">Tài khoản ngân hàng thanh toán QR:</span>
                {tenant.banking?.bankName ? (
                  <div className="bg-muted/40 p-3 rounded-lg border text-2xs space-y-1.5 mt-1 max-w-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ngân hàng:</span>
                      <span className="font-bold text-foreground">{tenant.banking.bankName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Số tài khoản:</span>
                      <span className="font-bold text-foreground">{tenant.banking.accountNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Chủ tài khoản:</span>
                      <span className="font-bold text-foreground">{tenant.banking.accountName}</span>
                    </div>
                  </div>
                ) : (
                  <span className="text-muted-foreground italic text-2xs">Chưa cấu hình</span>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="focus-visible:outline-none">
          <div className="space-y-4 w-full">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-muted-foreground tracking-wider uppercase flex items-center gap-1.5">
                <CreditCard className="h-4 w-4 shrink-0" /> Lịch sử đăng ký và thanh toán
              </h4>
              <div className="text-xs text-muted-foreground">
                Tổng tiền thanh toán:{" "}
                <span className="font-bold text-primary">
                  {(tenant.invoices || [])
                    .filter(t => t.status === "PAID")
                    .reduce((sum, t) => sum + t.amount, 0)
                    .toLocaleString()}đ
                </span>
              </div>
            </div>
            <div className="rounded-xl border bg-card overflow-hidden shadow-xs">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="text-xs">
                    <TableHead className="h-8 font-semibold">Mã hóa đơn</TableHead>
                    <TableHead className="h-8 font-semibold">Gói cước</TableHead>
                    <TableHead className="h-8 font-semibold">Chu kỳ</TableHead>
                    <TableHead className="h-8 font-semibold">Số tiền</TableHead>
                    <TableHead className="h-8 font-semibold">Tham chiếu SePay</TableHead>
                    <TableHead className="h-8 font-semibold">Ngày thanh toán</TableHead>
                    <TableHead className="h-8 font-semibold">Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!tenant.invoices || tenant.invoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6 text-xs text-muted-foreground">
                        Chưa phát sinh giao dịch nào.
                      </TableCell>
                    </TableRow>
                  ) : (
                    tenant.invoices.map((txn) => (
                      <TableRow key={txn.id} className="text-xs hover:bg-muted/30">
                        <TableCell className="font-semibold text-2xs">{txn.id}</TableCell>
                        <TableCell>{getPlanBadge(txn.plan?.planCode)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {txn.billingPeriodStart ? `${new Date(txn.billingPeriodStart).toLocaleDateString("vi-VN")} - ${new Date(txn.billingPeriodEnd).toLocaleDateString("vi-VN")}` : "N/A"}
                        </TableCell>
                        <TableCell className="font-semibold text-primary">{txn.amount.toLocaleString()}đ</TableCell>
                        <TableCell className="font-mono text-2xs text-muted-foreground">{txn.paymentReference || "-"}</TableCell>
                        <TableCell className="text-muted-foreground">{txn.paidAt ? new Date(txn.paidAt).toLocaleDateString("vi-VN") : "-"}</TableCell>
                        <TableCell>
                          {txn.status === "PAID" && <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-[10px] px-1.5 py-0" variant="outline">Thành công</Badge>}
                          {txn.status === "PENDING" && <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 text-[10px] px-1.5 py-0" variant="outline">Chờ duyệt</Badge>}
                          {txn.status === "FAILED" && <Badge className="bg-red-500/10 text-red-500 border-red-500/20 text-[10px] px-1.5 py-0" variant="outline">Thất bại</Badge>}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
