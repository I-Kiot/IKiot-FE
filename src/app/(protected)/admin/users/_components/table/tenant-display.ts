import { basePlanTier } from "@/lib/api/subscription"
import type { Tenant } from "@/lib/api/tenant"

/** Họ tên chủ shop như màn nhân viên ("Họ Tên"); chưa có thì rỗng. */
export function ownerName(tenant: Tenant): string {
  const profile = tenant.tenantOwner?.profile
  return [profile?.lastName, profile?.firstName].filter(Boolean).join(" ").trim()
}

/** Mã gói hiện tại của shop (vd. `PLUS_YEARLY`), undefined khi shop chưa có gói. */
export const tenantPlanCode = (tenant: Tenant): string | undefined => tenant.subscription?.plan?.planCode

/** Hạng gói (TRIAL / PLUS / PRO) để lọc: gói năm tính vào cùng hạng với gói tháng. */
export const tenantPlanTier = (tenant: Tenant): string | undefined => {
  const code = tenantPlanCode(tenant)
  return code ? basePlanTier(code) : undefined
}
