// [Hook – Permission sections]
import { useMemo } from 'react'
import { Boxes } from 'lucide-react'
import type { PermissionResourceGroup } from '@/types/role'
import {
  ALWAYS_ON_PERMISSIONS,
  OTHER_SECTION_ID,
  PERMISSION_SECTIONS,
  type PermissionItem,
  type PermissionSection,
} from '../_constants/permission-sections'
import { actionLabel, permissionKey } from '../_types/role.types'

export type ResolvedItem = PermissionItem & { id: string }
export type ResolvedBlock = { title: string; items: ResolvedItem[] }
export type ResolvedSection = Omit<PermissionSection, 'blocks'> & {
  blocks: ResolvedBlock[]
  items: ResolvedItem[]
  /** Mọi mã của các ô trong nhóm - cho "chọn cả nhóm". */
  keys: string[]
}

export type CheckState = boolean | 'indeterminate'

/** Ô bật khi đủ mọi mã; thiếu một phần (vai trò cũ, tick lẻ trước khi gộp) là "một phần". */
export function itemState(keys: string[], selected: Set<string>): CheckState {
  const chosen = keys.filter((key) => selected.has(key)).length
  if (chosen === 0) return false
  return chosen === keys.length ? true : 'indeterminate'
}

/**
 * Ghép cấu hình nhóm với danh mục thật BE trả về: bỏ mã không còn trong danh mục (hoặc thuộc bộ quyền cơ
 * bản BE đã lọc), lấy mô tả BE làm `hint` khi có, gom mọi mã chưa được xếp vào nhóm "Khác", và tách riêng
 * các quyền chung (`ALWAYS_ON_PERMISSIONS`) có trong danh mục.
 */
export function usePermissionSections(groups: PermissionResourceGroup[]) {
  return useMemo(() => {
    const available = new Map<string, { group: PermissionResourceGroup; action: string }>()
    for (const group of groups) {
      for (const action of group.actions) {
        available.set(permissionKey(group.resource, action), { group, action })
      }
    }
    const has = (key: string) => available.has(key)

    const alwaysOn = ALWAYS_ON_PERMISSIONS.filter((entry) => has(entry.key))
    const placed = new Set<string>(alwaysOn.map((entry) => entry.key))
    const sections: ResolvedSection[] = []

    for (const section of PERMISSION_SECTIONS) {
      const blocks = section.blocks
        .map((block) => ({
          title: block.title,
          items: block.items
            .map((item) => ({ ...item, keys: item.keys.filter(has), requires: item.requires?.filter(has) }))
            .filter((item) => item.keys.length > 0)
            .map((item) => {
              item.keys.forEach((key) => placed.add(key))
              const first = available.get(item.keys[0])!
              return {
                ...item,
                id: `${section.id}:${item.keys.join('+')}`,
                hint: first.group.descriptions[first.action] ?? item.hint,
              }
            }),
        }))
        .filter((block) => block.items.length > 0)
      if (blocks.length === 0) continue
      const items = blocks.flatMap((block) => block.items)
      sections.push({
        ...section,
        blocks,
        items,
        keys: [...new Set(items.flatMap((item) => item.keys))],
      })
    }

    // Phần còn lại, gom theo tài nguyên như danh mục gốc, mỗi mã một ô.
    const otherBlocks = groups
      .map((group) => ({
        title: group.label,
        items: group.actions
          .map((action) => permissionKey(group.resource, action))
          .filter((key) => !placed.has(key))
          .map((key) => {
            const action = key.slice(key.indexOf(':') + 1)
            return {
              id: `${OTHER_SECTION_ID}:${key}`,
              keys: [key],
              label: actionLabel(action, group.resource),
              hint: group.descriptions[action],
            }
          }),
      }))
      .filter((block) => block.items.length > 0)
    if (otherBlocks.length > 0) {
      const items = otherBlocks.flatMap((block) => block.items)
      sections.push({
        id: OTHER_SECTION_ID,
        title: 'Khác',
        summary:
          'Quyền chưa gắn với màn hình nào đang dùng, hoặc dành cho tính năng sắp có. Thường không cần chọn.',
        icon: Boxes,
        blocks: otherBlocks,
        items,
        keys: items.flatMap((item) => item.keys),
      })
    }

    const allItems = sections.flatMap((section) => section.items)
    return { sections, allItems, alwaysOn }
  }, [groups])
}

/**
 * Bật / tắt một loạt ô. Bật: thêm mã của ô và `requires`. Tắt: chỉ gỡ những mã không còn ô nào khác (đang
 * bật, ngoài các ô vừa tắt) cần đến - một mã có thể thuộc nhiều ô ("Tạo đơn" và "Xem khách hàng" cùng chứa
 * `customers:read`), tắt ô này không được làm hỏng ô kia.
 */
export function toggleItems(
  selected: Set<string>,
  targets: ResolvedItem[],
  checked: boolean,
  allItems: ResolvedItem[],
): string[] {
  const next = new Set(selected)
  if (checked) {
    for (const item of targets) {
      item.keys.forEach((key) => next.add(key))
      item.requires?.forEach((key) => next.add(key))
    }
    return [...next]
  }
  const targetIds = new Set(targets.map((item) => item.id))
  const stillNeeded = new Set(
    allItems
      .filter((item) => !targetIds.has(item.id) && itemState(item.keys, selected) === true)
      .flatMap((item) => item.keys),
  )
  for (const item of targets) {
    item.keys.filter((key) => !stillNeeded.has(key)).forEach((key) => next.delete(key))
  }
  return [...next]
}
