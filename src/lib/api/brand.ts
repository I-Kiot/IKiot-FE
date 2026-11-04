import client from '@/lib/api/client'
import type {
  Brand,
  BrandPagination,
  BrandQueryParams,
  BrandListResponse,
  BrandCreatePayload,
  BrandUpdatePayload,
} from '@/types/brand'

// Bản Express cũ trả `_id`, bản NestJS trả `id` nên ánh xạ này giờ đồng nhất; giữ làm chỗ duy nhất phải sửa nếu hình dạng phản hồi đổi.
type BrandDoc = Omit<Brand, 'id'> & { id: string }

function mapBrand(doc: BrandDoc): Brand {
  const { id, ...rest } = doc
  return { ...rest, id }
}

export const brandApi = {
  getList: async (params?: BrandQueryParams): Promise<BrandListResponse> => {
    const res = await client.get<{
      success: boolean
      data: BrandDoc[]
      pagination: BrandPagination
    }>('/brands', { params })
    return {
      data: res.data.data.map(mapBrand),
      pagination: res.data.pagination,
    }
  },

  getById: async (id: string): Promise<Brand> => {
    const res = await client.get<{ data: BrandDoc }>(`/brands/${id}`)
    return mapBrand(res.data.data)
  },

  create: async (payload: BrandCreatePayload): Promise<Brand> => {
    const res = await client.post<{ data: BrandDoc }>('/brands', payload)
    return mapBrand(res.data.data)
  },

  update: async (id: string, payload: BrandUpdatePayload): Promise<Brand> => {
    const res = await client.patch<{ data: BrandDoc }>(`/brands/${id}`, payload)
    return mapBrand(res.data.data)
  },

  remove: async (id: string): Promise<void> => {
    await client.delete(`/brands/${id}`)
  },
}
