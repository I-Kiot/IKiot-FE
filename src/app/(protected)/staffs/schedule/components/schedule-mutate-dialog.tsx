"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus } from "lucide-react";
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
import { getSessionRole } from "@/lib/auth";
import { getVietnamDateString } from "@/app/(protected)/staffs/shared/vietnam-datetime";
import type { WorkingSchedule } from "@/types/working-schedule";
import { ScheduleStaffPicker } from "./schedule-staff-picker";
import { useSchedule } from "./schedule-provider";
import { EmptyOptionsNotice } from "@/components/empty-options-notice";

const scheduleFormSchema = z.object({
  userIds: z.array(z.string()).min(1, "Vui lòng chọn ít nhất một nhân viên"),
  shiftTemplateId: z.string().min(1, "Vui lòng chọn ca làm"),
  workDate: z.string().min(1, "Vui lòng chọn ngày"),
  scheduleType: z.enum(["NORMAL", "OVERTIME"]),
});

type ScheduleFormValues = z.infer<typeof scheduleFormSchema>;

function getEditDefaults(schedule: WorkingSchedule): ScheduleFormValues {
  return {
    userIds: schedule.assignees.map((assignee) => assignee.userId),
    shiftTemplateId: schedule.shiftTemplateId,
    workDate: schedule.workDate.slice(0, 10),
    scheduleType: schedule.scheduleType === "OVERTIME" ? "OVERTIME" : "NORMAL",
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
  const { handleAdd, handleEdit, shiftTemplateOptions, staffOptions, setOpen } =
    useSchedule();
  const isTenantOwner = getSessionRole() === "TENANT_OWNER";

  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      userIds: [],
      shiftTemplateId: "",
      workDate: getVietnamDateString(),
      scheduleType: "NORMAL",
    },
  });

  useEffect(() => {
    if (!open) return;

    if (isEdit && currentRow) {
      form.reset(getEditDefaults(currentRow));
      return;
    }

    form.reset({
      userIds: [],
      shiftTemplateId: "",
      workDate: getVietnamDateString(),
      scheduleType: "NORMAL",
    });
  }, [open, isEdit, currentRow, form]);

  async function onSubmit(values: ScheduleFormValues) {
    const payload = {
      userId: values.userIds,
      shiftTemplateId: values.shiftTemplateId,
      workDate: values.workDate,
      scheduleType: values.scheduleType,
    };

    try {
      if (isEdit && currentRow) {
        await handleEdit(currentRow.id, payload);
      } else {
        await handleAdd(payload);
      }
      onOpenChange(false);
    } catch {
      // Toast handled in provider
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

            <FormField
              control={form.control}
              name="scheduleType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loại ca</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="cursor-pointer w-full">
                        <SelectValue placeholder="Chọn loại ca" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="NORMAL">Ca thường</SelectItem>
                      <SelectItem value="OVERTIME">Tăng ca</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                    Phân ca
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
