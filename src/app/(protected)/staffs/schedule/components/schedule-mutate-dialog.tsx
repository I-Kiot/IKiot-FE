"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { endOfMonth, format } from "date-fns";
import { Pencil, Plus, Repeat } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getSessionRole } from "@/lib/auth";
import { getVietnamDateString } from "@/app/(protected)/staffs/shared/vietnam-datetime";
import { DEFAULT_SERIES_WEEKDAYS } from "@/app/(protected)/staffs/shared/schedule-series";
import type { WorkingSchedule } from "@/types/working-schedule";
import { ScheduleStaffPicker } from "./schedule-staff-picker";
import { useSchedule } from "./schedule-provider";
import { ScheduleSeriesFields } from "./schedule-series-fields";
import {
  scheduleFormSchema,
  type ScheduleFormValues,
} from "./schedule-form-schema";
import { EmptyOptionsNotice } from "@/components/empty-options-notice";

function getAddDefaults(): ScheduleFormValues {
  const today = getVietnamDateString();
  return {
    userIds: [],
    shiftTemplateId: "",
    repeat: false,
    workDate: today,
    startDate: today,
    endDate: format(endOfMonth(new Date(`${today}T00:00:00`)), "yyyy-MM-dd"),
    weekdays: DEFAULT_SERIES_WEEKDAYS,
  };
}

function getEditDefaults(schedule: WorkingSchedule): ScheduleFormValues {
  return {
    ...getAddDefaults(),
    userIds: schedule.assignees.map((assignee) => assignee.userId),
    shiftTemplateId: schedule.shiftTemplateId,
    workDate: schedule.workDate.slice(0, 10),
  };
}

export function ScheduleMutateDialog({
  open,
  onOpenChange,
  mode = "add",
  currentRow,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  mode?: "add" | "edit";
  currentRow?: WorkingSchedule | null;
}) {
  const isEdit = mode === "edit" && Boolean(currentRow);
  const {
    handleAdd,
    handleAddSeries,
    handleEdit,
    shiftTemplateOptions,
    staffOptions,
    setOpen,
  } = useSchedule();
  const isTenantOwner = getSessionRole() === "TENANT_OWNER";

  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: getAddDefaults(),
  });
  const repeat = form.watch("repeat");

  useEffect(() => {
    if (!open) return;

    if (isEdit && currentRow) {
      form.reset(getEditDefaults(currentRow));
      return;
    }

    form.reset(getAddDefaults());
  }, [open, isEdit, currentRow, form]);

  async function onSubmit(values: ScheduleFormValues) {
    const payload = {
      userId: values.userIds,
      shiftTemplateId: values.shiftTemplateId,
      workDate: values.workDate,
    };

    try {
      if (isEdit && currentRow) {
        await handleEdit(currentRow.id, payload);
      } else if (values.repeat) {
        await handleAddSeries({
          userId: values.userIds,
          shiftTemplateId: values.shiftTemplateId,
          startDate: values.startDate,
          endDate: values.endDate,
          weekdays: values.weekdays,
        });
      } else {
        await handleAdd(payload);
      }
      onOpenChange(false);
    } catch {
      // Provider đã toast lỗi.
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Sửa ca làm việc" : "Phân ca làm việc"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="userIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nhân viên</FormLabel>
                  {staffOptions.length > 0 ? (
                    <ScheduleStaffPicker
                      key={
                        isEdit && currentRow
                          ? `edit-${currentRow.id}`
                          : open
                            ? "add"
                            : "closed"
                      }
                      options={staffOptions}
                      value={field.value}
                      onChange={field.onChange}
                      requireBranchFilter={isTenantOwner}
                      initialBranchId={
                        isEdit
                          ? currentRow?.assignees.find((a) => a.branchId)
                              ?.branchId
                          : undefined
                      }
                    />
                  ) : (
                    <FormControl>
                      <Input
                        placeholder="Nhập ID nhân viên (phân cách bằng dấu phẩy)"
                        value={field.value.join(",")}
                        onChange={(event) => {
                          const ids = event.target.value
                            .split(",")
                            .map((id) => id.trim())
                            .filter(Boolean);
                          field.onChange(ids);
                        }}
                      />
                    </FormControl>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="shiftTemplateId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ca làm</FormLabel>
                  {shiftTemplateOptions.length > 0 ? (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="cursor-pointer w-full">
                          <SelectValue placeholder="Chọn ca làm" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {shiftTemplateOptions.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <EmptyOptionsNotice>
                      Chưa có ca mẫu.{" "}
                      <button
                        type="button"
                        className="text-primary underline cursor-pointer"
                        onClick={() => {
                          onOpenChange(false);
                          setOpen("shiftTemplate");
                        }}
                      >
                        Tạo ca mẫu
                      </button>
                    </EmptyOptionsNotice>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isEdit && (
              <FormField
                control={form.control}
                name="repeat"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between gap-4 rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="flex items-center gap-2">
                        <Repeat className="size-4" />
                        Lặp lại theo khoảng ngày
                      </FormLabel>
                      <p className="text-xs text-muted-foreground">
                        Nhân viên giữ ca này từ ngày đến ngày, vào các thứ đã chọn.
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="cursor-pointer"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}

            {repeat && !isEdit ? (
              <ScheduleSeriesFields form={form} />
            ) : (
              <FormField
                control={form.control}
                name="workDate"
                render={({ field }) => (
                  <FormItem className="min-w-0 sm:max-w-[240px]">
                    <FormLabel>Ngày làm</FormLabel>
                    <FormControl>
                      <Input type="date" className="w-full" {...field} />
                    </FormControl>
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
                disabled={
                  form.formState.isSubmitting ||
                  shiftTemplateOptions.length === 0
                }
              >
                {isEdit ? (
                  <>
                    <Pencil className="mr-2 size-4" />
                    Lưu thay đổi
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 size-4" />
                    {repeat ? "Tạo lịch lặp" : "Phân ca"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
