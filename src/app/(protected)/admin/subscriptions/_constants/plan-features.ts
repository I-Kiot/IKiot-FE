// Mirror of backend src/constants/planFeatures.js (PLAN_FEATURES).
// These are feature-flag keys used by checkPlanFeature - distinct from the
// marketing bullet list (displayFeatures).
export const PLAN_FEATURE_OPTIONS: { key: string; label: string }[] = [
  { key: "stock_movement", label: "Quản lý nhập/xuất hàng" },
  { key: "sales", label: "Bán hàng" },
  { key: "reports", label: "Xem báo cáo" },
  { key: "hr_management", label: "Quản lý nhân sự" },
  { key: "payroll", label: "Quản lý lương" },
];

export const BILLING_CYCLE_LABELS: Record<string, string> = {
  MONTHLY: "Hàng tháng",
  YEARLY: "Hàng năm",
  NONE: "Không",
};
