"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  calculateLeaveDays,
  combineLeaveDateTime,
  getScheduleWarningData,
  todayIsoDate,
} from "@/lib/api/leave-request-mapper";
import { workingScheduleApi } from "@/lib/api/schedule";
import { eachDayOfInterval, format, parseISO } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { useLeaveRequests } from "./leave-requests-provider";
import { EmptyOptionsNotice, EmptyOptionsLink } from "@/components/empty-options-notice";

const emergencyLeaveBaseSchema = z.object({
  userId: z.string().min(1, "Vui lòng chọn nhân viên"),
  reason: z.string().min(3, "Lý do nghỉ tối thiểu 3 ký tự"),
  startDate: z.string().min(1, "Vui lòng chọn ngày bắt đầu"),
  startTime: z.string().min(1, "Vui lòng chọn giờ bắt đầu"),
  endDate: z.string().min(1, "Vui lòng chọn ngày kết thúc"),
  endTime: z.string().min(1, "Vui lòng chọn giờ kết thúc"),
  approveImmediately: z.boolean(),
  paidLeaveDays: z.number().min(0, "Không được âm"),
  unpaidLeaveDays: z.number().min(0, "Không được âm"),
  reviewNote: z.string().optional(),
});

function buildEmergencyLeaveSchema(opts: {
  allowedStaffIds: Set<string>;
  totalDays: number;
}) {
  return emergencyLeaveBaseSchema
    .refine(
      (values) =>
        new Date(combineLeaveDateTime(values.startDate, values.startTime)) <=
        new Date(combineLeaveDateTime(values.endDate, values.endTime)),
      {
        message: "Thời điểm bắt đầu phải trước hoặc bằng thời điểm kết thúc",
        path: ["endTime"],
      },
    )
    .refine(
      (values) => {
        if (!values.approveImmediately) return true;
        return values.paidLeaveDays + values.unpaidLeaveDays > 0;
      },
      {
        message: "Tổng ngày có lương + không lương phải lớn hơn 0",
        path: ["paidLeaveDays"],
      },
    )
    .superRefine((values, ctx) => {
      if (!opts.allowedStaffIds.has(values.userId)) {
        ctx.addIssue({
          code: "custom",
          path: ["userId"],
          message: "Vui lòng chọn nhân viên hợp lệ trong danh sách",
        });
      }
      if (!values.approveImmediately) return;
      const sum = values.paidLeaveDays + values.unpaidLeaveDays;
      if (opts.totalDays > 0 && sum > opts.totalDays) {
        ctx.addIssue({
          code: "custom",
          path: ["paidLeaveDays"],
          message: `Tổng ngày duyệt không được vượt quá ${opts.totalDays} ngày xin nghỉ`,
        });
      }
    });
}

type EmergencyLeaveFormValues = z.infer<typeof emergencyLeaveBaseSchema>;

const DEFAULT_START_TIME = "08:00";
const DEFAULT_END_TIME = "17:00";

function buildEmptyValues(
  staffOptions: { value: string; label: string }[],
): EmergencyLeaveFormValues {
  const today = todayIsoDate();
  return {
    userId: staffOptions[0]?.value ?? "",
    reason: "",
    startDate: today,
    startTime: DEFAULT_START_TIME,
    endDate: today,
    endTime: DEFAULT_END_TIME,
    approveImmediately: false,
    paidLeaveDays: 1,
    unpaidLeaveDays: 0,
    reviewNote: "",
  };
}

export function LeaveRequestsEmergencyDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
}) {
  const { user } = useAuth();
  const { handleCreateEmergency, staffOptions } = useLeaveRequests();
  // Posted at a location ⇒ the people you may file for are the ones there.
  const isPosted = Boolean(user?.branchId || user?.warehouseId);

  const allowedStaffIds = useMemo(
    () => new Set(staffOptions.map((o) => o.value)),
    [staffOptions],
  );
  const schemaRef = useRef(
    buildEmergencyLeaveSchema({
      allowedStaffIds,
      totalDays: 1,
    }),
  );

  const form = useForm<EmergencyLeaveFormValues>({
    resolver: (values, context, options) =>
      zodResolver(schemaRef.current)(values, context, options),
    defaultValues: buildEmptyValues(staffOptions),
  });

  const approveImmediately = form.watch("approveImmediately");
  const startDate = form.watch("startDate");
  const endDate = form.watch("endDate");
  const userId = form.watch("userId");
  const totalDays = calculateLeaveDays(
    startDate || todayIsoDate(),
    endDate || todayIsoDate(),
  );

  const emergencyLeaveSchema = useMemo(
    () =>
      buildEmergencyLeaveSchema({
        allowedStaffIds,
        totalDays,
      }),
    [allowedStaffIds, totalDays],
  );
  schemaRef.current = emergencyLeaveSchema;
  const [checkingSchedule, setCheckingSchedule] = useState(false);
  const [missingScheduleDates, setMissingScheduleDates] = useState<Date[]>([]);
  const [totalDaysInRange, setTotalDaysInRange] = useState(0);

  useEffect(() => {
    if (open) {
      form.reset(buildEmptyValues(staffOptions));
      setMissingScheduleDates([]);
    }
  }, [open, form, staffOptions]);

  useEffect(() => {
    if (!approveImmediately) return;
    form.setValue("paidLeaveDays", totalDays);
    form.setValue("unpaidLeaveDays", 0);
  }, [approveImmediately, totalDays, form]);

  useEffect(() => {
    if (!open || !startDate || !endDate || !userId) return;
    if (
      new Date(combineLeaveDateTime(startDate, "00:00")) >
      new Date(combineLeaveDateTime(endDate, "23:59"))
    ) {
      setMissingScheduleDates([]);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setCheckingSchedule(true);
      try {
        const result = await workingScheduleApi.getList({
          userId,
          startDate,
          endDate,
          limit: 500,
        });
        if (cancelled) return;

        const scheduledDates = new Set(
          result.data.map((s) => s.workDate.slice(0, 10)),
        );
        const allDates = eachDayOfInterval({
          start: parseISO(startDate),
          end: parseISO(endDate),
        });
        setMissingScheduleDates(
          allDates.filter((d) => !scheduledDates.has(format(d, "yyyy-MM-dd"))),
        );
        setTotalDaysInRange(allDates.length);
      } catch {
        if (!cancelled) setMissingScheduleDates([]);
      } finally {
        if (!cancelled) setCheckingSchedule(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [open, userId, startDate, endDate]);

  async function onSubmit(values: EmergencyLeaveFormValues) {
    try {
      await handleCreateEmergency(
        {
          userId: values.userId,
          startDate: combineLeaveDateTime(values.startDate, values.startTime),
          endDate: combineLeaveDateTime(values.endDate, values.endTime),
          reason: values.reason,
        },
        values.approveImmediately
          ? {
              approveImmediately: {
                paidLeaveDays: values.paidLeaveDays,
                unpaidLeaveDays: values.unpaidLeaveDays,
                reviewNote: values.reviewNote,
              },
            }
          : undefined,
      );
      onOpenChange(false);
    } catch {
      // toast handled in provider
    }
  }

  const scheduleWarning =
    missingScheduleDates.length > 0 && !checkingSchedule
      ? getScheduleWarningData(missingScheduleDates, totalDaysInRange)
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Tạo đơn nghỉ phép khẩn</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nhân viên</FormLabel>
                  {staffOptions.length === 0 ? (
                    <EmptyOptionsNotice>
                      Chưa có nhân viên nào để tạo đơn nghỉ phép. Hãy thêm nhân
                      viên ở{" "}
                      <EmptyOptionsLink href="/staffs">
                        Nhân viên › Danh sách
                      </EmptyOptionsLink>
                      .
                    </EmptyOptionsNotice>
                  ) : (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="cursor-pointer">
                          <SelectValue placeholder="Chọn nhân viên" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {staffOptions.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Từ ngày</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Giờ bắt đầu</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Đến ngày</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Giờ kết thúc</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {scheduleWarning && scheduleWarning.type !== "none" && (
                <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-400">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                  <p>
                    {scheduleWarning.type === "all" && "Nhân viên này không có lịch làm việc trong toàn bộ khoảng ngày đã chọn."}
                    {scheduleWarning.type === "summary" && (
                      <>
                        Có <span className="font-medium">{scheduleWarning.missingCount}/{scheduleWarning.totalCount}</span> ngày nhân viên này không có lịch làm việc.
                      </>
                    )}
                    {scheduleWarning.type === "detailed" && (
                      <>
                        Nhân viên này không có lịch làm việc vào:{" "}
                        <span className="font-medium">{scheduleWarning.formattedRanges}</span>
                      </>
                    )}
                  </p>
                </div>
            )}

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lý do</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Nhập lý do nghỉ phép"
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isPosted && (
              <FormField
                control={form.control}
                name="approveImmediately"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start gap-3 rounded-md border p-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) =>
                          field.onChange(checked === true)
                        }
                        className="mt-0.5"
                      />
                    </FormControl>
                    <div className="space-y-1">
                      <FormLabel className="cursor-pointer">
                        Tạo và duyệt ngay
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            )}

            {approveImmediately && (
              <div className="grid grid-cols-2 gap-4 rounded-md border p-3">
                <FormField
                  control={form.control}
                  name="paidLeaveDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ngày có lương</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          value={field.value}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value || 0))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="unpaidLeaveDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ngày không lương</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          value={field.value}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value || 0))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="reviewNote"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Ghi chú duyệt (tuỳ chọn)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ghi chú..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <p className="col-span-2 text-xs text-muted-foreground">
                  Tổng ngày xin nghỉ: {totalDays} ngày. Tổng có lương + không
                  lương phải ≤ {totalDays}.
                </p>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer"
                onClick={() => onOpenChange(false)}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                className="cursor-pointer"
                disabled={staffOptions.length === 0}
              >
                <Plus className="mr-2 size-4" />
                {approveImmediately ? "Tạo & duyệt" : "Tạo đơn"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
