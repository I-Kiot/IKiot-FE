// [API – Category]
import client from '@/lib/api/client'
import type {
  Category,
  CategoryPagination,
  CategoryQueryParams,
  CategoryListResponse,
  CategoryCreatePayload,
  CategoryUpdatePayload,
} from '@/types/category'

// Kiểu phản hồi của API. Bản Express cũ trả document Mongo khoá `_id`; bản NestJS
// trả `id`, nên phép ánh xạ dưới đây giờ là đồng nhất - giữ lại làm chỗ duy nhất phải
// sửa nếu hình dạng phản hồi đổi lần nữa.
type CategoryDoc = Omit<Category, 'id'> & { id: string }

function mapCategory(doc: CategoryDoc): Category {
  const { id, ...rest } = doc
  return { ...rest, id }
}

export const categoryApi = {
  getList: async (params?: CategoryQueryParams): Promise<CategoryListResponse> => {
    const res = await client.get<{
      success: boolean
      data: CategoryDoc[]
      pagination: CategoryPagination
    }>('/categories', { params })
    return {
      data: res.data.data.map(mapCategory),
      pagination: res.data.pagination,
    }
  },

  getById: async (id: string): Promise<Category> => {
    const res = await client.get<{ data: CategoryDoc }>(`/categories/${id}`)
    return mapCategory(res.data.data)
  },

  getTree: async (): Promise<Category[]> => {
    const res = await client.get<{ data: CategoryDoc[] }>('/categories/tree')
    return res.data.data.map(mapCategory)
  },

  create: async (payload: CategoryCreatePayload): Promise<Category> => {
    const res = await client.post<{ data: CategoryDoc }>('/categories', payload)
    return mapCategory(res.data.data)
  },

  update: async (id: string, payload: CategoryUpdatePayload): Promise<Category> => {
    const res = await client.patch<{ data: CategoryDoc }>(`/categories/${id}`, payload)
    return mapCategory(res.data.data)
  },

  remove: async (id: string): Promise<void> => {
    await client.delete(`/categories/${id}`)
  },
}
