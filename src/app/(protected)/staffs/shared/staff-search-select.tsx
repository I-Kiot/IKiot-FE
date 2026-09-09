"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Staff } from "@/types/staff";

/** Label hiển thị: Tên · SĐT */
export function formatStaffOptionLabel(staff: Staff): string {
  return `${staff.fullName}${staff.phoneNumber ? ` · ${staff.phoneNumber}` : ""}`;
}

type StaffSearchSelectProps = {
  staff: Staff[];
  value: string;
  onChange: (staffId: string) => void;
  disabled?: boolean;
  loading?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
};

/**
 * Chọn nhân viên trong dialog: ô search + list cố định trong form.
 */
export function StaffSearchSelect({
  staff,
  value,
  onChange,
  disabled = false,
  loading = false,
  placeholder = "Chọn nhân viên",
  searchPlaceholder = "Tìm tên hoặc SĐT...",
  emptyMessage = "Không có nhân viên.",
  className,
}: StaffSearchSelectProps) {
  const [query, setQuery] = useState("");

  const staffKey = useMemo(
    () => staff.map((item) => item.id).join(","),
    [staff],
  );

  useEffect(() => {
    setQuery("");
  }, [staffKey]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return staff;
    return staff.filter((item) => {
      const name = item.fullName.toLowerCase();
      const phone = (item.phoneNumber ?? "").toLowerCase();
      return name.includes(q) || phone.includes(q);
    });
  }, [staff, query]);

  const isInteractive = !disabled && !loading;

  return (
    <div
      className={cn(
        "rounded-md border bg-background",
        !isInteractive && "opacity-60",
        className,
      )}
    >
      <div className="relative border-b px-2.5 py-2">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          disabled={!isInteractive}
          placeholder={searchPlaceholder}
          className="h-8 border-0 bg-transparent pl-8 shadow-none focus-visible:ring-0"
          aria-label={placeholder}
        />
      </div>

      <div className="max-h-[10.5rem] overflow-y-auto overscroll-contain">
        {loading ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            Đang tải...
          </p>
        ) : filtered.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            {staff.length === 0 ? emptyMessage : "Không có kết quả."}
          </p>
        ) : (
          <ul className="p-1" role="listbox" aria-label={placeholder}>
            {filtered.map((item) => {
              const isSelected = item.id === value;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    disabled={!isInteractive}
                    onClick={() => onChange(item.id)}
                    className={cn(
                      "flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-none transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                      "focus-visible:bg-accent focus-visible:text-accent-foreground",
                      isSelected && "bg-accent text-accent-foreground",
                    )}
                  >
                    <Check
                      className={cn(
                        "size-4 shrink-0",
                        isSelected ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span className="min-w-0 flex-1 truncate">
                      {formatStaffOptionLabel(item)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
