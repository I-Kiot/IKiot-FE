//
// Màn Vai trò bày quyền theo công việc người giữ vai trò (bán hàng, quản lý, vận chuyển & kho, xưởng), không theo bảng tài nguyên × hành động của BE. Chỉ là cách sắp xếp; chủ shop vẫn tick từng mã.
//
// Một ô có thể bật nhiều mã (`keys`), ví dụ "Quản lý sản phẩm" = tạo + sửa + xoá. Mã BE giữ nguyên; khi BE gộp mã thật thì chỉ sửa file này.
// `requires`: tick ô kéo theo quyền xem cần để mở màn hình (bỏ tick không gỡ chúng).
//
// Quyền có trong danh mục mà không có ở đây vẫn hiện ở nhóm "Khác" (`OTHER_SECTION_ID`), nên quyền mới của BE không biến mất.
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
 * Tài nguyên hiện ở nhóm "Khác" (chốt 2026-10-16). Mã chưa xếp nhóm là quyền BE không kiểm tra hoặc chỉ admin nền tảng dùng, nên ẩn; mã ẩn vẫn giữ khi lưu. Tài nguyên mới: xếp nhóm hoặc thêm vào đây.
 */
export const OTHER_SECTION_RESOURCES = ['sales_channels', 'fulfillments', 'users']

/**
 * Quyền nền mọi vai trò đều có: thiếu thì việc chính của nhân viên hỏng, thêm vào không lộ gì quan trọng. Không hiện thành ô, tự thêm khi lưu. Khi BE có `STAFF_BASE_PERMISSIONS` thì bỏ khỏi đây.
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
    title: 'Bán hàng',
    summary: 'Tạo đơn, chăm sóc khách, thu tiền và đứng ca tại cửa hàng.',
    icon: ShoppingBag,
    blocks: [
      {
        title: 'Đơn hàng',
        items: [
          { keys: ['orders:read'], label: 'Xem đơn của chi nhánh mình' },
          {
            keys: ['orders:create', 'promotions:calculate', 'promotions:apply'],
            label: 'Tạo đơn',
            hint: 'Đơn tạo tay và bán tại quầy - gồm áp khuyến mãi. Xem / thêm khách là quyền mặc định của mọi nhân viên',
            requires: ['orders:read', 'promotions:read'],
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
          { keys: ['customers:update'], label: 'Sửa thông tin khách hàng' },
          { keys: ['promotions:read'], label: 'Xem danh sách khuyến mãi' },
          { keys: ['returns:read'], label: 'Xem phiếu hoàn hàng' },
        ],
      },
      {
        title: 'Ca thu ngân',
        // Hai cụm theo người làm: mở / chốt két là việc của người chịu trách nhiệm tiền cả ngày, nhận / bàn giao ca là
        // việc của người đứng quầy. Chủ shop tự quyết ai giữ cụm nào - tách ra để người cầm tiền trong ca không nhất
        // thiết là người xác nhận số tiền cuối ngày.
        items: [
          {
            keys: ['cash_drawers:open', 'cash_drawers:finalize'],
            label: 'Mở két và chốt két cuối ngày',
            hint: 'Đếm tiền đầu ngày khi mở két, đếm lại và chốt két khi đóng ngày',
            // Chốt két của ca người khác làm cần xem được mọi két của chi nhánh, không chỉ két mình đứng.
            requires: ['cash_drawers:read'],
          },
          {
            keys: ['cash_drawers:report'],
            label: 'Nhận ca và bàn giao ca',
            hint: 'Ghi phiếu nhận ca, báo cáo cuối ca và bàn giao két cho người ca sau',
          },
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
          { keys: ['customers:delete'], label: 'Xoá khách hàng' },
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
