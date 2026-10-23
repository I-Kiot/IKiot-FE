import type { ProductType } from '@/types/product'

/**
 * `/products` và `/combos` dùng chung component, chỉ khác cấu hình này. `productType` cố định lúc tạo; BE không có mặc định cho bộ lọc nên mỗi màn tự gửi `listTypes`.
 */
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
  /** Cột "Tồn kho" và bộ lọc tồn. Combo không giữ tồn riêng: con số của nó là số bộ mà các thành phần đủ cho (BE tính). */
  showStock: boolean
  /** Dòng phụ "Toàn chuỗi" dưới số tồn khi đang xem theo một chi nhánh / kho. Màn combo không hiện: chỉ có số bộ của chi nhánh đang xem. */
  showChainStock: boolean
  /** Nút "Tìm ở chi nhánh khác". Tìm theo hàng có tồn nên chỉ có ở màn hàng hoá; combo không có tồn riêng để tìm. */
  crossBranchSearch: boolean
  /** Nút "Nhập file". File mẫu chỉ tạo hàng hoá thường (một dòng không liệt kê được thành phần), nên màn combo không có. */
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
