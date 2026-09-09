// [API – Stats]
import client from '@/lib/api/client';

export interface StatsDateRangeParams {
  fromDate?: string;
  toDate?: string;
  branchId?: string;
  warehouseId?: string;
}

export interface StatsOverview {
  revenue: number;
  orderCount: number;
  customerCount: number;
  aov: number;
  changePct: {
    revenue: number | null;
    orderCount: number | null;
    customerCount: number | null;
    aov: number | null;
  };
  period: { fromDate: string; toDate: string };
  previousPeriod: { fromDate: string; toDate: string };
}

export interface RevenueSeriesPoint {
  bucket: string;
  revenue: number;
  orderCount: number;
}

export interface RevenueSeries {
  groupBy: 'day' | 'month';
  series: RevenueSeriesPoint[];
}

export interface RevenueByPaymentMethodItem {
  paymentMethod: string;
  revenue: number;
  orderCount: number;
}

export interface RevenueByPaymentMethod {
  breakdown: RevenueByPaymentMethodItem[];
}

export interface RevenueByStaffItem {
  userId: string;
  staffName: string | null;
  revenue: number;
  orderCount: number;
  aov: number;
}

export interface RevenueByStaff {
  staff: RevenueByStaffItem[];
}

export interface CashflowByType {
  flowType: 'INCOME' | 'EXPENSE';
  total: number;
  count: number;
}

export interface Cashflow {
  income: number;
  expense: number;
  net: number;
  byType: CashflowByType[];
}

export interface CashflowTransaction {
  id: string;
  flowType: 'INCOME' | 'EXPENSE';
  amount: number;
  paymentMethod: string | null;
  description: string | null;
  paymentReference: string | null;
  branchName: string | null;
  warehouseName: string | null;
  locationName: string | null;
  locationType: 'branch' | 'warehouse' | null;
  supplierName: string | null;
  createdByName: string | null;
  orderId: string | null;
  createdAt: string;
}

export interface CashflowList {
  data: CashflowTransaction[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

export interface TopProductItem {
  productItemId: string;
  productName: string;
  quantity: number;
  revenue: number;
}

export interface TopProducts {
  sortBy: 'quantity' | 'revenue';
  products: TopProductItem[];
}

export interface LowStockItem {
  productItemId: string;
  productName: string;
  sku: string;
  locationId: string;
  locationType: string;
  stock: number;
}

export interface InventoryStats {
  stockValue: number;
  totalUnits: number;
  skuCount: number;
  outOfStock: number;
  lowStockThreshold: number;
  lowStock: LowStockItem[];
}

// ── Platform-operator overview (ADMIN) ──────────────────────────────────
export interface AdminRevenuePoint {
  bucket: string;
  revenue: number;
  count: number;
}

export interface AdminPlanDistItem {
  planId: string;
  planCode?: string;
  planName?: string;
  count: number;
}

export interface AdminTopTenant {
  tenantId: string;
  name?: string;
  revenue: number;
  invoiceCount: number;
}

export interface AdminRecentInvoice {
  id: string;
  amount: number;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  paymentReference?: string;
  createdAt: string;
  paidAt?: string;
  planId?: { planName?: string; planCode?: string };
  tenantId?: { name?: string };
}

export interface AdminOverview {
  period: { fromDate: string; toDate: string };
  tenants: {
    total: number;
    active: number;
    inactive: number;
    suspended: number;
    newInPeriod: number;
    changePct: number | null;
  };
  subscriptions: {
    byStatus: { TRIAL: number; ACTIVE: number; PAST_DUE: number; EXPIRED: number; CANCELLED: number };
    planDistribution: AdminPlanDistItem[];
    conversionRate: number | null;
  };
  revenue: {
    total: number;
    inPeriod: number;
    invoiceCountInPeriod: number;
    changePct: number | null;
    groupBy: 'day' | 'month';
    series: AdminRevenuePoint[];
  };
  tenantGrowth: { bucket: string; count: number }[];
  tickets: { open: number; resolved: number; total: number };
  sepay: { linked: number; total: number };
  topTenants: AdminTopTenant[];
  recentInvoices: AdminRecentInvoice[];
}

async function getStats<T, P extends object = object>(path: string, params?: P): Promise<T> {
  const res = await client.get<{ success: boolean; data: T }>(path, { params });
  return res.data.data;
}

export const statsApi = {
  getOverview: (params?: StatsDateRangeParams) =>
    getStats<StatsOverview>('/stats/overview', params),

  getRevenue: (params?: StatsDateRangeParams & { groupBy?: 'day' | 'month' }) =>
    getStats<RevenueSeries>('/stats/revenue', params),

  getRevenueByPaymentMethod: (params?: StatsDateRangeParams) =>
    getStats<RevenueByPaymentMethod>('/stats/revenue-by-payment-method', params),

  getRevenueByStaff: (params?: StatsDateRangeParams) =>
    getStats<RevenueByStaff>('/stats/revenue-by-staff', params),

  getCashflow: (params?: StatsDateRangeParams & { flow?: 'ORD' | 'SUP' | 'PAYR'; flowType?: 'INCOME' | 'EXPENSE' }) =>
    getStats<Cashflow>('/stats/cashflow', params),

  getCashflowList: (
    params?: StatsDateRangeParams & {
      flow?: 'ORD' | 'SUP' | 'PAYR';
      flowType?: 'INCOME' | 'EXPENSE';
      paymentMethod?: string;
      page?: number;
      limit?: number;
    },
  ) => getStats<CashflowList>('/stats/cashflow/transactions', params),

  getTopProducts: (params?: StatsDateRangeParams & { sortBy?: 'quantity' | 'revenue'; limit?: number }) =>
    getStats<TopProducts>('/stats/top-products', params),

  getInventory: (params?: { branchId?: string; warehouseId?: string; lowStockThreshold?: number }) =>
    getStats<InventoryStats>('/stats/inventory', params),

  getAdminOverview: (params?: { fromDate?: string; toDate?: string; groupBy?: 'day' | 'month' }) =>
    getStats<AdminOverview>('/stats/admin/overview', params),
};
