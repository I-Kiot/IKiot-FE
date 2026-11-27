import type { ProductType } from '@/types/product'

/** Cấu hình màn `/products` và `/combos`. */
export type ProductScreen = {
  /** Gửi lên GET /products. */
  listTypes: ProductType[]
  /** Loại chọn được khi tạo; một loại thì không hiện ô chọn. */
  createTypes: ProductType[]
  /** Danh từ trong nút / tiêu đề dialog: "Thêm {noun}". */
  noun: string
  title: string
  description: string
  breadcrumb: string
  /** Cột tồn kho và bộ lọc tồn. */
  showStock: boolean
  /** Dòng phụ "Toàn chuỗi" dưới số tồn. */
  showChainStock: boolean
  /** Nút "Tìm ở chi nhánh khác". */
  crossBranchSearch: boolean
  /** Nút "Nhập file". */
  importFile: boolean
}

export const PRODUCTS_SCREEN: ProductScreen = {
  listTypes: ['PRODUCT', 'SERVICE'],
  createTypes: ['PRODUCT', 'SERVICE'],
  noun: 'hàng hóa',
  title: 'Hàng hóa',
  description: 'Quản lý danh sách hàng hóa, giá bán và tồn kho',
  breadcrumb: 'Danh sách',
  showStock: true,
  showChainStock: true,
  crossBranchSearch: true,
  importFile: true,
}

export const COMBOS_SCREEN: ProductScreen = {
  listTypes: ['COMBO'],
  createTypes: ['COMBO'],
  noun: 'combo',
  title: 'Combo',
  description: 'Quản lý các bộ sản phẩm bán theo giá trọn bộ',
  breadcrumb: 'Combo',
  showStock: true,
  showChainStock: false,
  crossBranchSearch: false,
  importFile: false,
}

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  PRODUCT: 'Hàng hoá',
  COMBO: 'Combo (bộ sản phẩm)',
  SERVICE: 'Dịch vụ',
}
