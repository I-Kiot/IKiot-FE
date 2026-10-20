"use client";

// Đầu trang dashboard: lời chào theo buổi, ngày hôm nay, bộ chọn kỳ (có lịch tuỳ chỉnh) và nút làm mới.

import { useState } from "react";
import { CalendarDays, RefreshCw } from "lucide-react";
import { vi } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useAuth } from "@/hooks/use-auth";
import { useOverview } from "./overview-provider";
import { formatDayVi, PRESET_OPTIONS, todayLocal, type OverviewPreset } from "../shared/overview-range";

/** Buổi trong ngày theo giờ Việt Nam. */
function greetingOf(now: Date): string {
  const hour = Number(
    now.toLocaleString("en-GB", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", hour12: false }),
  );
  if (hour < 11) return "Chào buổi sáng";
  if (hour < 14) return "Chào buổi trưa";
  if (hour < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

/** "Thứ Ba, 20/10/2026". */
function longDateOf(now: Date): string {
  const text = now.toLocaleDateString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** `Date` của lịch (giờ máy) → `YYYY-MM-DD` theo đúng ngày người dùng đã bấm. */
function dayOf(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function dateOf(day: string): Date {
  return new Date(Number(day.slice(0, 4)), Number(day.slice(5, 7)) - 1, Number(day.slice(8, 10)));
}

export function DashboardHeader() {
  const { user } = useAuth();
  const { range, resolved, setRange, refresh, liveVersion } = useOverview();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [draft, setDraft] = useState<DateRange | undefined>(undefined);

  const now = new Date();
  const name = user?.profile?.firstName?.trim() || user?.profile?.lastName?.trim() || "";
  const today = dateOf(todayLocal());

  const openPicker = (open: boolean) => {
    setPickerOpen(open);
    if (open) setDraft({ from: dateOf(resolved.fromDate), to: dateOf(resolved.toDate) });
  };

  const applyCustom = () => {
    if (!draft?.from) return;
    const from = dayOf(draft.from);
    const to = dayOf(draft.to ?? draft.from);
    setRange({ preset: "custom", from, to });
    setPickerOpen(false);
  };

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">
          {greetingOf(now)}
          {name ? `, ${name}` : ""}!
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {longDateOf(now)} · Đây là tình hình kinh doanh của cửa hàng bạn.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <ToggleGroup
          type="single"
          variant="outline"
          value={range.preset === "custom" ? "" : range.preset}
          onValueChange={(value) => {
            // Bấm lại vào lựa chọn đang bật trả về "" - giữ nguyên kỳ, không bỏ chọn.
            if (value) setRange({ preset: value as OverviewPreset });
          }}
          aria-label="Chọn kỳ báo cáo"
        >
          {PRESET_OPTIONS.map((option) => (
            <ToggleGroupItem
              key={option.value}
              value={option.value}
              className="cursor-pointer px-3 data-[state=on]:bg-orange-500/10 data-[state=on]:text-orange-700 dark:data-[state=on]:text-orange-300"
            >
              {option.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <Popover open={pickerOpen} onOpenChange={openPicker}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={
                range.preset === "custom"
                  ? "cursor-pointer border-orange-500/40 bg-orange-500/10 text-orange-700 dark:text-orange-300"
                  : "cursor-pointer"
              }
            >
              <CalendarDays className="size-4" />
              {range.preset === "custom"
                ? `${formatDayVi(resolved.fromDate)} – ${formatDayVi(resolved.toDate)}`
                : "Tuỳ chỉnh"}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-auto p-0">
            <Calendar
              mode="range"
              locale={vi}
              numberOfMonths={2}
              selected={draft}
              onSelect={setDraft}
              defaultMonth={draft?.from}
              disabled={{ after: today }}
            />
            <div className="flex items-center justify-end gap-2 border-t p-3">
              <Button variant="ghost" size="sm" onClick={() => setPickerOpen(false)}>
                Huỷ
              </Button>
              <Button size="sm" onClick={applyCustom} disabled={!draft?.from}>
                Áp dụng
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <Button
          variant="outline"
          size="icon"
          onClick={refresh}
          aria-label="Làm mới số liệu"
          title="Làm mới số liệu"
          className="cursor-pointer"
        >
          {/* Xoay một vòng mỗi lần làm mới để người dùng thấy bấm đã có tác dụng. */}
          <RefreshCw key={liveVersion} className="size-4 motion-safe:animate-[spin_0.6s_ease-out_1]" />
        </Button>
      </div>
    </div>
  );
}
