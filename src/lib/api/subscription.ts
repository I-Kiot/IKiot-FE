import client from "./client";

/** Gán gói dùng thử miễn phí cho chủ shop vừa đăng ký. */
export async function assignFreeTrial() {
  const response = await client.post("/subscription/free-trial", {});
  return response.data;
}

export interface Plan {
  id: string;
  planName: string;
  planCode: string;
  price: number;
  billingCycle: "MONTHLY" | "YEARLY" | "NONE";
  maxBranches: number;
  maxUsers: number;
  maxProducts: number;
  trialDays: number;
  features: string[];
  description?: string;
  displayFeatures?: string[];
  isPopular?: boolean;
  isActive: boolean;
}

/** Liệt kê mọi gói đang hoạt động (endpoint công khai). */
export async function listPlans(): Promise<Plan[]> {
  const response = await client.get("/plans");
  return response.data.data;
}

/** Liệt kê mọi gói kể cả gói đã tắt (bảng quản trị ADMIN). */
export async function listAllPlans(): Promise<Plan[]> {
  const response = await client.get("/admin/plans");
  return response.data.data;
}

/** Các trường ADMIN được sửa trên gói. */
export type UpdatePlanPayload = Partial<
  Pick<
    Plan,
    | "planName"
    | "description"
    | "displayFeatures"
    | "price"
    | "maxBranches"
    | "maxUsers"
    | "maxProducts"
    | "trialDays"
    | "features"
    | "isPopular"
    | "isActive"
  >
>;

/** Sửa các trường của gói (ADMIN). planCode và billingCycle không đổi được. */
export async function updatePlan(
  id: string,
  payload: UpdatePlanPayload,
): Promise<Plan> {
  const response = await client.put(`/admin/plans/${id}`, payload);
  return response.data.data;
}

/** Bật/tắt gói (ADMIN). Gói tắt sẽ không còn ở danh sách công khai. */
export async function setPlanActive(
  id: string,
  isActive: boolean,
): Promise<Plan> {
  const response = await client.patch(`/admin/plans/${id}/active`, { isActive });
  return response.data.data;
}

/**
 * Ba hạng giá cố định. Mỗi hạng có gói tháng (planCode = hạng) và gói năm tuỳ chọn (`${tier}_YEARLY`).
 */
export const PLAN_TIER_ORDER = ["TRIAL", "PLUS", "PRO"] as const;
export type PlanTier = (typeof PLAN_TIER_ORDER)[number];

export interface PlanTierGroup {
  tier: PlanTier;
  monthly?: Plan;
  yearly?: Plan;
}

/** Bỏ hậu tố _YEARLY để lấy mã hạng gốc của gói. */
export const basePlanTier = (planCode: string): string =>
  planCode.replace(/_YEARLY$/, "");

/**
 * Gom danh sách gói phẳng thành TRIAL/PLUS/PRO, ghép bản tháng và năm. Dùng chung cho trang landing và billing.
 * Hạng không có gói nào thì bỏ qua.
 */
export function groupPlansByTier(plans: Plan[]): PlanTierGroup[] {
  return PLAN_TIER_ORDER.map((tier) => ({
    tier,
    monthly: plans.find((p) => p.planCode === tier),
    yearly: plans.find((p) => p.planCode === `${tier}_YEARLY`),
  })).filter((g) => g.monthly || g.yearly);
}

/** Gói đang dùng của tenant, theo `GET /subscription/current`. */
export interface CurrentSubscription {
  id: string;
  planId: string;
  planName: string;
  planCode: string;
  billingCycle: "MONTHLY" | "YEARLY" | "NONE" | null;
  status: "TRIAL" | "ACTIVE" | "EXPIRED" | "PAST_DUE" | "CANCELLED";
  startDate: string;
  endDate: string;
  trialEndDate: string | null;
  autoRenew: boolean;
  /** Quota đóng băng vào subscription lúc mua gói; `-1` nghĩa là không giới hạn. */
  currentQuotaSnapshot: {
    maxBranches: number | null;
    maxWarehouses: number | null;
    maxUsers: number | null;
    maxProducts: number | null;
  };
}

/**
 * Gói shop đang dùng. **Không lấy từ `/auth/me`**: `AuthService.me` chỉ trả user và role, nên `user.subscription` luôn undefined
 * và thẻ "Gói hiện tại" không bao giờ hiện đúng gói.
 * Trả `null` khi tenant chưa có dòng subscription nào.
 */
export async function getCurrentSubscription(): Promise<CurrentSubscription | null> {
  const response = await client.get("/subscription/current");
  return response.data?.data ?? null;
}

export interface InitiateUpgradeResult {
  invoiceId: string;
  paymentReference: string;
  amount: number;
  plan: { planCode: string; planName: string };
  qrDataUrl: string;
  expiredAt: string;
}

export async function initiateUpgrade(planCode: string): Promise<InitiateUpgradeResult> {
  const response = await client.post("/subscription/upgrade/initiate", { planCode });
  return response.data.data;
}

/** Gia hạn gói hiện tại (không cần planCode, backend dùng gói đang active). */
export async function initiateRenewal(): Promise<InitiateUpgradeResult> {
  const response = await client.post("/subscription/renew/initiate", {});
  return response.data.data;
}

export interface Invoice {
  id: string;
  planId: { planName: string; planCode: string };
  amount: number;
  currency: string;
  status: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  billingPeriodStart: string;
  billingPeriodEnd: string;
  paidAt?: string;
  paymentReference?: string;
  createdAt: string;
}

export async function listInvoices(): Promise<Invoice[]> {
  const response = await client.get("/subscription/invoices");
  return response.data.data;
}

export interface AdminInvoice extends Omit<Invoice, "planId"> {
  planId?: { planName: string; planCode: string };
  tenantId?: { id: string; name: string; phoneNumber?: string };
}

export async function listAllInvoices(): Promise<AdminInvoice[]> {
  const response = await client.get("/subscription/admin/invoices");
  return response.data.data;
}
