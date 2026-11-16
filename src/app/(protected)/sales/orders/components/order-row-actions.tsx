"use client";

import { useState } from "react";
import { Factory, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { warnNoPermission } from "@/components/permission-button";
import { CreateInboundDialog } from "@/app/(protected)/exchange/imports/components/create-inbound-dialog";
import { creatableInboundSources } from "@/app/(protected)/exchange/shared/inbound-source";
import { getSessionRole } from "@/lib/auth";
import { cn } from "@/lib/utils";

/**
 * Menu "⋯" thao tác tắt trên một dòng đơn, để khỏi chuyển qua màn khác.
 * Hiện có: mở popup "Tạo mới" của màn Nhập hàng, mặc định nguồn Xưởng (đơn hết hàng / hàng thiết kế lại).
 */
export function OrderRowActions() {
  const [dialogOpen, setDialogOpen] = useState(false);

  // Cùng luật quyền với nút "Tạo mới" ở màn Nhập hàng.
  const creatable = creatableInboundSources(getSessionRole());
  const canCreateRequest = creatable.includes("WORKSHOP");

  function openDialog() {
    if (!canCreateRequest) {
      warnNoPermission("production_requests:create");
      return;
    }
    setDialogOpen(true);
  }

  return (
    // Dòng bảng mở/đóng khi bấm; sự kiện từ menu và popup (portal vẫn nổi bọt theo cây React) không được lan lên dòng.
    <div onClick={(event) => event.stopPropagation()} className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8 cursor-pointer" aria-label="Thao tác">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onSelect={openDialog}
            className={cn("cursor-pointer", !canCreateRequest && "opacity-50")}
          >
            <Factory className="size-4" />
            Tạo YCSX
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {dialogOpen && (
        <CreateInboundDialog
          defaultSource="WORKSHOP"
          options={creatable}
          onOpenChange={setDialogOpen}
          onImportCreated={() => setDialogOpen(false)}
          onRequestCreated={() => setDialogOpen(false)}
        />
      )}
    </div>
  );
}
