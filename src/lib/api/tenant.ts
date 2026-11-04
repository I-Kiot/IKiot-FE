import client from "./client";

export interface TenantOwnerProfile {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  dob?: string;
  taxNumber?: string;
  identificationId?: string;
  address?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
}

export interface TenantOwner {
  id: string;
  email: string;
  phoneNumber: string;
  role: string;
  status: string;
  profile?: TenantOwnerProfile;
  createdAt: string;
}

export interface Plan {
  id: string;
  planName: string;
  planCode: string;
  price: number;
}

export interface Subscription {
  id: string;
  status: "TRIAL" | "ACTIVE" | "EXPIRED" | "PAST_DUE" | "CANCELLED";
  startDate: string;
  endDate: string;
  planId?: Plan;
}

export interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  billingPeriodStart: string;
  billingPeriodEnd: string;
  paidAt?: string;
  paymentReference?: string;
  paymentMethod?: string;
  planId?: Plan;
  createdAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  tenantOwnerId?: TenantOwner;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  phoneNumber?: string;
  mainAddress?: string;
  taxNumber?: string;
  banking?: {
    accountNumber?: string;
    bankName?: string;
    accountName?: string;
  };
  createdAt: string;
  activeSubscription?: Subscription;
  invoices?: Invoice[];
  /** Đã liên kết SePay, qua webhook key hoặc qua đồng bộ. Key không bao giờ được trả ra. */
  hasSepayKey?: boolean;
}

/**
 * Mọi shop trên nền tảng, **chỉ ADMIN** (`GET /tenants`, `AdminOnlyGuard`).
 * Trước đây gọi `GET /tenant/me` (trả một object là shop của chính người gọi) nên bộ chọn tenant ở ba màn admin luôn rỗng. `/tenant/me` là `getMyTenant()` bên dưới.
 */
export async function listTenants(): Promise<Tenant[]> {
  const response = await client.get<{ data: Tenant[] }>("/tenants");
  return response.data.data ?? [];
}

/** Shop của tài khoản đang đăng nhập (`GET /tenant/me`). */
export async function getMyTenant(): Promise<Tenant> {
  const response = await client.get<{ data: Tenant }>("/tenant/me");
  return response.data.data;
}

/** ADMIN: lưu SePay webhook key riêng cho từng shop. */
export async function setSepayKey(
  tenantId: string,
  sepayWebhookApiKey: string,
): Promise<void> {
  await client.put(`/tenant/${tenantId}/sepay-key`, { sepayWebhookApiKey });
}

export interface SepaySyncResult {
  accounts: number;
  linked: string[];
  unlinked: string[];
}

/** ADMIN: đọc lại tài khoản SePay của nền tảng ngay bây giờ. */
export async function syncSepayAccounts(): Promise<SepaySyncResult> {
  const response = await client.post<{ data: SepaySyncResult }>(
    "/tenants/sepay-sync",
  );
  return response.data.data;
}
