// [Types – Roles feature]
import { z } from 'zod'

export type RolesDialogType = 'add' | 'edit' | 'delete'

export const roleFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Tên vai trò là bắt buộc')
    .max(60, 'Tên vai trò tối đa 60 ký tự'),
  description: z.string().trim().max(255, 'Mô tả tối đa 255 ký tự').optional(),
  // Mỗi phần tử là "resource:action" - một chuỗi khoá cho mọi thứ trong bộ chọn, dễ đưa
  // vào Set hơn hẳn so với mảng object. Chỉ tách lại thành cặp ở đúng lúc gửi API.
  permissionKeys: z.array(z.string()).min(1, 'Chọn ít nhất một quyền'),
})

export type RoleFormValues = z.infer<typeof roleFormSchema>

export const permissionKey = (resource: string, action: string) =>
  `${resource}:${action}`

export function splitPermissionKey(key: string) {
  const at = key.indexOf(':')
  return { resource: key.slice(0, at), action: key.slice(at + 1) }
}

/**
 * Nhãn tiếng Việt cho từng hành động.
 *
 * Danh mục quyền của backend chỉ kèm nhãn cho *tài nguyên* (`label`), còn `action` là mã
 * thô. 29 mã dưới đây là toàn bộ những gì `prisma/seed.ts` phát ra; mã lạ rơi về chính nó
 * chứ không bị ẩn - một quyền không đọc được vẫn phải chọn được, còn hơn là biến mất khỏi
 * màn hình phân quyền.
 */
export const ACTION_LABELS: Record<string, string> = {
  create: 'Tạo mới',
  read: 'Xem',
  update: 'Sửa',
  delete: 'Xóa',
  read_own: 'Xem của mình',
  read_mine: 'Xem của mình',
  read_all: 'Xem tất cả',
  view_all: 'Xem toàn bộ',
  readBR: 'Xem theo chi nhánh',
  readWH: 'Xem theo kho',
  manage: 'Quản lý',
  approve: 'Duyệt',
  reject: 'Từ chối',
  cancel: 'Hủy',
  open: 'Mở ca',
  finalize: 'Chốt ca',
  report: 'Ghi phiếu ca',
  assign_manager: 'Chỉ định quản lý',
  assign_role: 'Gán vai trò',
  create_staff: 'Tạo nhân viên',
  create_emergency: 'Tạo đơn khẩn',
  pay_offline: 'Thu tiền mặt',
  pay_debt: 'Trả công nợ',
  receive: 'Nhận hàng',
  apply: 'Áp dụng',
  calculate: 'Tính thử',
  export: 'Xuất dữ liệu',
  suspend: 'Tạm khóa',
  inactive: 'Ngừng hoạt động',
}

export const actionLabel = (action: string) => ACTION_LABELS[action] ?? action
