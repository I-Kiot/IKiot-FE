// [Constants – Permission sections]
//
// Cách màn Vai trò bày danh mục quyền: theo *công việc của người giữ vai trò* (nhân viên bán hàng, quản
// lý, vận chuyển & kho, xưởng), không theo bảng tài nguyên × hành động của backend. Đây chỉ là cách sắp
// xếp - không phải vai trò cố định: chủ shop vẫn tick từng quyền, tạo vai trò nào cũng được.
//
// Mỗi quyền nằm đúng một chỗ, với tên nói nó mở việc gì. Quyền có trong danh mục mà không có ở đây vẫn
// hiện ở nhóm "Khác" (`OTHER_SECTION_ID`) - một quyền mới thêm ở BE không bao giờ biến mất khỏi màn hình.
import type { LucideIcon } from 'lucide-react'
import { Factory, ShieldCheck, ShoppingBag, Truck } from 'lucide-react'

export type PermissionItem = {
  /** `resource:action`, đúng mã trong danh mục. */
  key: string
  label: string
  /** Một dòng nói rõ hơn khi tên chưa đủ. Mô tả từ BE (`description`) được ưu tiên nếu có. */
  hint?: string
}

export type PermissionBlock = {
  title: string
  items: PermissionItem[]
}

export type PermissionSection = {
  id: string
  title: string
  summary: string
  icon: LucideIcon
  blocks: PermissionBlock[]
}

export const OTHER_SECTION_ID = 'other'

export const PERMISSION_SECTIONS: PermissionSection[] = [
  {
    id: 'staff',
    title: 'Nhân viên bán hàng',
    summary: 'Tạo đơn, chăm sóc khách, thu tiền và đứng ca tại cửa hàng.',
    icon: ShoppingBag,
    blocks: [
      {
        title: 'Đơn hàng',
        items: [
          { key: 'orders:create', label: 'Tạo đơn', hint: 'Đơn tạo tay và bán tại quầy' },
          { key: 'orders:read', label: 'Xem đơn của chi nhánh mình' },
          { key: 'orders:pay_offline', label: 'Thu tiền mặt tại quầy' },
          { key: 'returns:read', label: 'Xem phiếu hoàn hàng' },
          {
            key: 'returns:create',
            label: 'Tạo phiếu hoàn hàng',
            hint: 'Người phụ trách đơn luôn tạo được cho đơn của mình',
          },
        ],
      },
      {
        title: 'Khách hàng & khuyến mãi',
        items: [
          { key: 'customers:read', label: 'Xem khách hàng' },
          { key: 'customers:create', label: 'Thêm khách hàng' },
          { key: 'customers:update', label: 'Sửa thông tin khách hàng' },
          { key: 'promotions:read', label: 'Xem khuyến mãi' },
          { key: 'promotions:calculate', label: 'Tính thử khuyến mãi cho giỏ hàng' },
          { key: 'promotions:apply', label: 'Áp khuyến mãi vào đơn' },
        ],
      },
      {
        title: 'Ca thu ngân',
        items: [
          { key: 'cash_drawers:open', label: 'Mở ca' },
          { key: 'cash_drawers:report', label: 'Ghi phiếu giao / nhận ca' },
        ],
      },
      {
        title: 'Thông tin chung',
        items: [
          { key: 'inventory:read', label: 'Xem tồn kho' },
          { key: 'schedules:read', label: 'Xem lịch làm việc' },
          { key: 'tickets:read', label: 'Xem phản ánh gửi hỗ trợ' },
          { key: 'tickets:create', label: 'Gửi phản ánh cho hỗ trợ' },
        ],
      },
    ],
  },
  {
    id: 'manager',
    title: 'Quản lý',
    summary: 'Duyệt, sửa, huỷ, xem báo cáo và quản lý nhân sự, hàng hoá, chi nhánh.',
    icon: ShieldCheck,
    blocks: [
      {
        title: 'Đơn hàng & hoàn hàng',
        items: [
          { key: 'orders:view_all', label: 'Xem đơn của mọi chi nhánh' },
          {
            key: 'orders:update',
            label: 'Sửa đơn',
            hint: 'Sửa dòng hàng, đổi người phụ trách, độ ưu tiên, trạng thái và huỷ đơn',
          },
          {
            key: 'orders:confirm_cash',
            label: 'Xác nhận tiền shipper nộp lại',
            hint: 'Bước cuối của đơn thu tiền mặt khi giao',
          },
          { key: 'returns:inspect', label: 'Kiểm hàng hoàn', hint: 'Quyết định hàng hoàn nhập lại kho hay vào kho hỏng' },
          { key: 'returns:cancel', label: 'Huỷ phiếu hoàn hàng' },
        ],
      },
      {
        title: 'Tiền & báo cáo',
        items: [
          { key: 'reports:read', label: 'Xem Tổng quan và Sổ thu chi' },
          { key: 'cash_flows:read', label: 'Xem phiếu thu / chi' },
          { key: 'cash_drawers:read', label: 'Xem mọi ca thu ngân của chi nhánh' },
          { key: 'cash_drawers:finalize', label: 'Chốt ca (đếm tiền cuối ngày)' },
          { key: 'suppliers:pay_debt', label: 'Trả công nợ nhà cung cấp / xưởng' },
        ],
      },
      {
        title: 'Nhân viên & lịch làm',
        items: [
          { key: 'users:read', label: 'Xem danh sách nhân viên' },
          { key: 'users:create', label: 'Thêm nhân viên' },
          { key: 'users:update', label: 'Sửa nhân viên, cấp / khoá tài khoản' },
          { key: 'users:delete', label: 'Xoá nhân viên' },
          { key: 'schedules:read_all', label: 'Xem lịch của mọi người' },
          { key: 'schedules:readBR', label: 'Xem lịch theo chi nhánh' },
          { key: 'schedules:readWH', label: 'Xem lịch theo kho' },
          { key: 'schedules:create', label: 'Xếp lịch làm' },
          { key: 'schedules:update', label: 'Sửa lịch làm' },
          { key: 'schedules:delete', label: 'Xoá lịch làm' },
          { key: 'holidays:read', label: 'Xem ngày lễ' },
          { key: 'holidays:create', label: 'Thêm ngày lễ' },
          { key: 'holidays:update', label: 'Sửa / bật tắt ngày lễ' },
          { key: 'holidays:delete', label: 'Xoá ngày lễ' },
        ],
      },
      {
        title: 'Hàng hoá & khuyến mãi',
        items: [
          { key: 'products:create', label: 'Thêm sản phẩm' },
          { key: 'products:update', label: 'Sửa sản phẩm, giá' },
          { key: 'products:delete', label: 'Xoá sản phẩm' },
          { key: 'categories:create', label: 'Thêm danh mục' },
          { key: 'categories:update', label: 'Sửa danh mục' },
          { key: 'categories:delete', label: 'Xoá danh mục' },
          { key: 'brands:create', label: 'Thêm thương hiệu' },
          { key: 'brands:update', label: 'Sửa thương hiệu' },
          { key: 'brands:delete', label: 'Xoá thương hiệu' },
          { key: 'promotions:create', label: 'Tạo khuyến mãi' },
          { key: 'promotions:update', label: 'Sửa khuyến mãi' },
          { key: 'promotions:delete', label: 'Xoá khuyến mãi' },
          { key: 'customers:delete', label: 'Xoá khách hàng' },
        ],
      },
      {
        title: 'Chi nhánh, kho & nhà cung cấp',
        items: [
          { key: 'branches:read', label: 'Xem mọi chi nhánh' },
          { key: 'branches:create', label: 'Mở chi nhánh' },
          { key: 'branches:update', label: 'Sửa chi nhánh' },
          { key: 'branches:delete', label: 'Đóng chi nhánh' },
          { key: 'branches:assign_manager', label: 'Chỉ định quản lý chi nhánh' },
          { key: 'warehouses:read', label: 'Xem mọi kho' },
          { key: 'warehouses:create', label: 'Mở kho' },
          { key: 'warehouses:update', label: 'Sửa kho' },
          { key: 'warehouses:delete', label: 'Đóng kho' },
          { key: 'warehouses:assign_manager', label: 'Chỉ định quản lý kho' },
          { key: 'suppliers:read', label: 'Xem nhà cung cấp / xưởng' },
          { key: 'suppliers:create', label: 'Thêm nhà cung cấp / xưởng' },
          { key: 'suppliers:update', label: 'Sửa nhà cung cấp / xưởng' },
          { key: 'suppliers:delete', label: 'Xoá nhà cung cấp / xưởng' },
          { key: 'stock_movement:approve', label: 'Duyệt điều chỉnh tồn kho (kiểm kê)' },
        ],
      },
      {
        title: 'Gói dịch vụ',
        items: [
          { key: 'subscriptions:read', label: 'Xem gói dịch vụ đang dùng' },
          { key: 'subscriptions:manage', label: 'Nâng cấp / gia hạn gói (trả tiền)' },
        ],
      },
    ],
  },
  {
    id: 'shipping',
    title: 'Vận chuyển & kho',
    summary: 'Đóng đơn, giao cho đơn vị vận chuyển hoặc shipper, xuất / nhập / chuyển kho.',
    icon: Truck,
    blocks: [
      {
        title: 'Đóng đơn & xuất kho',
        items: [
          {
            key: 'orders:pack',
            label: 'Đóng đơn tại kho',
            hint: 'Khoá hàng cho đơn; không sửa được giá hay dòng hàng',
          },
          { key: 'orders:ship', label: 'Bắt đầu vận chuyển (trừ tồn kho)' },
        ],
      },
      {
        title: 'Giao hàng',
        items: [
          { key: 'shipments:create', label: 'Giao cho ĐVVC / gán shipper' },
          { key: 'shipments:update', label: 'Đổi shipper, ghi nhật trình, báo giao không thành' },
          { key: 'shipments:read', label: 'Xem mọi lần giao hàng' },
          {
            key: 'shipments:deliver',
            label: 'Là shipper',
            hint: 'Có tên trong danh sách chọn shipper; xác nhận lấy hàng, giao xong, thu tiền',
          },
        ],
      },
      {
        title: 'Nhập, chuyển & điều chỉnh kho',
        items: [
          { key: 'stock_movement:read', label: 'Xem phiếu nhập / chuyển / điều chỉnh' },
          { key: 'stock_movement:create', label: 'Tạo phiếu nhập / chuyển / điều chỉnh' },
          { key: 'stock_movement:update', label: 'Soạn, đóng gói và xuất phiếu chuyển kho' },
          { key: 'stock_movement:receive', label: 'Nhận hàng vào kho' },
          { key: 'stock_movement:cancel', label: 'Huỷ phiếu' },
          { key: 'inventory:create', label: 'Thêm sản phẩm vào kho' },
          { key: 'inventory:update', label: 'Đặt mức tồn tối thiểu' },
          { key: 'inventory:delete', label: 'Bỏ sản phẩm khỏi kho (khi hết hàng)' },
        ],
      },
    ],
  },
  {
    id: 'workshop',
    title: 'Xưởng sản xuất',
    summary: 'Đặt xưởng làm hàng còn thiếu, nhận hàng xưởng giao; tài khoản của nhân viên xưởng.',
    icon: Factory,
    blocks: [
      {
        title: 'Phía cửa hàng / kho',
        items: [
          { key: 'production_requests:read', label: 'Xem yêu cầu sản xuất và danh sách cần sản xuất' },
          { key: 'production_requests:create', label: 'Tạo yêu cầu sản xuất' },
          { key: 'production_requests:update', label: 'Gửi / chuyển trạng thái yêu cầu sản xuất' },
          { key: 'production_requests:delete', label: 'Xoá yêu cầu sản xuất nháp' },
          {
            key: 'production:receive',
            label: 'Nhận hàng xưởng giao',
            hint: 'Bước làm tăng tồn kho và công nợ xưởng',
          },
        ],
      },
      {
        title: 'Nhân viên xưởng',
        items: [
          {
            key: 'production:deliver',
            label: 'Tạo phiếu giao hàng từ xưởng',
            hint: 'Tài khoản phải gắn với một xưởng; chỉ thấy yêu cầu của xưởng mình',
          },
        ],
      },
    ],
  },
]
