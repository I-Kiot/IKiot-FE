"use client";

import { Loader2, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHolidays } from "./holidays-provider";

export function HolidaysButtonGroup() {
  const { setOpen, isSyncing, handleSyncVietnam } = useHolidays();

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="cursor-pointer"
        disabled={isSyncing}
        onClick={() => void handleSyncVietnam()}
      >
        {isSyncing ? (
          <Loader2 className="mr-2 size-4 animate-spin" />
        ) : (
          <RefreshCw className="mr-2 size-4" />
        )}
        Sync VN năm hiện tại
      </Button>
      <Button
        type="button"
        size="sm"
        className="cursor-pointer"
        onClick={() => setOpen("add")}
      >
        <Plus className="mr-2 size-4" />
        Thêm ngày lễ
      </Button>
    </div>
  );
}
