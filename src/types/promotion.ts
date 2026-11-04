export type PromotionStatus = 'ACTIVE' | 'INACTIVE'
export type DiscountType = 'PERCENT' | 'FIXED_AMOUNT'
export type ApplicableRuleType = 'all' | 'category' | 'product'

export interface ApplicableRule {
  type: ApplicableRuleType
  categoryIds?: string[]
  productItemIds?: string[]
}

export interface Promotion {
  id: string
  tenantId?: string
  /** Rỗng/không gửi = áp dụng toàn chuỗi. */
  branchIds?: string[]
  promoName: string
  description?: string
  discountType: DiscountType
  discountValue: number
  maxDiscountAmount?: number | null
  minOrderValue: number
  applicableRule: ApplicableRule
  startDate: string
  endDate: string
  stackable: boolean
  usageLimit?: number | null
  usageLimitPerCustomer?: number | null
  usedCount: number
  status: PromotionStatus
  createdAt?: string
  updatedAt?: string
}

export interface PromotionPagination {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface PromotionQueryParams {
  search?: string
  status?: PromotionStatus
  branchId?: string
  page?: number
  limit?: number
}

export interface PromotionListResponse {
  data: Promotion[]
  pagination: PromotionPagination
}

export interface PromotionCreatePayload {
  branchIds?: string[]
  promoName: string
  description?: string
  discountType: DiscountType
  discountValue: number
  maxDiscountAmount?: number | null
  minOrderValue?: number
  applicableRule: ApplicableRule
  startDate: string
  endDate: string
  stackable?: boolean
  usageLimit?: number | null
  usageLimitPerCustomer?: number | null
}

export type PromotionUpdatePayload = Partial<PromotionCreatePayload> & {
  status?: PromotionStatus
}

export interface PromotionLog {
  id: string
  promotionId: string
  orderId?: string
  paymentReference?: string | null
  branchId?: string
  customerId?: string
  discountAmount: number
  createdBy?: string
  description?: string
  createdAt: string
}

export interface PromotionLogListResponse {
  data: PromotionLog[]
  pagination: PromotionPagination
}

export interface PromotionCalculateItem {
  productItemId: string
  quantity: number
  unitPrice: number
}

export interface PromotionCandidatesRequest {
  branchId?: string
  customerId?: string
  items: PromotionCalculateItem[]
}

export interface PromotionCalculateRequest {
  branchId?: string
  customerId?: string
  items: PromotionCalculateItem[]
  /** Khuyến mãi người dùng chọn để áp dụng. Rỗng = không giảm. Tối đa 2; nếu có 2 thì cả hai phải stackable. */
  promotionIds: string[]
}

export interface PromotionAppliedEntry {
  promotionId: string
  promoName: string
  discountAmount: number
}

export interface PromotionCalculateResponse {
  appliedPromotions: PromotionAppliedEntry[]
  totalDiscount: number
  itemBreakdown: { productItemId: string; discountAmount: number }[]
  grandTotal: number
}

/** Một khuyến mãi trong bộ chọn "gán giảm giá", đã đánh giá theo giỏ hàng này. */
export interface PromotionCandidate {
  id: string
  promoName: string
  description?: string
  discountType: DiscountType
  discountValue: number
  maxDiscountAmount?: number | null
  minOrderValue: number
  branchIds?: string[]
  stackable: boolean
  eligible: boolean
  /** Lý do không đủ điều kiện (chuỗi tiếng Việt từ BE), khi eligible=false. */
  reason: string | null
  /** Mức giảm nếu chỉ áp riêng khuyến mãi này. */
  previewDiscount: number
}

export interface PromotionCandidatesResponse {
  branchPromotions: PromotionCandidate[]
  systemPromotions: PromotionCandidate[]
}
