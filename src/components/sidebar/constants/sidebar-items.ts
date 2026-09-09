import {
  LayoutDashboard,
  MessageCircle,
  Users,
  Package,
  Shuffle,
  ShoppingCart,
  Ticket,
  CreditCard,
  Settings,
  ShieldAlert,
  Megaphone,
  LifeBuoy,
  Bell,
  MessageSquarePlus,
  Wallet,
  Landmark,
  Vault,
} from "lucide-react";
import { type NavItem } from "./types";

export const sidebarItems = {
  // Quản lý
  tongQuan: {
    title: "Tổng quan",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  troLyAI: {
    title: "Trợ lý AI",
    url: "/chat",
    icon: MessageCircle,
  },
  soThuChi: {
    title: "Sổ thu chi",
    url: "/cashflow",
    icon: Wallet,
  },
  nhanVien: {
    title: "Nhân viên",
    url: "#",
    icon: Users,
    items: [
      { title: "Danh sách", url: "/staffs" },
      { title: "Lịch làm", url: "/staffs/schedule" },
      { title: "Nghỉ phép", url: "/staffs/schedule/leave-requests" },
      { title: "Ngày lễ", url: "/staffs/holidays" },
      { title: "Bảng lương", url: "/staffs/payroll" },

    ],
  },
  /**
   * Bản dành cho chủ cửa hàng: giống `nhanVien` cộng thêm "Phân quyền".
   *
   * Trang đó gác bằng `canManageRoles` (bản sao của `OwnerOrAdminGuard` ở backend), mà
   * `nhanVien` thì dùng chung cho cả nhân viên thường - hiện link cho họ chỉ để họ bấm
   * vào và gặp màn hình từ chối.
   */
  nhanVienChuCuaHang: {
    title: "Nhân viên",
    url: "#",
    icon: Users,
    items: [
      { title: "Danh sách", url: "/staffs" },
      { title: "Lịch làm", url: "/staffs/schedule" },
      { title: "Nghỉ phép", url: "/staffs/schedule/leave-requests" },
      { title: "Ngày lễ", url: "/staffs/holidays" },
      { title: "Bảng lương", url: "/staffs/payroll" },
      { title: "Phân quyền", url: "/staffs/roles" },
    ],
  },
  luong: {
    title: "Lương của tôi",
    url: "/staffs/payroll/my-payslips",
    icon: Wallet,
  },

  // Quản lý bán hàng
  hangHoa: {
    title: "Hàng hóa",
    url: "/products",
    icon: Package,
    items: [
      { title: "Danh sách", url: "/products" },
      { title: "Danh mục", url: "/categories" },
      { title: "Thương hiệu", url: "/brands" },
    ],
  },
  giaoDich: {
    title: "Giao dịch",
    url: "/#",
    icon: Shuffle,
    items: [
      { title: "Nhà cung cấp", url: "/exchange/suppliers" },
      { title: "Nhập hàng", url: "/exchange/imports" },
      { title: "Chuyển kho", url: "/exchange/exports" },
      { title: "Điều chỉnh tồn kho", url: "/exchange/adjustments" },
    ],
  },
  // `giaoDichBranch` (a BRANCH_MANAGER-only variant without "Nhập hàng") lived here until
  // 2026-09-09. Its only reader was the BRANCH_MANAGER block deleted on 2026-09-07, so it
  // was config nothing could match. Per-role trimming of this menu is a permission question
  // now - see `nav-exchange-permissions.ts`.
  donHang: {
    title: "Đơn hàng",
    url: "/#",
    icon: ShoppingCart,
    items: [
      { title: "Hoá đơn", url: "/sales/invoices" },
    ],
  },

  // CRM
  khachHang: {
    title: "Khách hàng",
    url: "/customers",
    icon: Users,
  },
  khuyenMai: {
    title: "Khuyến mãi",
    url: "/promotions",
    icon: Ticket,
  },

  // ADMIN Quản lý
  adminDashboard: {
    title: "Dashboard",
    url: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  adminUsers: {
    title: "Người dùng",
    url: "/admin/users",
    icon: Users,
  },
  subscriptions: {
    title: "Gói dịch vụ",
    url: "/admin/subscriptions",
    icon: CreditCard,
  },
  adminSepay: {
    title: "Liên kết SePay",
    url: "/admin/sepay",
    icon: Landmark,
  },
  adminGiaoDich: {
    title: "Giao dịch",
    url: "/admin/transactions",
    icon: Shuffle,
  },
  adminAuditLog: {
    title: "Nhật ký hệ thống",
    url: "/admin/audit-logs",
    icon: ShieldAlert,
  },
  adminNotifications: {
    title: "Gửi thông báo",
    url: "/admin/notifications",
    icon: Megaphone,
  },
  adminSystemNotifications: {
    title: "Thông báo",
    url: "/admin/system-notifications",
    icon: Bell,
  },
  adminTickets: {
    title: "Hỗ trợ kỹ thuật",
    url: "/admin/tickets",
    icon: LifeBuoy,
  },

  // ADMIN Cài đặt
  cauHinhHeThong: {
    title: "Cấu hình hệ thống",
    url: "/admin/settings",
    icon: Settings,
  },

  // CSKH (Tenant)
  tenantPhanAnh: {
    title: "Phản ánh",
    url: "/tickets",
    icon: MessageSquarePlus,
  },
  ketTien: {
    title: "Két tiền",
    url: "/cash-drawers",
    icon: Vault,
    items: [
      { title: "Hôm nay", url: "/cash-drawers/today" },
      { title: "Lịch sử", url: "/cash-drawers/history" },
    ],
  },
} as const satisfies Record<string, NavItem>;
