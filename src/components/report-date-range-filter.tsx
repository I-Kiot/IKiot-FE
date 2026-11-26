"use client"

// Bộ lọc khoảng ngày cho trang báo cáo, bấm "Áp dụng" mới đổi kỳ.

import { useState } from "react"
import { CalendarDays } from "lucide-react"
import { vi } from "date-fns/locale"
import type { DateRange } from "react-day-picker"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { formatDayVi } from "@/lib/stats-format"
import {
  MAX_PERIOD_DAYS,
  RANGE_OPTIONS,
  matchPreset,
  periodDays,
  presetPeriod,
  type ReportPeriod,
} from "@/app/(protected)/reports/hooks/use-dashboard-stats"

/** `Date` của lịch (giờ máy) → `YYYY-MM-DD` theo đúng ngày người dùng đã bấm. */
function dayOf(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${date.getFullYear()}-${month}-${day}`
}

function dateOf(day: string): Date {
  return new Date(Number(day.slice(0, 4)), Number(day.slice(5, 7)) - 1, Number(day.slice(8, 10)))
}

interface ReportDateRangeFilterProps {
  period: ReportPeriod
  onChange: (period: ReportPeriod) => void
  className?: string
}

export function ReportDateRangeFilter({ period, onChange, className }: ReportDateRangeFilterProps) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<DateRange | undefined>(undefined)
  const preset = matchPreset(period)
  const today = dateOf(presetPeriod("7d").toDate)

  const draftPeriod: ReportPeriod | null = draft?.from
    ? { fromDate: dayOf(draft.from), toDate: dayOf(draft.to ?? draft.from) }
    : null
  const tooLong = draftPeriod ? periodDays(draftPeriod) > MAX_PERIOD_DAYS : false

  const openPicker = (next: boolean) => {
    setOpen(next)
    if (next) setDraft({ from: dateOf(period.fromDate), to: dateOf(period.toDate) })
  }

  const apply = (next: ReportPeriod) => {
    onChange(next)
    setOpen(false)
  }

  const presetLabel = RANGE_OPTIONS.find((option) => option.value === preset)?.label

  return (
    <Popover open={open} onOpenChange={openPicker}>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn("cursor-pointer justify-start tabular-nums", className)}>
          <CalendarDays className="size-4" />
          {formatDayVi(period.fromDate)} – {formatDayVi(period.toDate)}
          {presetLabel ? <span className="text-muted-foreground">· {presetLabel}</span> : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto max-w-[calc(100vw-2rem)] p-0">
        <div className="flex flex-col sm:flex-row">
          <div className="flex flex-wrap gap-1 border-b p-2 sm:w-36 sm:flex-col sm:flex-nowrap sm:border-r sm:border-b-0">
            {RANGE_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant={preset === option.value ? "secondary" : "ghost"}
                size="sm"
                className="cursor-pointer justify-start"
                onClick={() => apply(presetPeriod(option.value))}
              >
                {option.label}
              </Button>
            ))}
          </div>
          <Calendar
            mode="range"
            locale={vi}
            numberOfMonths={2}
            selected={draft}
            onSelect={setDraft}
            defaultMonth={draft?.from}
            disabled={{ after: today }}
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t p-3">
          <p className={cn("text-xs", tooLong ? "text-destructive" : "text-muted-foreground")}>
            {tooLong
              ? `Chọn tối đa ${MAX_PERIOD_DAYS} ngày`
              : draftPeriod
                ? `${formatDayVi(draftPeriod.fromDate)} – ${formatDayVi(draftPeriod.toDate)} (${periodDays(draftPeriod)} ngày)`
                : "Chọn ngày bắt đầu và ngày kết thúc"}
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Huỷ
            </Button>
            <Button size="sm" onClick={() => draftPeriod && apply(draftPeriod)} disabled={!draftPeriod || tooLong}>
              Áp dụng
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
