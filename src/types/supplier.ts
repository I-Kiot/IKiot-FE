import type { HistoryPage, HistoryPerson } from './history'
import type { SupplierType } from './order-flow'

export interface Supplier {
  id: string
  supplierName: string
  /** Bốn trường dưới là cột nullable: NCC tạo mà bỏ trống ô thì BE trả `null`, không phải `''` (bug 44). */
  contactName: string | null
  phoneNumber: string | null
  email: string | null
  address: string | null
  creditLimit: number
  outstandingDebt: number
  /** GOODS = bán hàng có sẵn (nhập từ NCC); WORKSHOP = xưởng làm theo đơn (YCSX, B-1). */
  type: SupplierType
  createdAt?: string
  updatedAt?: string
}

export interface SupplierPagination {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface SupplierQueryParams {
  search?: string
  hasDebt?: 'true' | 'false'
  type?: SupplierType
  page?: number
  limit?: number
}

export interface SupplierListResponse {
  data: Supplier[]
  pagination: SupplierPagination
}

export interface SupplierCreatePayload {
  supplierName: string
  contactName?: string
  phoneNumber?: string
  email?: string
  address?: string
  creditLimit?: number
  /** Server khoá sau khi phiếu nhập hoặc YCSX dùng NCC này (`SUPPLIER_TYPE_LOCKED`). */
  type?: SupplierType
}

export type SupplierUpdatePayload = Partial<SupplierCreatePayload>

export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'MOMO' | 'VNPAY' | 'SEPAY'

/** Body trả nợ NCC. */
export interface SupplierPayDebtPayload {
  amount: number
  paymentMethod?: PaymentMethod
  note?: string
  /** Trả tiền mặt từ két địa điểm này; bỏ trống là quỹ chủ. */
  locationId?: string
}

export type SupplierDebtEntryType = 'OPENING' | 'CHARGE' | 'PAYMENT'
export type SupplierDebtRefType = 'STOCK_MOVEMENT' | 'PRODUCTION_REQUEST' | 'CASH_FLOW'

/** Một dòng sổ công nợ NCC (`GET /suppliers/:id/debt-entries`). `amount` có dấu: PAYMENT âm. */
export interface SupplierDebtEntry {
  id: string
  supplierId: string
  entryType: SupplierDebtEntryType
  amount: number
  balanceAfter: number
  referenceType: SupplierDebtRefType | null
  referenceId: string | null
  referenceCode: string | null
  cashFlowId: string | null
  createdBy: HistoryPerson | null
  createdAt: string
}

export interface SupplierDebtEntryQuery {
  entryType?: SupplierDebtEntryType
  page?: number
  limit?: number
}

export interface SupplierDebtEntriesResponse extends HistoryPage<SupplierDebtEntry> {
  supplier: { id: string; supplierName: string; outstandingDebt: number }
}
