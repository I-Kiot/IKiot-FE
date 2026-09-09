"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type ScheduleStaffOption = {
  value: string;
  label: string;
  branchId: string;
  branchName: string;
  phone: string;
};

type ScheduleStaffPickerProps = {
  options: ScheduleStaffOption[];
  value: string[];
  onChange: (userIds: string[]) => void;
  requireBranchFilter?: boolean;
  initialBranchId?: string;
};

const ALL_BRANCHES = "all";
const MAX_VISIBLE_ROWS = 6;
const LIST_MAX_HEIGHT_PX = MAX_VISIBLE_ROWS * 36;

export function ScheduleStaffPicker({
  options,
  value,
  onChange,
  requireBranchFilter = false,
  initialBranchId,
}: ScheduleStaffPickerProps) {
  const [branchFilter, setBranchFilter] = useState(() => {
    if (initialBranchId) return initialBranchId;
    return requireBranchFilter ? "" : ALL_BRANCHES;
  });
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!requireBranchFilter || branchFilter || !initialBranchId) return;
    setBranchFilter(initialBranchId);
  }, [requireBranchFilter, branchFilter, initialBranchId]);

  const branchOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const option of options) {
      if (!option.branchId) continue;
      map.set(
        option.branchId,
        option.branchName && option.branchName !== "-"
          ? option.branchName
          : "Chi nhánh",
      );
    }
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "vi"));
  }, [options]);

  const needsBranch = requireBranchFilter && !branchFilter;
  const needle = search.trim().toLowerCase();

  const visibleOptions = useMemo(() => {
    if (needsBranch) return [];
    return options.filter((option) => {
      if (
        branchFilter &&
        branchFilter !== ALL_BRANCHES &&
        option.branchId !== branchFilter
      ) {
        return false;
      }
      if (!needle) return true;
      return (
        option.label.toLowerCase().includes(needle) ||
        option.phone.toLowerCase().includes(needle)
      );
    });
  }, [options, branchFilter, needsBranch, needle]);

  const selectedSet = useMemo(() => new Set(value), [value]);
  const visibleIds = useMemo(
    () => visibleOptions.map((option) => option.value),
    [visibleOptions],
  );
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedSet.has(id));

  function toggleUser(userId: string, checked: boolean) {
    if (checked) {
      if (selectedSet.has(userId)) return;
      onChange([...value, userId]);
      return;
    }
    onChange(value.filter((id) => id !== userId));
  }

  function toggleVisible(selectAll: boolean) {
    if (selectAll) {
      const next = new Set(value);
      for (const id of visibleIds) next.add(id);
      onChange(Array.from(next));
      return;
    }
    const remove = new Set(visibleIds);
    onChange(value.filter((id) => !remove.has(id)));
  }

  return (
    <div className="space-y-2">
      {requireBranchFilter && (
        <Select
          value={branchFilter || undefined}
          onValueChange={setBranchFilter}
        >
          <SelectTrigger className="w-full cursor-pointer">
            <SelectValue placeholder="Chọn chi nhánh" />
          </SelectTrigger>
          <SelectContent>
            {branchOptions.map((branch) => (
              <SelectItem key={branch.id} value={branch.id}>
                {branch.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {!requireBranchFilter && branchOptions.length > 1 && (
        <Select value={branchFilter} onValueChange={setBranchFilter}>
          <SelectTrigger className="w-full cursor-pointer">
            <SelectValue placeholder="Chi nhánh" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_BRANCHES}>Tất cả chi nhánh</SelectItem>
            {branchOptions.map((branch) => (
              <SelectItem key={branch.id} value={branch.id}>
                {branch.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {!needsBranch && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm tên hoặc SĐT"
            className="h-9 pl-9"
          />
        </div>
      )}

      {needsBranch ? (
        <div className="rounded-md border border-dashed px-3 py-8 text-center text-sm text-muted-foreground">
          Chọn chi nhánh để xem nhân viên.
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              {visibleOptions.length} nhân viên
              {value.length > 0 ? ` · đã chọn ${value.length}` : ""}
            </p>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 cursor-pointer px-2 text-xs"
                disabled={visibleIds.length === 0}
                onClick={() => toggleVisible(!allVisibleSelected)}
              >
                {allVisibleSelected ? "Bỏ chọn" : "Chọn tất cả"}
              </Button>
              {value.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 cursor-pointer px-2 text-xs"
                  onClick={() => onChange([])}
                >
                  Xóa chọn
                </Button>
              )}
            </div>
          </div>

          <div
            className="space-y-1 overflow-y-auto overscroll-contain rounded-md border p-2"
            style={{ maxHeight: LIST_MAX_HEIGHT_PX }}
          >
            {visibleOptions.length === 0 ? (
              <p className="px-1 py-6 text-center text-sm text-muted-foreground">
                Không có nhân viên phù hợp.
              </p>
            ) : (
              visibleOptions.map((item) => {
                const checked = selectedSet.has(item.value);
                return (
                  <label
                    key={item.value}
                    className={cn(
                      "flex h-9 cursor-pointer items-center gap-2 rounded-md px-2 text-sm hover:bg-muted/60",
                      checked && "bg-primary/5",
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(next) =>
                        toggleUser(item.value, Boolean(next))
                      }
                    />
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  </label>
                );
              })
            )}
          </div>

          {visibleOptions.length > MAX_VISIBLE_ROWS && (
            <p className="text-[11px] text-muted-foreground">
              Cuộn để xem thêm {visibleOptions.length - MAX_VISIBLE_ROWS} người.
            </p>
          )}
        </>
      )}
    </div>
  );
}
