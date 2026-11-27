import client from '@/lib/api/client'
import type {
  Supplier,
  SupplierPagination,
  SupplierQueryParams,
  SupplierListResponse,
  SupplierCreatePayload,
  SupplierUpdatePayload,
  SupplierPayDebtPayload,
  SupplierDebtEntryQuery,
  SupplierDebtEntriesResponse,
} from '@/types/supplier'

// Backend trả `id`; FE giữ nguyên.
type SupplierDoc = Omit<Supplier, 'id'> & { id: string }

function mapSupplier(doc: SupplierDoc): Supplier {
  const { id, ...rest } = doc
  return { ...rest, id }
}

export const supplierApi = {
  getList: async (params?: SupplierQueryParams): Promise<SupplierListResponse> => {
    const res = await client.get<{
      success: boolean
      data: SupplierDoc[]
      pagination: SupplierPagination
    }>('/suppliers', { params })
    return {
      data: res.data.data.map(mapSupplier),
      pagination: res.data.pagination,
    }
  },

  getById: async (id: string): Promise<Supplier> => {
    const res = await client.get<{ data: SupplierDoc }>(`/suppliers/${id}`)
    return mapSupplier(res.data.data)
  },

  create: async (payload: SupplierCreatePayload): Promise<Supplier> => {
    const res = await client.post<{ data: SupplierDoc }>('/suppliers', payload)
    return mapSupplier(res.data.data)
  },

  update: async (id: string, payload: SupplierUpdatePayload): Promise<Supplier> => {
    const res = await client.patch<{ data: SupplierDoc }>(`/suppliers/${id}`, payload)
    return mapSupplier(res.data.data)
  },

  remove: async (id: string): Promise<void> => {
    await client.delete(`/suppliers/${id}`)
  },

  // Thanh toán công nợ nhà cung cấp bằng tiền mặt (backend giảm outstandingDebt và tạo CashFlow chi).
  payDebt: async (id: string, payload: SupplierPayDebtPayload): Promise<Supplier> => {
    const res = await client.post<{ data: { supplier: SupplierDoc } }>(
      `/suppliers/${id}/payments`,
      payload,
    )
    return mapSupplier(res.data.data.supplier)
  },

  // Sổ công nợ một NCC, mới nhất trước (suppliers:read).
  getDebtEntries: async (
    id: string,
    params?: SupplierDebtEntryQuery,
  ): Promise<SupplierDebtEntriesResponse> => {
    const res = await client.get<SupplierDebtEntriesResponse>(`/suppliers/${id}/debt-entries`, { params })
    const body = res.data
    return {
      ...body,
      data: body.data.map((e) => ({ ...e, amount: Number(e.amount), balanceAfter: Number(e.balanceAfter) })),
      supplier: { ...body.supplier, outstandingDebt: Number(body.supplier.outstandingDebt) },
    }
  },
}
