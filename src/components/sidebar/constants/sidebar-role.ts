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


// BRANCH_MANAGER và WAREHOUSE_MANAGER từng có cấu hình menu riêng đến 2026-09-07. Nay không còn là loại tài khoản (shop tự định nghĩa role), nên hai khối đó đã bị xoá.
export const sidebarRoleConfig: Record<UserRole, NavGroup[]> = {
  ADMIN: [
    {
      label: "Quản lý",
      items: [
        sidebarItems.adminDashboard,
        sidebarItems.adminSystemNotifications,
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
        sidebarItems.baoCao,
        sidebarItems.soThuChi,
        sidebarItems.nhanVienChuCuaHang,
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



  // Mọi role tự tạo của shop đều là STAFF, nên đây là nguồn chung: liệt kê mọi nhóm shop có thể cấp, còn `AppSidebar` lọc theo quyền của từng role.
  // Thiếu một nhóm ở đây không phải hạn chế mà là mục không ai tới được (giaoDich, tongQuan, soThuChi từng bị vậy đến 2026-09-09). Hai leaf được gác bởi nav-leaf-permissions.ts.
  STAFF: [
    {
      label: "Quản lý",
      items: [
        sidebarItems.tongQuan,
        sidebarItems.baoCao,
        sidebarItems.soThuChi,
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
