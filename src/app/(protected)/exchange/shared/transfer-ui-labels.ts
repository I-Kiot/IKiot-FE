export type TransferUiLabels = {
  moduleTitle: string
  createButton: string
  createDialogTitle: string
  fromLabel: string
  toLabel: string
  fromPlaceholder: string
  toPlaceholder: string
  orderNotePlaceholder: string
  noStockAtSource: string
  submitButton: string
  successToast: string
  searchPlaceholder: string
  fromColumnHeader: string
  toColumnHeader: string
  emptyState: string
  fromRequired: string
  toRequired: string
  sameLocationError: string
  loadLocationsError: string
  loadProductsError: string
  receiveTitle: string
  listLoadError: string
  receiveSuccess: string
  receiveError: string
  cancelSuccess: string
  cancelError: string
  sidebarTitle: string
}

const BRANCH_LABELS: TransferUiLabels = {
  moduleTitle: 'Chuyển hàng',
  createButton: 'Tạo yêu cầu chuyển hàng',
  createDialogTitle: 'Tạo yêu cầu chuyển hàng',
  fromLabel: 'Chi nhánh gửi',
  toLabel: 'Nơi nhận',
  fromPlaceholder: 'Chọn chi nhánh gửi',
  toPlaceholder: 'Chọn chi nhánh hoặc kho nhận',
  orderNotePlaceholder: 'Ghi chú cho cả phiếu chuyển hàng (tùy chọn)',
  noStockAtSource: 'Không có hàng tồn tại chi nhánh nguồn.',
  submitButton: 'Tạo yêu cầu chuyển hàng',
  successToast: 'Tạo yêu cầu chuyển hàng thành công',
  searchPlaceholder: 'Tìm theo chi nhánh, kho, mã yêu cầu...',
  fromColumnHeader: 'Chi nhánh gửi',
  toColumnHeader: 'Nơi nhận',
  emptyState: 'Không có yêu cầu chuyển hàng',
  fromRequired: 'Vui lòng chọn chi nhánh gửi',
  toRequired: 'Vui lòng chọn nơi nhận',
  sameLocationError: 'Nơi gửi và nơi nhận không được trùng nhau',
  loadLocationsError: 'Không thể tải danh sách chi nhánh/kho',
  loadProductsError: 'Không thể tải hàng tại chi nhánh nguồn',
  receiveTitle: 'Xác nhận nhận hàng chuyển / trả kho',
  listLoadError: 'Không thể tải danh sách chuyển hàng',
  receiveSuccess: 'Đã nhận hàng chuyển',
  receiveError: 'Không thể nhận hàng chuyển',
  cancelSuccess: 'Đã huỷ yêu cầu chuyển hàng',
  cancelError: 'Không thể huỷ yêu cầu chuyển hàng',
  sidebarTitle: 'Chuyển hàng',
}

const WAREHOUSE_LABELS: TransferUiLabels = {
  moduleTitle: 'Chuyển kho',
  createButton: 'Tạo yêu cầu chuyển kho',
  createDialogTitle: 'Tạo yêu cầu chuyển kho',
  fromLabel: 'Kho gửi',
  toLabel: 'Chi nhánh nhận',
  fromPlaceholder: 'Chọn kho gửi',
  toPlaceholder: 'Chọn chi nhánh nhận',
  orderNotePlaceholder: 'Ghi chú cho cả phiếu chuyển kho (tùy chọn)',
  noStockAtSource: 'Không có hàng tồn tại kho nguồn.',
  submitButton: 'Tạo yêu cầu chuyển kho',
  successToast: 'Tạo yêu cầu chuyển kho thành công',
  searchPlaceholder: 'Tìm theo kho, chi nhánh, mã yêu cầu...',
  fromColumnHeader: 'Kho gửi',
  toColumnHeader: 'Chi nhánh nhận',
  emptyState: 'Không có yêu cầu chuyển kho',
  fromRequired: 'Vui lòng chọn kho gửi',
  toRequired: 'Vui lòng chọn chi nhánh nhận',
  sameLocationError: 'Kho gửi và nơi nhận không được trùng nhau',
  loadLocationsError: 'Không thể tải danh sách kho/chi nhánh',
  loadProductsError: 'Không thể tải hàng tại kho nguồn',
  receiveTitle: 'Xác nhận nhận hàng chuyển kho',
  listLoadError: 'Không thể tải danh sách chuyển kho',
  receiveSuccess: 'Đã nhận hàng chuyển kho',
  receiveError: 'Không thể nhận hàng chuyển kho',
  cancelSuccess: 'Đã huỷ yêu cầu chuyển kho',
  cancelError: 'Không thể huỷ yêu cầu chuyển kho',
  sidebarTitle: 'Chuyển kho',
}

const DEFAULT_LABELS: TransferUiLabels = {
  moduleTitle: 'Chuyển kho',
  createButton: 'Tạo yêu cầu chuyển kho',
  createDialogTitle: 'Tạo yêu cầu chuyển kho',
  fromLabel: 'Kho / Chi nhánh gửi',
  toLabel: 'Kho / Chi nhánh nhận',
  fromPlaceholder: 'Chọn nơi gửi',
  toPlaceholder: 'Chọn nơi nhận',
  orderNotePlaceholder: 'Ghi chú cho cả phiếu chuyển (tùy chọn)',
  noStockAtSource: 'Không có hàng tồn tại nguồn.',
  submitButton: 'Tạo yêu cầu chuyển kho',
  successToast: 'Tạo yêu cầu chuyển kho thành công',
  searchPlaceholder: 'Tìm theo kho, chi nhánh, mã yêu cầu...',
  fromColumnHeader: 'Nơi gửi',
  toColumnHeader: 'Nơi nhận',
  emptyState: 'Không có yêu cầu chuyển kho',
  fromRequired: 'Vui lòng chọn nơi gửi',
  toRequired: 'Vui lòng chọn nơi nhận',
  sameLocationError: 'Nơi gửi và nơi nhận không được trùng nhau',
  loadLocationsError: 'Không thể tải danh sách kho/chi nhánh',
  loadProductsError: 'Không thể tải hàng tại nguồn',
  receiveTitle: 'Xác nhận nhận hàng chuyển kho',
  listLoadError: 'Không thể tải danh sách chuyển kho',
  receiveSuccess: 'Đã nhận hàng chuyển kho',
  receiveError: 'Không thể nhận hàng chuyển kho',
  cancelSuccess: 'Đã huỷ yêu cầu chuyển kho',
  cancelError: 'Không thể huỷ yêu cầu chuyển kho',
  sidebarTitle: 'Chuyển kho',
}

/** Wording follows where the reader works, which is what the two manager roles used to say. */
export function getTransferUiLabels(
  branchId?: string | null,
  warehouseId?: string | null,
): TransferUiLabels {
  if (branchId) return BRANCH_LABELS
  if (warehouseId) return WAREHOUSE_LABELS
  return DEFAULT_LABELS
}
