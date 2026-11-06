import {
  LayoutDashboard,
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
  PackageCheck,
  Truck,
  BarChart3,
  Factory,
} from "lucide-react";
import { type NavItem } from "./types";

export const sidebarItems = {
  tongQuan: {
    title: "Tổng quan",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  // Phân tích sâu tách khỏi dashboard tổng quan (2026-10-20).
  baoCao: {
    title: "Báo cáo",
    url: "/reports",
    icon: BarChart3,
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
      { title: "Ngày lễ", url: "/staffs/holidays" },
    ],
  },
  /**
   * Bản cho chủ shop: giống `nhanVien` và thêm "Phân quyền" (gác bằng `canManageRoles`). `nhanVien` dùng chung cho cả nhân viên, nên hiện link với họ chỉ để họ gặp màn từ chối.
   */
  nhanVienChuCuaHang: {
    title: "Nhân viên",
    url: "#",
    icon: Users,
    items: [
      { title: "Danh sách", url: "/staffs" },
      { title: "Lịch làm", url: "/staffs/schedule" },
      { title: "Ngày lễ", url: "/staffs/holidays" },
      { title: "Phân quyền", url: "/staffs/roles" },
    ],
  },

  hangHoa: {
    title: "Hàng hóa",
    url: "/products",
    icon: Package,
    items: [
      { title: "Danh sách", url: "/products" },
      { title: "Combo", url: "/combos" },
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
      { title: "Danh sách cần sản xuất", url: "/exchange/production-list" },
      { title: "Phiếu xưởng giao", url: "/exchange/production-deliveries" },
    ],
  },
  // `giaoDichBranch` (biến thể BRANCH_MANAGER, đã bỏ 2026-09-09) không còn. Thu gọn menu theo quyền do bộ lọc quyền xử lý, không do cấu hình này.
  donHang: {
    title: "Đơn hàng",
    url: "/#",
    icon: ShoppingCart,
    items: [
      { title: "Tạo đơn hàng", url: "/sales/orders/new" },
      { title: "Danh sách đơn", url: "/sales/orders" },
      { title: "Hoàn hàng", url: "/order-returns" },
      { title: "Hoá đơn", url: "/sales/invoices" },
    ],
  },
  // Hành trình đơn (P0-7, 2026-10-02): đóng gói và giao hàng, mỗi màn track C một mục.
  vanHanh: {
    title: "Vận hành",
    url: "/#",
    icon: PackageCheck,
    items: [
      { title: "Đóng đơn", url: "/fulfillments" },
      { title: "Giao hàng", url: "/shipments" },
    ],
  },
  /** Đơn giao của chính mình (C-7). Chủ shop và người phụ trách đơn cũng có thể là shipper (chốt 2026-10-06). */
  donGiaoCuaToi: {
    title: "Đơn giao của tôi",
    url: "/shipper",
    icon: Truck,
  },
  /** Nhân viên xưởng (2026-10-09): YCSX gửi cho xưởng mình + phiếu giao. Chỉ STAFF gắn xưởng. */
  xuongCuaToi: {
    title: "Xưởng của tôi",
    url: "/workshop",
    icon: Factory,
  },

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

  cauHinhHeThong: {
    title: "Cấu hình hệ thống",
    url: "/admin/settings",
    icon: Settings,
  },

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
