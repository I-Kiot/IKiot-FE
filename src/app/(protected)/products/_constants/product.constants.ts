// [Constants – Product]
import type { ProductStatus } from '@/types/product'

const PLACEHOLDER = '/placeholder-product.svg'

export function safeImageSrc(url?: string | null): string {
  if (!url) return PLACEHOLDER
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/')) return url
  return PLACEHOLDER
}

export const formatVND = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)

export const formatPriceAmount = (value?: string | number | null): string => {
  if (value === undefined || value === null || value === '') return ''
  const digits = String(value).replace(/\D/g, '')
  if (!digits) return ''
  return Number(digits).toLocaleString('vi-VN')
}

export const parsePriceAmount = (value?: string): number => {
  if (!value?.trim()) return 0
  const digits = value.replace(/\D/g, '')
  return digits ? (Number(digits) || 0) : 0
}

export const STATUS_MAP: Record<ProductStatus, { label: string; className: string }> = {
  ACTIVE: {
    label: 'Đang kinh doanh',
    className: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20',
  },
  INACTIVE: {
    label: 'Ngừng kinh doanh',
    className: 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20',
  },
  DISCONTINUED: {
    label: 'Ngừng sản xuất',
    className: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20',
  },
}

// Thứ tự hiển thị mặc định: Đang kinh doanh -> Ngừng kinh doanh -> Ngừng sản xuất
export const STATUS_ORDER: Record<ProductStatus, number> = {
  ACTIVE: 0,
  INACTIVE: 1,
  DISCONTINUED: 2,
}

// BE (ProductService.softDeleteProduct) chặn xóa hàng hóa nếu còn tồn kho,
// đang có phiếu chuyển kho dang dở, hoặc đang nằm trong đơn hàng chờ xử lý.
export function getDeleteProductErrorMessage(beMessage?: string): string {
  if (!beMessage) return 'Xóa hàng hóa thất bại'
  if (beMessage.includes('still items in stock')) {
    return 'Không thể xóa: hàng hóa vẫn còn tồn kho tại một số vị trí'
  }
  if (beMessage.includes('pending stock movements')) {
    return 'Không thể xóa: hàng hóa đang có phiếu chuyển/nhập/xuất kho chưa hoàn tất'
  }
  if (beMessage.includes('pending customer orders')) {
    return 'Không thể xóa: hàng hóa đang nằm trong đơn hàng chờ xử lý'
  }
  if (beMessage.includes('not found')) {
    return 'Hàng hóa không tồn tại hoặc đã bị xóa'
  }
  return beMessage
}

export const COLUMN_LABELS: Record<string, string> = {
  image: '',
  productCode: 'Mã hàng',
  name: 'Tên hàng hóa',
  brandId: 'Thương hiệu',
  categoryId: 'Danh mục',
  costPrice: 'Giá vốn',
  retailPrice: 'Giá bán',
  stock: 'Tồn kho',
  status: 'Trạng thái',
}
