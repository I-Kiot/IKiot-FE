// [Hook – Permission sections]
import { useMemo } from 'react'
import { Boxes } from 'lucide-react'
import type { PermissionResourceGroup } from '@/types/role'
import {
  OTHER_SECTION_ID,
  PERMISSION_SECTIONS,
  type PermissionSection,
} from '../_constants/permission-sections'
import { actionLabel, permissionKey } from '../_types/role.types'

export type ResolvedSection = PermissionSection & { keys: string[] }

/**
 * Ghép cấu hình nhóm với danh mục thật BE trả về: bỏ quyền không còn trong danh mục (hoặc thuộc bộ quyền cơ
 * bản BE đã lọc), lấy mô tả BE làm `hint` khi có, và gom mọi quyền chưa được xếp vào nhóm "Khác".
 */
export function usePermissionSections(groups: PermissionResourceGroup[]) {
  return useMemo(() => {
    const available = new Map<string, { group: PermissionResourceGroup; action: string }>()
    for (const group of groups) {
      for (const action of group.actions) {
        available.set(permissionKey(group.resource, action), { group, action })
      }
    }

    const placed = new Set<string>()
    const sections: ResolvedSection[] = []
    for (const section of PERMISSION_SECTIONS) {
      const blocks = section.blocks
        .map((block) => ({
          ...block,
          items: block.items
            .filter((item) => available.has(item.key))
            .map((item) => {
              placed.add(item.key)
              const { group, action } = available.get(item.key)!
              return { ...item, hint: group.descriptions[action] ?? item.hint }
            }),
        }))
        .filter((block) => block.items.length > 0)
      if (blocks.length === 0) continue
      sections.push({
        ...section,
        blocks,
        keys: blocks.flatMap((block) => block.items.map((item) => item.key)),
      })
    }

    // Phần còn lại, gom theo tài nguyên như danh mục gốc.
    const otherBlocks = groups
      .map((group) => ({
        title: group.label,
        items: group.actions
          .map((action) => ({
            key: permissionKey(group.resource, action),
            label: actionLabel(action, group.resource),
            hint: group.descriptions[action],
          }))
          .filter((item) => !placed.has(item.key)),
      }))
      .filter((block) => block.items.length > 0)
    if (otherBlocks.length > 0) {
      sections.push({
        id: OTHER_SECTION_ID,
        title: 'Khác',
        summary:
          'Quyền chưa gắn với màn hình nào đang dùng, hoặc dành cho tính năng sắp có. Thường không cần chọn.',
        icon: Boxes,
        blocks: otherBlocks,
        keys: otherBlocks.flatMap((block) => block.items.map((item) => item.key)),
      })
    }

    return {
      sections,
      allKeys: sections.flatMap((section) => section.keys),
    }
  }, [groups])
}
