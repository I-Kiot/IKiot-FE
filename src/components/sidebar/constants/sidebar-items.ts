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
  MessageSquarePlus,
  Landmark,
  Vault,
  PackageCheck,
  Truck,
  BarChart3,
  ChartLine,
  Factory,
  History,
} from "lucide-react";
import { type NavItem } from "./types";

export const sidebarItems = {
  tongQuan: {
    title: "Tổng quan",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  // Nhóm Báo cáo, mọi mục cần `reports:read`.
  baoCao: {
    title: "Báo cáo",
    url: "#",
    icon: BarChart3,
    items: [
      { title: "Tổng hợp", url: "/reports" },
      { title: "Nhân viên", url: "/reports/staff" },
      { title: "Sổ doanh thu", url: "/reports/sales-journal" },
      // URL `/cashflow`, cần `reports:read`.
      { title: "Sổ thu chi", url: "/cashflow" },
      { title: "Đối soát tiền", url: "/reports/unreconciled" },
    ],
  },
  // Biểu đồ tăng trưởng, tách khỏi trang Báo cáo (2026-11-23).
  thongKe: {
    title: "Thống kê",
    url: "/statistics",
    icon: ChartLine,
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
  /** Menu nhân viên cho chủ shop, thêm "Phân quyền". */
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
      // Trang tạo mới chung cho đơn nhập NCC và yêu cầu sản xuất; trang tự chọn nguồn tài khoản được tạo.
      { title: "Tạo đơn nhập/YCSX", url: "/exchange/imports/new" },
      { title: "Danh sách đơn nhập", url: "/exchange/imports" },
      { title: "Chuyển kho", url: "/exchange/exports" },
      { title: "Điều chỉnh tồn kho", url: "/exchange/adjustments" },
    ],
  },
  // Menu thu gọn theo quyền.
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
  /** Đơn giao của tôi. */
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
  tenantAuditLog: {
    title: "Lịch sử hành động",
    url: "/audit-logs",
    icon: History,
  },
  adminNotifications: {
    title: "Gửi thông báo",
    url: "/admin/notifications",
    icon: Megaphone,
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
