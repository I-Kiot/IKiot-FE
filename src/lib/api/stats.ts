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
  /** Doanh thu thuần − giá vốn thực − phí vận chuyển thực − phí sàn. Dòng giữ hàng chưa có giá vốn tính là 0. */
  grossProfit: number;
  /** Số dòng bán có giữ hàng mà giá vốn = 0 - > 0 thì lợi nhuận đang bị thổi lên. */
  linesMissingCost: number;
  /** Doanh thu bán (chưa trừ hàng trả); revenue = grossSales + returns + otherIncome. */
  grossSales?: number;
  /** Tiền hàng trả lại trong kỳ (số âm). */
  returns?: number;
  goodsRevenue?: number;
  shippingRevenue?: number;
  otherIncome?: number;
  costOfGoods?: number;
  shippingCost?: number;
  channelFee?: number;
  returnCount?: number;
  /** Đơn hoàn tất trong kỳ chưa có trong sổ doanh thu (đơn cũ trước khi có sổ). */
  journalGap?: JournalGap;
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

export interface JournalGap {
  ordersWithoutJournal: number;
  firstJournalAt: string | null;
}

export interface RevenueSeriesPoint {
  /** `YYYY-MM-DDTHH` (giờ), `YYYY-MM-DD` (ngày) hoặc `YYYY-MM` (tháng), theo giờ Việt Nam. */
  bucket: string;
  /** Doanh thu thuần của mốc - có thể âm khi hàng trả lớn hơn bán. */
  revenue: number;
  orderCount: number;
  /** Hàng trả trong mốc (số âm). */
  returns?: number;
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
  /** 'UNKNOWN' khi khoản thu không có phương thức. */
  paymentMethod: string;
  /** Tiền thực thu ròng của phương thức = received - refunded - change. */
  revenue: number;
  orderCount: number;
  received?: number;
  refunded?: number;
  change?: number;
}

export interface RevenueByPaymentMethod {
  basis?: 'CASH';
  breakdown: RevenueByPaymentMethodItem[];
}

export interface RevenueByStaffItem {
  userId: string;
  staffName: string | null;
  revenue: number;
  orderCount: number;
  aov: number;
}

/** Người được tính: phụ trách đơn, người lên đơn hoặc người thu tiền. */
export type RevenueByStaffGroupBy = 'assignee' | 'creator' | 'collector';

export interface RevenueByStaff {
  groupBy?: RevenueByStaffGroupBy;
  staff: RevenueByStaffItem[];
}

export interface CashflowByType {
  flowType: 'INCOME' | 'EXPENSE';
  total: number;
  count: number;
}

/** Hạng mục dòng tiền (`cash_flows.category`). */
export type CashflowCategory =
  | 'ORDER_PAYMENT'
  | 'ORDER_REFUND'
  | 'SALE_CHANGE'
  | 'SUPPLIER_PAYMENT'
  | 'UNALLOCATED_RECEIPT'
  | 'UNALLOCATED_REFUND';

/** Quỹ chứa tiền: két chi nhánh, quỹ chủ (shipper nộp thẳng chủ) hoặc tài khoản ngân hàng. */
export type CashflowFund = 'DRAWER' | 'OWNER' | 'BANK';

export interface CashflowByCategory {
  category: CashflowCategory;
  fund: CashflowFund;
  flowType: 'INCOME' | 'EXPENSE';
  total: number;
  count: number;
}

export interface CashflowByFund {
  fund: CashflowFund;
  income: number;
  expense: number;
  net: number;
  count: number;
}

export interface Cashflow {
  income: number;
  expense: number;
  net: number;
  byType: CashflowByType[];
  byCategory?: CashflowByCategory[];
  byFund?: CashflowByFund[];
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
  category?: CashflowCategory | null;
  fund?: CashflowFund | null;
  /** Dòng sổ SePay gốc của khoản tiền chưa gắn đơn. */
  sepayLedgerId?: string | null;
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
  // Chỉ một trong hai có giá trị, khớp với `locationType`.
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
  /** Cùng khoảng thời gian đã trôi qua của kỳ trước, không phải toàn bộ kỳ đó. */
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

/** weekday: 0 = Chủ nhật .. 6 = Thứ bảy; hour: 0..23, theo giờ của shop. */
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

/** Loại bút toán trong sổ doanh thu. */
export type SalesJournalEntryType = 'SALE' | 'RETURN' | 'OTHER_INCOME';

export interface SalesJournalLine {
  id: string;
  orderItemId: string | null;
  productItemId: string | null;
  productName: string | null;
  sku: string | null;
  lineType: string | null;
  /** Có dấu: dòng trả hàng là số âm. */
  quantity: number;
  amount: number;
  cogs: number;
}

export interface SalesJournalEntry {
  id: string;
  entryType: SalesJournalEntryType;
  source: string;
  orderId: string;
  orderCode: string | null;
  orderReturnId: string | null;
  branchId: string;
  branchName: string | null;
  /** `YYYY-MM-DD`, ngày địa phương. */
  businessDate: string;
  postedAt: string;
  goodsAmount: number;
  shippingAmount: number;
  otherIncomeAmount: number;
  totalAmount: number;
  cogsAmount: number;
  shippingCost: number;
  channelFee: number;
  customerId: string | null;
  assigneeId: string | null;
  creatorId: string | null;
  channel: string | null;
  fulfillmentType: string | null;
  actorId: string | null;
  lines: SalesJournalLine[];
}

export interface SalesJournalTotals {
  goodsAmount: number;
  shippingAmount: number;
  otherIncomeAmount: number;
  totalAmount: number;
  cogsAmount: number;
  shippingCost: number;
  channelFee: number;
}

export interface SalesJournalList {
  data: SalesJournalEntry[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
  totals: SalesJournalTotals;
}

export interface SalesJournalParams {
  fromDate?: string;
  toDate?: string;
  branchId?: string;
  entryType?: SalesJournalEntryType;
  orderId?: string;
  page?: number;
  limit?: number;
}

export interface UnreconciledShipperItem {
  collectorId: string | null;
  collectorName: string | null;
  orderCount: number;
  amount: number;
  oldestPaidAt: string | null;
}

export interface UnreconciledSepayItem {
  id: string;
  outcome: string;
  rejectReason: string | null;
  amount: number;
  excessAmount: number;
  paymentReference: string | null;
  content: string | null;
  orderId: string | null;
  orderCode: string | null;
  createdAt: string;
}

export interface UnreconciledOverpaidItem {
  orderId: string;
  code: string;
  grandTotal: number;
  overpaidBy: number;
}

export interface UnreconciledHeldItem {
  orderId: string;
  code: string;
  status: 'RETURNED' | 'CANCELLED' | string;
  held: number;
  closedAt: string;
}

export interface UnreconciledLocationItem {
  locationId: string;
  locationName: string | null;
}

export interface Unreconciled {
  asOf: string;
  scope: 'TENANT' | 'BRANCH';
  shipperCash: { orderCount: number; amount: number; items: UnreconciledShipperItem[] };
  sepayExceptions: { count: number; amount: number; excessAmount: number; items: UnreconciledSepayItem[] };
  overpaidOrders: { count: number; amount: number; items: UnreconciledOverpaidItem[] };
  /** Đơn trả hàng / huỷ mà shop còn giữ tiền chưa quyết định (hoàn hay giữ). */
  heldUndecided: { count: number; amount: number; items: UnreconciledHeldItem[] };
  /** null khi scope = BRANCH. */
  unallocatedBank: { receipts: number; refunds: number; net: number } | null;
  ownerFund: {
    income: number;
    expense: number;
    balance: number;
    byCategory: { category: CashflowCategory; flowType: 'INCOME' | 'EXPENSE'; amount: number; count: number }[];
  };
  warehouseCounterCash: {
    net: number;
    items: (UnreconciledLocationItem & { income: number; expense: number; net: number })[];
  };
  cashRefundsAgainstDrawer: {
    count: number;
    amount: number;
    items: (UnreconciledLocationItem & { count: number; amount: number })[];
  };
  journalCoverage: { firstJournalAt: string | null; ordersWithoutJournal: number };
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

  getRevenueByStaff: (params?: StatsDateRangeParams & { groupBy?: RevenueByStaffGroupBy }) =>
    getStats<RevenueByStaff>('/stats/revenue-by-staff', params),

  getCashflow: (
    params?: StatsDateRangeParams & {
      flow?: 'ORD' | 'SUP';
      flowType?: 'INCOME' | 'EXPENSE';
      category?: CashflowCategory;
      fund?: CashflowFund;
    },
  ) =>
    getStats<Cashflow>('/stats/cashflow', params),

  getCashflowList: (
    params?: StatsDateRangeParams & {
      flow?: 'ORD' | 'SUP';
      flowType?: 'INCOME' | 'EXPENSE';
      paymentMethod?: string;
      category?: CashflowCategory;
      fund?: CashflowFund;
      page?: number;
      limit?: number;
    },
  ) => getCashflowListPage(params),

  getSalesJournal: async (params?: SalesJournalParams): Promise<SalesJournalList> => {
    const res = await client.get<{ success: boolean } & SalesJournalList>('/stats/sales-journal', { params });
    return { data: res.data.data, pagination: res.data.pagination, totals: res.data.totals };
  },

  getUnreconciled: (params?: { branchId?: string }) => getStats<Unreconciled>('/stats/unreconciled', params),

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
