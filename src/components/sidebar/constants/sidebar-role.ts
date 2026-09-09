import { sidebarItems } from "./sidebar-items";
import { type UserRole, type NavGroup } from "./types";

// Reuse groups to minimize duplication and improve maintainability
const quanLyBanHangGroup = (
  items: (typeof sidebarItems)[keyof typeof sidebarItems][],
) => ({
  label: "Quản lý bán hàng",
  items,
});
const salaryGroup = {
  label: "Lương",
  items: [sidebarItems.luong],
}
const crmGroup = {
  label: "CRM",
  items: [sidebarItems.khachHang, sidebarItems.khuyenMai],
};

const cskhGroup = {
  label: "CSKH",
  items: [sidebarItems.tenantPhanAnh],
};


// `BRANCH_MANAGER` and `WAREHOUSE_MANAGER` had entries here until 2026-09-07. Neither is
// an account kind any more - a shop defines its own roles - so those two blocks were nav
//configuration nothing could ever match.
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
        sidebarItems.troLyAI,
        sidebarItems.soThuChi,
        sidebarItems.nhanVienChuCuaHang,
      ],
    },
    quanLyBanHangGroup([
      sidebarItems.hangHoa,
      sidebarItems.giaoDich,
      sidebarItems.donHang,
      sidebarItems.ketTien,
    ]),
    crmGroup,
    cskhGroup,
  ],



  // A shop's own roles are all STAFF accounts, so this is the config every custom role
  // draws from: list everything a tenant can grant, and let the permission filters in
  // `AppSidebar` decide what this particular role actually sees. Leaving a group out here
  // is not a restriction, it is an entry nobody can ever reach - which is what happened to
  // `giaoDich` until 2026-09-09, hiding imports/transfers even from a full-permission role,
  // and to `tongQuan`/`troLyAI`/`soThuChi` until 2026-09-09. Those three are leaves, so they
  // are gated by `nav-leaf-permissions.ts` rather than by a submenu filter.
  STAFF: [
    {
      label: "Quản lý",
      items: [
        sidebarItems.tongQuan,
        sidebarItems.troLyAI,
        sidebarItems.soThuChi,
        sidebarItems.nhanVien,
      ],
    },
    quanLyBanHangGroup([
      sidebarItems.hangHoa,
      sidebarItems.giaoDich,
      sidebarItems.donHang,
      sidebarItems.ketTien,
    ]),
    crmGroup,
    cskhGroup,
    salaryGroup
  ],

  CUSTOMER: [],
};