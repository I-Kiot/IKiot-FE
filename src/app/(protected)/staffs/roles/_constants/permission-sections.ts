// [Constants – Permission sections]
//
// Cách màn Vai trò bày danh mục quyền: theo *công việc của người giữ vai trò* (nhân viên bán hàng, quản
// lý, vận chuyển & kho, xưởng), không theo bảng tài nguyên × hành động của backend. Đây chỉ là cách sắp
// xếp - không phải vai trò cố định: chủ shop vẫn tick từng ô, tạo vai trò nào cũng được.
//
// Một ô có thể bật nhiều mã (`keys`): "Quản lý sản phẩm" = tạo + sửa + xoá, vì không shop nào cho tạo mà
// cấm sửa. Mã BE giữ nguyên - gộp ở đây không cần migration; khi BE gộp mã thật thì chỉ sửa file này.
// `requires`: tick ô thì kéo theo quyền xem cần để mở màn hình (bỏ tick không gỡ chúng).
//
// Quyền có trong danh mục mà không có ở đây vẫn hiện ở nhóm "Khác" (`OTHER_SECTION_ID`) - một quyền mới
// thêm ở BE không bao giờ biến mất khỏi màn hình.
import type { LucideIcon } from 'lucide-react'
import { Factory, ShieldCheck, ShoppingBag, Truck } from 'lucide-react'

export type PermissionItem = {
  /** Các mã `resource:action` ô này bật/tắt cùng lúc. */
  keys: string[]
  label: string
  /** Một dòng nói rõ hơn khi tên chưa đủ. Mô tả từ BE (`description`) của mã đầu tiên được ưu tiên nếu có. */
  hint?: string
  /** Bật kèm khi tick ô (quyền xem để vào được màn hình), không gỡ khi bỏ tick. */
  requires?: string[]
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

/**
 * Quyền mọi vai trò đều có: thiếu chúng thì việc chính của nhân viên hỏng, còn cho thêm thì không lộ gì
 * quan trọng. Không hiện thành ô; được thêm vào khi lưu vai trò. (BE nên đưa vào `STAFF_BASE_PERMISSIONS`
 * - khi đó bỏ khỏi đây.)
 */
export const ALWAYS_ON_PERMISSIONS: { key: string; label: string }[] = [
  { key: 'inventory:read', label: 'xem tồn kho' },
  { key: 'holidays:read', label: 'xem ngày lễ' },
  { key: 'schedules:read', label: 'xem lịch làm' },
  { key: 'tickets:read', label: 'xem phản ánh' },
  { key: 'tickets:create', label: 'gửi phản ánh cho hỗ trợ' },
]

const ORDERS_READ = ['orders:read']
const PRODUCTION_READ = ['production_requests:read']
const STOCK_READ = ['stock_movement:read']
const SUPPLIERS_READ = ['suppliers:read']

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
          { keys: ['orders:read'], label: 'Xem đơn của chi nhánh mình' },
          {
            keys: ['orders:create', 'customers:create', 'promotions:calculate', 'promotions:apply'],
            label: 'Tạo đơn',
            hint: 'Đơn tạo tay và bán tại quầy - gồm chọn / thêm khách và áp khuyến mãi',
            requires: ['orders:read', 'customers:read', 'promotions:read'],
          },
          { keys: ['orders:pay_offline'], label: 'Thu tiền mặt tại quầy', requires: ORDERS_READ },
          {
            keys: ['returns:create'],
            label: 'Tạo phiếu hoàn hàng',
            hint: 'Người phụ trách đơn luôn tạo được cho đơn của mình',
            requires: ['orders:read', 'returns:read'],
          },
        ],
      },
      {
        title: 'Khách hàng, khuyến mãi & hoàn hàng',
        items: [
          { keys: ['customers:read'], label: 'Xem danh sách khách hàng' },
          { keys: ['customers:update'], label: 'Sửa thông tin khách hàng', requires: ['customers:read'] },
          { keys: ['promotions:read'], label: 'Xem danh sách khuyến mãi' },
          { keys: ['returns:read'], label: 'Xem phiếu hoàn hàng' },
        ],
      },
      {
        title: 'Ca thu ngân',
        items: [{ keys: ['cash_drawers:open', 'cash_drawers:report'], label: 'Mở ca và ghi phiếu giao / nhận ca' }],
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
          { keys: ['orders:view_all'], label: 'Xem đơn của mọi chi nhánh', requires: ORDERS_READ },
          {
            keys: ['orders:update'],
            label: 'Sửa và huỷ đơn',
            hint: 'Sửa dòng hàng, đổi người phụ trách, độ ưu tiên, trạng thái và huỷ đơn',
            requires: ORDERS_READ,
          },
          {
            keys: ['orders:confirm_cash'],
            label: 'Xác nhận tiền shipper nộp lại',
            hint: 'Bước cuối của đơn thu tiền mặt khi giao',
            requires: ORDERS_READ,
          },
          {
            keys: ['returns:inspect', 'returns:cancel'],
            label: 'Kiểm và huỷ phiếu hoàn hàng',
            hint: 'Quyết định hàng hoàn nhập lại kho hay vào kho hỏng',
            requires: ['returns:read'],
          },
        ],
      },
      {
        title: 'Tiền & báo cáo',
        items: [
          { keys: ['reports:read', 'cash_flows:read'], label: 'Xem Tổng quan và Sổ thu chi' },
          { keys: ['cash_drawers:read'], label: 'Xem mọi ca thu ngân của chi nhánh' },
          { keys: ['cash_drawers:finalize'], label: 'Chốt ca (đếm tiền cuối ngày)', requires: ['cash_drawers:read'] },
          {
            keys: ['suppliers:pay_debt'],
            label: 'Trả công nợ nhà cung cấp / xưởng',
            requires: SUPPLIERS_READ,
          },
        ],
      },
      {
        title: 'Nhân viên & lịch làm',
        items: [
          { keys: ['users:read'], label: 'Xem danh sách nhân viên' },
          {
            keys: ['users:create', 'users:update'],
            label: 'Thêm và sửa nhân viên, cấp / khoá tài khoản',
            requires: ['users:read'],
          },
          {
            keys: ['users:delete'],
            label: 'Xoá nhân viên',
            hint: 'Xoá là ẩn danh hoá hồ sơ - không lấy lại được',
            requires: ['users:read'],
          },
          {
            keys: ['schedules:read_all', 'schedules:readBR', 'schedules:readWH'],
            label: 'Xem lịch của mọi người, mọi nơi',
          },
          { keys: ['schedules:create', 'schedules:update', 'schedules:delete'], label: 'Xếp lịch làm' },
          { keys: ['holidays:create', 'holidays:update', 'holidays:delete'], label: 'Quản lý ngày lễ' },
        ],
      },
      {
        title: 'Hàng hoá & khuyến mãi',
        items: [
          { keys: ['products:create', 'products:update', 'products:delete'], label: 'Quản lý sản phẩm, giá' },
          {
            keys: [
              'categories:create',
              'categories:update',
              'categories:delete',
              'brands:create',
              'brands:update',
              'brands:delete',
            ],
            label: 'Quản lý danh mục và thương hiệu',
          },
          {
            keys: ['promotions:create', 'promotions:update', 'promotions:delete'],
            label: 'Quản lý khuyến mãi',
            requires: ['promotions:read'],
          },
          { keys: ['customers:delete'], label: 'Xoá khách hàng', requires: ['customers:read'] },
        ],
      },
      {
        title: 'Chi nhánh, kho & nhà cung cấp',
        items: [
          { keys: ['branches:read', 'warehouses:read'], label: 'Xem mọi chi nhánh và kho' },
          {
            keys: [
              'branches:create',
              'branches:update',
              'branches:delete',
              'branches:assign_manager',
              'warehouses:create',
              'warehouses:update',
              'warehouses:delete',
              'warehouses:assign_manager',
            ],
            label: 'Quản lý chi nhánh và kho',
            hint: 'Mở, sửa, đóng, chỉ định người quản lý',
            requires: ['branches:read', 'warehouses:read'],
          },
          { keys: ['suppliers:read'], label: 'Xem nhà cung cấp / xưởng' },
          {
            keys: ['suppliers:create', 'suppliers:update', 'suppliers:delete'],
            label: 'Quản lý nhà cung cấp / xưởng',
            requires: SUPPLIERS_READ,
          },
          {
            keys: ['stock_movement:approve'],
            label: 'Duyệt điều chỉnh tồn kho (kiểm kê)',
            requires: STOCK_READ,
          },
        ],
      },
      {
        title: 'Gói dịch vụ',
        items: [
          { keys: ['subscriptions:read'], label: 'Xem gói dịch vụ đang dùng' },
          {
            keys: ['subscriptions:manage'],
            label: 'Nâng cấp / gia hạn gói (trả tiền)',
            requires: ['subscriptions:read'],
          },
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
            keys: ['orders:pack'],
            label: 'Đóng đơn tại kho',
            hint: 'Khoá hàng cho đơn; không sửa được giá hay dòng hàng',
            requires: ORDERS_READ,
          },
          { keys: ['orders:ship'], label: 'Bắt đầu vận chuyển (trừ tồn kho)', requires: ORDERS_READ },
        ],
      },
      {
        title: 'Giao hàng',
        items: [
          {
            keys: ['shipments:create', 'shipments:update', 'shipments:read'],
            label: 'Điều phối giao hàng',
            hint: 'Giao cho ĐVVC / gán và đổi shipper, ghi nhật trình, báo giao không thành, xem mọi lần giao',
            requires: ORDERS_READ,
          },
          {
            keys: ['shipments:deliver'],
            label: 'Là shipper',
            hint: 'Có tên trong danh sách chọn shipper; xác nhận lấy hàng, giao xong, thu tiền',
          },
        ],
      },
      {
        title: 'Nhập, chuyển & điều chỉnh kho',
        items: [
          { keys: ['stock_movement:read'], label: 'Xem phiếu nhập / chuyển / điều chỉnh' },
          {
            keys: ['stock_movement:create', 'stock_movement:update', 'stock_movement:cancel'],
            label: 'Lập và xử lý phiếu kho',
            hint: 'Tạo, soạn, đóng gói, xuất và huỷ phiếu nhập / chuyển / điều chỉnh',
            requires: STOCK_READ,
          },
          { keys: ['stock_movement:receive'], label: 'Nhận hàng vào kho', requires: STOCK_READ },
          {
            keys: ['inventory:create', 'inventory:update', 'inventory:delete'],
            label: 'Thiết lập tồn kho',
            hint: 'Thêm / bỏ sản phẩm khỏi kho, đặt mức tồn tối thiểu',
          },
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
          { keys: ['production_requests:read'], label: 'Xem yêu cầu sản xuất và danh sách cần sản xuất' },
          {
            keys: ['production_requests:create', 'production_requests:update', 'production_requests:delete'],
            label: 'Quản lý yêu cầu sản xuất',
            hint: 'Tạo, gửi xưởng, chuyển trạng thái, xoá bản nháp',
            requires: PRODUCTION_READ,
          },
          {
            keys: ['production:receive'],
            label: 'Nhận hàng xưởng giao',
            hint: 'Bước làm tăng tồn kho và công nợ xưởng',
            requires: PRODUCTION_READ,
          },
        ],
      },
      {
        title: 'Nhân viên xưởng',
        items: [
          {
            keys: ['production:deliver'],
            label: 'Tạo phiếu giao hàng từ xưởng',
            hint: 'Tài khoản phải gắn với một xưởng; chỉ thấy yêu cầu của xưởng mình',
          },
        ],
      },
    ],
  },
]
