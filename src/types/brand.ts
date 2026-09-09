// [Domain – Types]
export interface Brand {
  id: string
  name: string
  description?: string
  logo?: string
  createdAt?: string
  updatedAt?: string
}

export interface BrandPagination {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface BrandQueryParams {
  search?: string
  page?: number
  limit?: number
}

export interface BrandListResponse {
  data: Brand[]
  pagination: BrandPagination
}

export interface BrandCreatePayload {
  name: string
  description?: string
  logo?: string
}

export type BrandUpdatePayload = Partial<BrandCreatePayload>
