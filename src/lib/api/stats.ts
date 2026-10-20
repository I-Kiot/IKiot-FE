// [API – Stats]
import client from '@/lib/api/client';
import type { LocationType } from '@/types/location';

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
  /** Doanh thu − phí ship − phí sàn − giá vốn. Ước tính: dòng chưa có giá vốn tính là 0. */
  grossProfit: number;
  /** Số dòng hàng chưa có giá vốn - > 0 thì lợi nhuận đang bị thổi lên. */
  linesMissingCost: number;
  changePct: {
    revenue: number | null;
    orderCount: number | null;
    customerCount: number | null;
    aov: number | null;
    grossProfit: number | null;
  };
  period: { fromDate: string; toDate: string };
  previousPeriod: { fromDate: string; toDate: string };
}

export interface RevenueSeriesPoint {
  /** `YYYY-MM-DDTHH` (giờ), `YYYY-MM-DD` (ngày) hoặc `YYYY-MM` (tháng), theo giờ Việt Nam. */
  bucket: string;
  revenue: number;
  orderCount: number;
}

export type RevenueGroupBy = 'hour' | 'day' | 'month';

export interface RevenueSeries {
  groupBy: RevenueGroupBy;
  series: RevenueSeriesPoint[];
}

/** Nhóm tình trạng đơn trên dashboard (`GET /stats/order-pipeline`). */
export type OrderPipelineKey =
  | 'PENDING_CONFIRMATION'
  | 'PROCESSING'
  | 'AWAITING_SHIPMENT'
  | 'SHIPPING'
  | 'DELIVERY_FAILED';

export interface OrderPipelineStage {
  key: OrderPipelineKey;
  /** Các trạng thái đơn nhóm này gom lại. */
  statuses: string[];
  count: number;
}

export interface OrderPipeline {
  stages: OrderPipelineStage[];
}

export type StockAgingLevel = 'NORMAL' | 'WARNING' | 'ATTENTION' | 'STALE';

export interface StockAlertItem {
  inventoryId: string;
  productItemId: string;
  productName: string;
  sku: string | null;
  locationId: string;
  locationName: string;
  locationType: LocationType;
  /** Tồn trên kệ = tồn − đã đóng gói cho đơn. */
  shelf: number;
  minStock: number;
  /** Số ngày chưa bán; null khi kệ trống. */
  daysIdle: number | null;
  agingLevel: StockAgingLevel | null;
}

export interface StockAlerts {
  lowStockThreshold: number;
  counts: {
    outOfStock: number;
    lowStock: number;
    belowMin: number;
    aging: { warning: number; attention: number; stale: number };
  };
  items: {
    outOfStock: StockAlertItem[];
    lowStock: StockAlertItem[];
    belowMin: StockAlertItem[];
    aging: StockAlertItem[];
  };
}

export interface SlowProductItem {
  productItemId: string;
  productName: string;
  sku: string | null;
  shelf: number;
  quantity: number;
  revenue: number;
}

export interface SlowProducts {
  products: SlowProductItem[];
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
  locationType: LocationType | null;
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
  // Exactly one of the two is set, matching `locationType`.
  branchId: string | null;
  warehouseId: string | null;
  locationType: LocationType;
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

export type ComparisonKey = 'today' | 'week' | 'month' | 'quarter' | 'year';

export interface ComparisonWindow {
  fromDate: string;
  toDate: string;
  revenue: number;
  orderCount: number;
  aov: number;
}

export interface RevenueComparisonItem {
  key: ComparisonKey;
  current: ComparisonWindow;
  /** The same elapsed span of the period before, not the whole of it. */
  previous: ComparisonWindow;
  changePct: { revenue: number | null; orderCount: number | null; aov: number | null };
}

export interface RevenueComparison {
  comparisons: RevenueComparisonItem[];
}

export interface OrdersByStatusItem {
  status: string;
  count: number;
  total: number;
}

export interface OrdersByStatus {
  totalCount: number;
  statuses: OrdersByStatusItem[];
}

export interface RevenueByBranchItem {
  branchId: string;
  branchName: string | null;
  revenue: number;
  orderCount: number;
  aov: number;
}

export interface RevenueByBranch {
  branches: RevenueByBranchItem[];
}

/** weekday: 0 = Sunday .. 6 = Saturday; hour: 0..23, shop-local. */
export interface SalesHeatmapCell {
  weekday: number;
  hour: number;
  revenue: number;
  orderCount: number;
}

export interface SalesHeatmap {
  cells: SalesHeatmapCell[];
}

export interface TopCustomerItem {
  customerId: string;
  name: string | null;
  phone: string | null;
  revenue: number;
  orderCount: number;
  aov: number;
}

export interface TopCustomers {
  customers: TopCustomerItem[];
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

async function getCashflowListPage(params?: object): Promise<CashflowList> {
  const res = await client.get<{
    success: boolean;
    data: CashflowTransaction[];
    pagination: CashflowList['pagination'];
  }>('/stats/cashflow/transactions', { params });
  return { data: res.data.data, pagination: res.data.pagination };
}

export const statsApi = {
  getOverview: (params?: StatsDateRangeParams) =>
    getStats<StatsOverview>('/stats/overview', params),

  getRevenue: (params?: StatsDateRangeParams & { groupBy?: RevenueGroupBy }) =>
    getStats<RevenueSeries>('/stats/revenue', params),

  getOrderPipeline: (params?: { branchId?: string }) =>
    getStats<OrderPipeline>('/stats/order-pipeline', params),

  getStockAlerts: (params?: { branchId?: string; warehouseId?: string; lowStockThreshold?: number }) =>
    getStats<StockAlerts>('/stats/stock-alerts', params),

  getSlowProducts: (params?: StatsDateRangeParams & { limit?: number }) =>
    getStats<SlowProducts>('/stats/slow-products', params),

  getRevenueByPaymentMethod: (params?: StatsDateRangeParams) =>
    getStats<RevenueByPaymentMethod>('/stats/revenue-by-payment-method', params),

  getRevenueByStaff: (params?: StatsDateRangeParams) =>
    getStats<RevenueByStaff>('/stats/revenue-by-staff', params),

  getCashflow: (params?: StatsDateRangeParams & { flow?: 'ORD' | 'SUP'; flowType?: 'INCOME' | 'EXPENSE' }) =>
    getStats<Cashflow>('/stats/cashflow', params),

  getCashflowList: (
    params?: StatsDateRangeParams & {
      flow?: 'ORD' | 'SUP';
      flowType?: 'INCOME' | 'EXPENSE';
      paymentMethod?: string;
      page?: number;
      limit?: number;
    },
  ) => getCashflowListPage(params),

  getTopProducts: (params?: StatsDateRangeParams & { sortBy?: 'quantity' | 'revenue'; limit?: number }) =>
    getStats<TopProducts>('/stats/top-products', params),

  getInventory: (params?: { branchId?: string; warehouseId?: string; lowStockThreshold?: number }) =>
    getStats<InventoryStats>('/stats/inventory', params),

  getRevenueComparison: (params?: { branchId?: string }) =>
    getStats<RevenueComparison>('/stats/revenue-comparison', params),

  getOrdersByStatus: (params?: StatsDateRangeParams) =>
    getStats<OrdersByStatus>('/stats/orders-by-status', params),

  getRevenueByBranch: (params?: StatsDateRangeParams) =>
    getStats<RevenueByBranch>('/stats/revenue-by-branch', params),

  getSalesHeatmap: (params?: StatsDateRangeParams) =>
    getStats<SalesHeatmap>('/stats/sales-heatmap', params),

  getTopCustomers: (params?: StatsDateRangeParams & { limit?: number }) =>
    getStats<TopCustomers>('/stats/top-customers', params),

  getAdminOverview: (params?: { fromDate?: string; toDate?: string; groupBy?: 'day' | 'month' }) =>
    getStats<AdminOverview>('/stats/admin/overview', params),
};
