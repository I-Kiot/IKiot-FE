// Các cờ tính năng của gói, khớp PLAN_FEATURES của backend.
export const PLAN_FEATURE_OPTIONS: { key: string; label: string }[] = [
  { key: "stock_movement", label: "Quản lý nhập/xuất hàng" },
  { key: "sales", label: "Bán hàng" },
  { key: "reports", label: "Xem báo cáo" },
  { key: "hr_management", label: "Quản lý nhân sự" },
];

export const BILLING_CYCLE_LABELS: Record<string, string> = {
  MONTHLY: "Hàng tháng",
  YEARLY: "Hàng năm",
  NONE: "Không",
};
