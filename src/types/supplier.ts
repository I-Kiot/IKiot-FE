// [Domain – Types]
export interface Supplier {
  id: string
  supplierName: string
  contactName: string
  phoneNumber: string
  email: string
  address: string
  creditLimit: number
  outstandingDebt: number
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
}

export type SupplierUpdatePayload = Partial<SupplierCreatePayload>

export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'MOMO' | 'VNPAY' | 'SEPAY'

/**
 * `PaySupplierDebtDto` takes exactly these three. There used to be a `branchId` here and
 * the server dropped it: `SupplierService.payDebt` writes a `CashFlow` EXPENSE row with no
 * branch on purpose - it does not know which till the notes came out of, and CLAUDE.md
 * records that as a deliberate limitation of the drawer reconciliation report. Sending a
 * branch made the client look like it was recording something the ledger never stored.
 */
export interface SupplierPayDebtPayload {
  amount: number
  paymentMethod?: PaymentMethod
  note?: string
}
