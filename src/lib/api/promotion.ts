// [API – Promotion]
import client from '@/lib/api/client'
import type {
  Promotion,
  PromotionPagination,
  PromotionQueryParams,
  PromotionListResponse,
  PromotionCreatePayload,
  PromotionUpdatePayload,
  PromotionLog,
  PromotionLogListResponse,
  PromotionCalculateRequest,
  PromotionCalculateResponse,
  PromotionCandidatesRequest,
  PromotionCandidatesResponse,
} from '@/types/promotion'

// Kiểu phản hồi của API. Bản Express cũ trả document Mongo khoá `_id`; bản NestJS
// trả `id`, nên phép ánh xạ dưới đây giờ là đồng nhất - giữ lại làm chỗ duy nhất phải
// sửa nếu hình dạng phản hồi đổi lần nữa.
type PromotionDoc = Omit<Promotion, 'id'> & { id: string }
type PromotionLogDoc = Omit<PromotionLog, 'id'> & { id: string }

function mapPromotion(doc: PromotionDoc): Promotion {
  const { id, ...rest } = doc
  return { ...rest, id }
}

function mapPromotionLog(doc: PromotionLogDoc): PromotionLog {
  const { id, ...rest } = doc
  return { ...rest, id }
}

export const promotionApi = {
  getList: async (params?: PromotionQueryParams): Promise<PromotionListResponse> => {
    const res = await client.get<{
      success: boolean
      data: PromotionDoc[]
      pagination: PromotionPagination
    }>('/promotions', { params })
    return {
      data: res.data.data.map(mapPromotion),
      pagination: res.data.pagination,
    }
  },

  getById: async (id: string): Promise<Promotion> => {
    const res = await client.get<{ data: PromotionDoc }>(`/promotions/${id}`)
    return mapPromotion(res.data.data)
  },

  create: async (payload: PromotionCreatePayload): Promise<Promotion> => {
    const res = await client.post<{ data: PromotionDoc }>('/promotions', payload)
    return mapPromotion(res.data.data)
  },

  update: async (id: string, payload: PromotionUpdatePayload): Promise<Promotion> => {
    const res = await client.patch<{ data: PromotionDoc }>(`/promotions/${id}`, payload)
    return mapPromotion(res.data.data)
  },

  remove: async (id: string): Promise<void> => {
    await client.delete(`/promotions/${id}`)
  },

  listCandidates: async (
    payload: PromotionCandidatesRequest,
  ): Promise<PromotionCandidatesResponse> => {
    const res = await client.post<{ data: PromotionCandidatesResponse }>(
      '/promotions/candidates',
      payload,
    )
    return res.data.data
  },

  calculate: async (payload: PromotionCalculateRequest): Promise<PromotionCalculateResponse> => {
    const res = await client.post<{ data: PromotionCalculateResponse }>(
      '/promotions/calculate',
      payload,
    )
    return res.data.data
  },

  apply: async (
    payload: PromotionCalculateRequest & { orderId: string },
  ): Promise<PromotionCalculateResponse> => {
    const res = await client.post<{ data: PromotionCalculateResponse }>(
      '/promotions/apply',
      payload,
    )
    return res.data.data
  },

  getLogs: async (
    id: string,
    params?: { page?: number; limit?: number },
  ): Promise<PromotionLogListResponse> => {
    const res = await client.get<{
      success: boolean
      data: PromotionLogDoc[]
      pagination: PromotionPagination
    }>(`/promotions/${id}/logs`, { params })
    return {
      data: res.data.data.map(mapPromotionLog),
      pagination: res.data.pagination,
    }
  },
}
