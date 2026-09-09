"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { leaveRequestApi } from "@/lib/api/leave-request";
import {
  combineLeaveDateTime,
  getScheduleWarningData,
  todayIsoDate,
} from "@/lib/api/leave-request-mapper";
import { workingScheduleApi } from "@/lib/api/schedule";
import { eachDayOfInterval, format, parseISO } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { useLeaveRequests } from "./leave-requests-provider";

const personalLeaveBaseSchema = z.object({
  reason: z.string().min(3, "Lý do nghỉ tối thiểu 3 ký tự"),
  startDate: z.string().min(1, "Vui lòng chọn ngày bắt đầu"),
  startTime: z.string().min(1, "Vui lòng chọn giờ bắt đầu"),
  endDate: z.string().min(1, "Vui lòng chọn ngày kết thúc"),
  endTime: z.string().min(1, "Vui lòng chọn giờ kết thúc"),
  handoverToUserId: z.string().optional(),
});

function buildPersonalLeaveSchema(opts: {
  handoverRequired: boolean;
  isBranchManager: boolean;
  allowedHandoverIds: Set<string>;
}) {
  return personalLeaveBaseSchema
    .refine(
      (values) =>
        new Date(combineLeaveDateTime(values.startDate, values.startTime)) <=
        new Date(combineLeaveDateTime(values.endDate, values.endTime)),
      {
        message: "Thời điểm bắt đầu phải trước hoặc bằng thời điểm kết thúc",
        path: ["endTime"],
      },
    )
    .superRefine((values, ctx) => {
      if (!opts.handoverRequired) return;
      const id = values.handoverToUserId?.trim() ?? "";
      if (!id) {
        ctx.addIssue({
          code: "custom",
          path: ["handoverToUserId"],
          message: opts.isBranchManager
            ? "Vui lòng chọn nhân viên thay thế tạm trong thời gian nghỉ"
            : "Vui lòng chọn nhân viên nhận bàn giao lịch",
        });
        return;
      }
      if (!opts.allowedHandoverIds.has(id)) {
        ctx.addIssue({
          code: "custom",
          path: ["handoverToUserId"],
          message: opts.isBranchManager
            ? "Nhân viên thay thế phải là Staff thuộc chi nhánh của bạn"
            : "Nhân viên bàn giao không hợp lệ",
        });
      }
    });
}

type PersonalLeaveFormValues = z.infer<typeof personalLeaveBaseSchema>;

const DEFAULT_START_TIME = "08:00";
const DEFAULT_END_TIME = "17:00";

export function LeaveRequestsPersonalDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
}) {
  const { user } = useAuth();
  const { handleCreatePersonal, handoverOptions, balance } = useLeaveRequests();
  // A handover is needed when this person actually runs shifts in the window - which
  // `scheduleHandoverRequired` below asks the server. Being posted somewhere is what makes
  // that possible at all; the old test asked for two role names nobody carries, so the
  // picker stopped appearing and the mandatory-handover branch of the schema went with it.
  const isPosted = Boolean(user?.branchId || user?.warehouseId);
  const needsHandoverPicker = isPosted;

  const [scheduleHandoverRequired, setScheduleHandoverRequired] = useState(false);
  const [checkingHandover, setCheckingHandover] = useState(false);
  const [checkingSchedule, setCheckingSchedule] = useState(false);
  const [missingScheduleDates, setMissingScheduleDates] = useState<Date[]>([]);
  const [totalDaysInRange, setTotalDaysInRange] = useState(0);

  const requiresHandover = scheduleHandoverRequired;
  const allowedHandoverIds = useMemo(
    () => new Set(handoverOptions.map((o) => o.value)),
    [handoverOptions],
  );

  const personalLeaveSchema = useMemo(
    () =>
      buildPersonalLeaveSchema({
        handoverRequired: requiresHandover,
        isBranchManager: requiresHandover,
        allowedHandoverIds,
      }),
    [requiresHandover, allowedHandoverIds],
  );
  const schemaRef = useRef(personalLeaveSchema);
  schemaRef.current = personalLeaveSchema;

  const form = useForm<PersonalLeaveFormValues>({
    resolver: (values, context, options) =>
      zodResolver(schemaRef.current)(values, context, options),
    defaultValues: {
      reason: "",
      startDate: todayIsoDate(),
      startTime: DEFAULT_START_TIME,
      endDate: todayIsoDate(),
      endTime: DEFAULT_END_TIME,
      handoverToUserId: "",
    },
  });

  const startDate = form.watch("startDate");
  const endDate = form.watch("endDate");
  const startTime = form.watch("startTime");
  const endTime = form.watch("endTime");

  useEffect(() => {
    if (open) {
      form.reset({
        reason: "",
        startDate: todayIsoDate(),
        startTime: DEFAULT_START_TIME,
        endDate: todayIsoDate(),
        endTime: DEFAULT_END_TIME,
        handoverToUserId: "",
      });
      setScheduleHandoverRequired(false);
      setMissingScheduleDates([]);
    }
  }, [open, form]);

  useEffect(() => {
    // Hỏi server xem khoảng nghỉ này có ca nào người đó đang quản lý không. Trước đây chỉ
    // hỏi cho WAREHOUSE_MANAGER và mặc định BRANCH_MANAGER là luôn phải bàn giao - cả hai
    // role đều không còn, nên giờ ai được phân công ở đâu đó cũng hỏi.
    if (!open || !isPosted || !startDate || !endDate) return;
    const startIso = combineLeaveDateTime(
      startDate,
      startTime || DEFAULT_START_TIME,
    );
    const endIso = combineLeaveDateTime(endDate, endTime || DEFAULT_END_TIME);
    if (new Date(startIso) > new Date(endIso)) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      setCheckingHandover(true);
      try {
        const preview = await leaveRequestApi.previewHandover(startIso, endIso);
        if (cancelled) return;
        setScheduleHandoverRequired(preview.requiresHandover);
        if (!preview.requiresHandover) {
          form.setValue("handoverToUserId", "");
        }
      } catch {
        if (!cancelled) setScheduleHandoverRequired(false);
      } finally {
        if (!cancelled) setCheckingHandover(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    open,
    isPosted,
    startDate,
    endDate,
    startTime,
    endTime,
    form,
  ]);

  useEffect(() => {
    if (!open || !startDate || !endDate) return;
    if (
      new Date(combineLeaveDateTime(startDate, startTime || DEFAULT_START_TIME)) >
      new Date(combineLeaveDateTime(endDate, endTime || DEFAULT_END_TIME))
    ) {
      setMissingScheduleDates([]);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setCheckingSchedule(true);
      try {
        const result = await workingScheduleApi.getList({
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
  }, [open, startDate, endDate, startTime, endTime]);

  async function onSubmit(values: PersonalLeaveFormValues) {
    try {
      await handleCreatePersonal({
        startDate: combineLeaveDateTime(values.startDate, values.startTime),
        endDate: combineLeaveDateTime(values.endDate, values.endTime),
        reason: values.reason,
        handoverToUserId: values.handoverToUserId || undefined,
      });
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
          <DialogTitle>Xin nghỉ phép</DialogTitle>
        </DialogHeader>

        {balance && (
          <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
            Phép năm còn lại:{" "}
            <span className="font-semibold">
              {balance.remainingDays}/{balance.annualLeaveDays}
            </span>{" "}
            ngày (đã dùng {balance.usedDays})
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    {scheduleWarning.type === "all" && "Bạn không có lịch làm việc trong toàn bộ khoảng ngày này."}
                    {scheduleWarning.type === "summary" && (
                      <>
                        Có <span className="font-medium">{scheduleWarning.missingCount}/{scheduleWarning.totalCount}</span> ngày không có lịch làm việc trong khoảng này.
                      </>
                    )}
                    {scheduleWarning.type === "detailed" && (
                      <>
                        Bạn không có lịch làm việc vào:{" "}
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

            {needsHandoverPicker && (
              <FormField
                control={form.control}
                name="handoverToUserId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {`Nhân viên nhận bàn giao${requiresHandover ? " *" : ""}`}
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || undefined}
                      disabled={
                        checkingHandover || !requiresHandover
                      }
                    >
                      <FormControl>
                        <SelectTrigger className="cursor-pointer">
                          <SelectValue
                            placeholder={
                              checkingHandover
                                ? "Đang kiểm tra lịch..."
                                : requiresHandover
                                  ? "Chọn nhân viên nhận bàn giao"
                                  : "Không cần bàn giao"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {handoverOptions.length === 0 ? (
                          <SelectItem value="__empty" disabled>
                            Không có nhân viên phù hợp
                          </SelectItem>
                        ) : (
                          handoverOptions.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                // Bắt buộc bàn giao mà không còn ai để bàn giao thì không gửi được.
                disabled={requiresHandover && handoverOptions.length === 0}
              >
                <Plus className="mr-2 size-4" />
                Gửi đơn
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
