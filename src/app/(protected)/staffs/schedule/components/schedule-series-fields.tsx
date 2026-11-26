"use client";

import type { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  WEEKDAY_OPTIONS,
  countSeriesDays,
} from "@/app/(protected)/staffs/shared/schedule-series";
import type { ScheduleFormValues } from "./schedule-form-schema";

/** Từ ngày / đến ngày / các thứ trong tuần của một lịch lặp lại. */
export function ScheduleSeriesFields({
  form,
}: {
  form: UseFormReturn<ScheduleFormValues>;
}) {
  const [startDate, endDate, weekdays, userIds] = form.watch([
    "startDate",
    "endDate",
    "weekdays",
    "userIds",
  ]);
  const days = countSeriesDays(startDate, endDate, weekdays);

  return (
    <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="startDate"
          render={({ field }) => (
            <FormItem className="min-w-0">
              <FormLabel>Từ ngày</FormLabel>
              <FormControl>
                <Input type="date" className="w-full" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="endDate"
          render={({ field }) => (
            <FormItem className="min-w-0">
              <FormLabel>Đến ngày</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  className="w-full"
                  min={startDate || undefined}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="weekdays"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Làm vào các thứ</FormLabel>
            <FormControl>
              <ToggleGroup
                type="multiple"
                variant="outline"
                className="flex-wrap justify-start"
                value={field.value.map(String)}
                onValueChange={(values) => field.onChange(values.map(Number))}
              >
                {WEEKDAY_OPTIONS.map((option) => (
                  <ToggleGroupItem
                    key={option.value}
                    value={String(option.value)}
                    className="min-w-10 cursor-pointer data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                    aria-label={option.label}
                  >
                    {option.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {days > 0 && (
        <p className="text-xs text-muted-foreground">
          Sẽ tạo {days} ca
          {userIds.length > 1 ? ` cho mỗi người (${userIds.length} nhân viên)` : ""}.
          Ngày nhân viên đã có đúng ca này sẽ được bỏ qua.
        </p>
      )}
    </div>
  );
}
