// Màu của các biểu đồ trang Thống kê. Bảng phân loại 5 màu theo thứ tự cố định (không xoay vòng), mỗi chế độ
// sáng/tối một bộ bước riêng, đã chạy validator CVD của skill dataviz (2026-11-23): qua mọi kiểm tra ở cả hai chế độ.
// Ở nền sáng 3 màu (xanh ngọc, vàng, hồng) dưới 3:1 so với nền nên donut luôn kèm chú thích có tên + giá trị bên cạnh.
// Lát thứ 6 trở đi gộp vào "Khác" (xám), không sinh thêm màu.

export const SERIES_THEMES = [
  { light: "#2a78d6", dark: "#3987e5" }, // xanh dương
  { light: "#eb6834", dark: "#d95926" }, // cam
  { light: "#1baf7a", dark: "#199e70" }, // xanh ngọc
  { light: "#eda100", dark: "#c98500" }, // vàng
  { light: "#e87ba4", dark: "#d55181" }, // hồng
] as const

/** Lát "Khác" của donut. */
export const OTHER_THEME = { light: "#a3a29d", dark: "#6f6e69" }

/** Hai cực của biểu đồ tăng trưởng (dương / âm). */
export const GROWTH_UP_THEME = SERIES_THEMES[0]
export const GROWTH_DOWN_THEME = { light: "#e34948", dark: "#e66767" }

/** Số lát tối đa có màu riêng; còn lại vào "Khác". */
export const MAX_SLICES = SERIES_THEMES.length
