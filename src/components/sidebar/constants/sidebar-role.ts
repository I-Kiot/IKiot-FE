import { sidebarItems } from "./sidebar-items";
import { type UserRole, type NavGroup } from "./types";

// Nhóm dùng chung, tránh lặp cấu hình
const quanLyBanHangGroup = (
  items: (typeof sidebarItems)[keyof typeof sidebarItems][],
) => ({
  label: "Quản lý bán hàng",
  items,
});
const crmGroup = {
  label: "CRM",
  items: [sidebarItems.khachHang, sidebarItems.khuyenMai],
};

const cskhGroup = {
  label: "CSKH",
  items: [sidebarItems.tenantPhanAnh],
};


// Cấu hình menu theo loại tài khoản.
export const sidebarRoleConfig: Record<UserRole, NavGroup[]> = {
  ADMIN: [
    {
      label: "Quản lý",
      items: [
        sidebarItems.adminDashboard,
        sidebarItems.adminUsers,
        sidebarItems.subscriptions,
        sidebarItems.adminSepay,
        sidebarItems.adminGiaoDich,
        sidebarItems.adminAuditLog,
        sidebarItems.adminNotifications,
        sidebarItems.adminTickets,
      ],
    },
    {
      label: "Cài đặt",
      items: [sidebarItems.cauHinhHeThong],
    },
  ],

  TENANT_OWNER: [
    {
      label: "Quản lý",
      items: [
        sidebarItems.tongQuan,
        sidebarItems.thongKe,
        sidebarItems.baoCao,
        sidebarItems.nhanVienChuCuaHang,
        sidebarItems.tenantAuditLog,
      ],
    },
    quanLyBanHangGroup([
      sidebarItems.hangHoa,
      sidebarItems.giaoDich,
      sidebarItems.donHang,
      sidebarItems.vanHanh,
      // Chủ shop cũng có thể tự giao hàng (chốt 2026-10-06).
      sidebarItems.donGiaoCuaToi,
      sidebarItems.ketTien,
    ]),
    crmGroup,
    cskhGroup,
  ],



  // Menu cho mọi STAFF; lọc theo quyền của role.
  STAFF: [
    {
      label: "Quản lý",
      items: [
        sidebarItems.tongQuan,
        sidebarItems.thongKe,
        sidebarItems.baoCao,
        sidebarItems.nhanVien,
      ],
    },
    quanLyBanHangGroup([
      sidebarItems.hangHoa,
      sidebarItems.giaoDich,
      sidebarItems.donHang,
      sidebarItems.vanHanh,
      sidebarItems.donGiaoCuaToi,
      // Chỉ STAFF: chủ shop không gắn xưởng nên màn này không có gì cho họ.
      sidebarItems.xuongCuaToi,
      sidebarItems.ketTien,
    ]),
    crmGroup,
    cskhGroup,
  ],

  CUSTOMER: [],
};
