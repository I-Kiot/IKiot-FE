// [Domain – Types]
export interface CategoryBreadcrumb {
  id: string
  name: string
}

export interface Category {
  id: string
  name: string
  parentId?: string | { id: string; name: string } | null
  description?: string
  imageUrl?: string
  breadcrumbs?: CategoryBreadcrumb[]
  children?: Category[]
  createdAt?: string
  updatedAt?: string
}

export interface CategoryPagination {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface CategoryQueryParams {
  search?: string
  parentId?: string
  page?: number
  limit?: number
}

export interface CategoryListResponse {
  data: Category[]
  pagination: CategoryPagination
}

export interface CategoryCreatePayload {
  name: string
  parentId?: string | null
  description?: string
  imageUrl?: string
}

export type CategoryUpdatePayload = Partial<CategoryCreatePayload>
