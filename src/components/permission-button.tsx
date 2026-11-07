"use client";

import * as React from "react";
import { toast } from "sonner";
import { PERMISSION_SECTIONS } from "@/app/(protected)/staffs/roles/_constants/permission-sections";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DEFAULT_WHO =
  "Chủ shop, hoặc nhân viên có vai trò được cấp quyền này, mới làm được. Chủ shop cấp quyền ở màn Phân quyền.";

/** Tên quyền đúng như màn Phân quyền hiển thị, để người đọc cảnh báo tìm được ô cần tick. */
function permissionLabel(permission: string): string | undefined {
  for (const section of PERMISSION_SECTIONS) {
    for (const block of section.blocks) {
      const item = block.items.find((candidate) => candidate.keys.includes(permission));
      if (item) return item.label;
    }
  }
  return undefined;
}

/** Báo vì sao không bấm được: cần quyền gì (`resource:action`) và ai làm được. */
export function warnNoPermission(permission?: string, who?: string): void {
  const label = permission ? permissionLabel(permission) : undefined;
  toast.warning(label ? `Bạn cần quyền "${label}"` : "Bạn không làm được thao tác này", {
    description: who ?? DEFAULT_WHO,
  });
}

type PermissionButtonProps = React.ComponentProps<typeof Button> & {
  /** Người đang đăng nhập có bấm được không. */
  allowed: boolean;
  /** Mã `resource:action` để nêu tên quyền. Bỏ trống khi luật không phải một quyền (vd chỉ shipper của lần giao). */
  permission?: string;
  /** Ai làm được, khi khác câu mặc định. */
  who?: string;
};

/**
 * Nút thao tác theo quyền: không có quyền thì vẫn hiện nhưng mờ đi, bấm vào cảnh báo cần quyền gì và ai làm được.
 * Không dùng thuộc tính `disabled` vì trình duyệt nuốt sự kiện click, và ẩn hẳn nút khiến người dùng không biết chức năng này tồn tại.
 */
export function PermissionButton({ allowed, permission, who, onClick, className, disabled, ...props }: PermissionButtonProps) {
  if (allowed) {
    return <Button {...props} className={className} disabled={disabled} onClick={onClick} />;
  }
  return (
    <Button
      {...props}
      aria-disabled
      className={cn(className, "cursor-not-allowed opacity-50 hover:opacity-50")}
      onClick={(event) => {
        // Nút nằm trong dòng bảng mở rộng được, hoặc bọc một Link (asChild): không để click đi tiếp.
        event.preventDefault();
        event.stopPropagation();
        warnNoPermission(permission, who);
      }}
    />
  );
}
