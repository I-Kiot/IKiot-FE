// [API – Customer]
import client from '@/lib/api/client'
import type {
  Customer,
  CustomerQueryParams,
  CustomerListResponse,
  CustomerCreatePayload,
  CustomerUpdatePayload,
} from '@/types/customer'

function mapCustomer(cust: any): Customer {
  const id = cust.id || cust.id;
  return {
    id,
    customerCode: cust.customerCode || `KH-${id ? id.slice(-6).toUpperCase() : Math.floor(1000 + Math.random() * 9000)}`,
    name: cust.name,
    phone: cust.phone || '',
    gender: cust.gender || 'OTHER',
    address: cust.address || '',
    dob: cust.dob || '',
    createdAt: cust.createdAt || '',
    orders: cust.orders || [],
  };
}

export const customerApi = {
  getList: async (params?: CustomerQueryParams): Promise<CustomerListResponse> => {
    const res = await client.get<{
      success: boolean
      data: any[]
      pagination: {
        total: number
        page: number
        limit: number
        totalPages: number
      }
    }>('/customers', { params })

    return {
      data: (res.data.data || []).map(mapCustomer),
      total: res.data.pagination?.total || 0,
      page: res.data.pagination?.page || 1,
      limit: res.data.pagination?.limit || 20,
      totalPages: res.data.pagination?.totalPages || 1,
    }
  },
  getById: async (id: string): Promise<Customer> => {
    const res = await client.get<{ success: boolean; data: any }>(`/customers/${id}`)
    return mapCustomer(res.data.data)
  },
  create: async (payload: CustomerCreatePayload): Promise<Customer> => {
    const res = await client.post<{ success: boolean; data: any }>('/customers', payload)
    return mapCustomer(res.data.data)
  },
  update: async (id: string, payload: CustomerUpdatePayload): Promise<Customer> => {
    const res = await client.patch<{ success: boolean; data: any }>(`/customers/${id}`, payload)
    return mapCustomer(res.data.data)
  },
  remove: async (id: string): Promise<void> => {
    await client.delete(`/customers/${id}`)
  },
  removeMany: async (ids: string[]): Promise<void> => {
    await client.delete('/customers', { data: { ids } })
  },
}
