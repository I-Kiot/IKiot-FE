"use client";

import { useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useSchedule } from "./schedule-provider";

export function ScheduleMonthPicker({ disabled }: { disabled?: boolean }) {
  const {
    calendarMonth,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    goToMonth,
  } = useSchedule();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center gap-1.5">
      <Button
        variant="outline"
        size="icon"
        className="cursor-pointer size-9 shrink-0"
        onClick={goToPreviousMonth}
        disabled={disabled}
        title="Tháng trước"
      >
        <ChevronLeft className="size-4" />
      </Button>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="cursor-pointer min-w-[168px] font-semibold capitalize"
            disabled={disabled}
          >
            {format(calendarMonth, "MMMM yyyy", { locale: vi })}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={calendarMonth}
            defaultMonth={calendarMonth}
            onSelect={(date) => {
              if (date) {
                goToMonth(date);
                setOpen(false);
              }
            }}
            captionLayout="dropdown"
            fromYear={2020}
            toYear={2035}
            locale={vi}
          />
          <div className="border-t p-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full cursor-pointer"
              onClick={() => {
                goToToday();
                setOpen(false);
              }}
            >
              Về tháng hiện tại
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <Button
        variant="outline"
        size="icon"
        className="cursor-pointer size-9 shrink-0"
        onClick={goToNextMonth}
        disabled={disabled}
        title="Tháng sau"
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
