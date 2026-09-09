import client from "./client";

/**
 * Assign free trial subscription to the registered tenant owner
 */
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

/**
 * List all active subscription plans (public endpoint)
 */
export async function listPlans(): Promise<Plan[]> {
  const response = await client.get("/plans");
  return response.data.data;
}

/**
 * List every plan including inactive ones (ADMIN management table)
 */
export async function listAllPlans(): Promise<Plan[]> {
  const response = await client.get("/admin/plans");
  return response.data.data;
}

/** Fields a ADMIN may edit on a plan. */
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

/**
 * Update a plan's editable fields (ADMIN). planCode/billingCycle are immutable.
 */
export async function updatePlan(
  id: string,
  payload: UpdatePlanPayload,
): Promise<Plan> {
  const response = await client.put(`/admin/plans/${id}`, payload);
  return response.data.data;
}

/**
 * Enable/disable a plan (ADMIN). Inactive plans drop off the public list.
 */
export async function setPlanActive(
  id: string,
  isActive: boolean,
): Promise<Plan> {
  const response = await client.patch(`/admin/plans/${id}/active`, { isActive });
  return response.data.data;
}

/**
 * The fixed pricing tiers. Plans are grouped by base code; each tier can have a
 * monthly plan (planCode === tier) and an optional yearly variant (`${tier}_YEARLY`).
 */
export const PLAN_TIER_ORDER = ["TRIAL", "PLUS", "PRO"] as const;
export type PlanTier = (typeof PLAN_TIER_ORDER)[number];

export interface PlanTierGroup {
  tier: PlanTier;
  monthly?: Plan;
  yearly?: Plan;
}

/** Strip the _YEARLY suffix to get a plan's base tier code. */
export const basePlanTier = (planCode: string): string =>
  planCode.replace(/_YEARLY$/, "");

/**
 * Groups a flat plan list into the fixed TRIAL/PLUS/PRO tiers, pairing each
 * tier's monthly and yearly variants. Shared by the landing and billing pages.
 * Tiers with no matching plan are omitted.
 */
export function groupPlansByTier(plans: Plan[]): PlanTierGroup[] {
  return PLAN_TIER_ORDER.map((tier) => ({
    tier,
    monthly: plans.find((p) => p.planCode === tier),
    yearly: plans.find((p) => p.planCode === `${tier}_YEARLY`),
  })).filter((g) => g.monthly || g.yearly);
}

/** The tenant's live subscription, as `GET /subscription/current` returns it. */
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
  /** Quotas frozen onto the subscription when the plan was bought - `-1` means unlimited. */
  currentQuotaSnapshot: {
    maxBranches: number | null;
    maxWarehouses: number | null;
    maxUsers: number | null;
    maxProducts: number | null;
  };
}

/**
 * The plan this shop is on right now.
 *
 * **Not on `/auth/me`.** The old Express backend joined the subscription into the profile
 * and the billing screen read `user.subscription`; the NestJS rewrite's `AuthService.me`
 * returns the user row and its role and nothing else, so that field was `undefined` on
 * every request and the "Gói hiện tại" card could never draw the real plan - nor change
 * after a payment, since re-fetching the profile brought back the same blank.
 *
 * Answers `null` when the tenant has no subscription row at all.
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

/**
 * Renew the tenant's current plan (no planCode needed - backend uses the active plan)
 */
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
