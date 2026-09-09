"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { staffApi } from "@/lib/api/staff";
import { getApiErrorMessage } from "@/lib/api/staff-mapper";
import type { Staff } from "@/types/staff";
import { useStaffs } from "./staffs-provider";

const formSchema = z.object({
  annualLeaveDays: z
    .number({ error: "Phải là số" })
    .int("Phải là số nguyên")
    .min(0, "Không được âm")
    .max(365, "Tối đa 365 ngày"),
});

type FormValues = z.infer<typeof formSchema>;

type StaffsLeaveBalanceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentRow: Staff | null;
};

export function StaffsLeaveBalanceDialog({
  open,
  onOpenChange,
  currentRow,
}: StaffsLeaveBalanceDialogProps) {
  const { fetchStaffs } = useStaffs();
  const hasBalance = Boolean(currentRow?.leaveBalance);
  const usedDays =
    currentRow?.leaveBalance != null
      ? Math.max(
          0,
          currentRow.leaveBalance.annualLeaveDays -
            currentRow.leaveBalance.remainingDays,
        )
      : 0;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      annualLeaveDays: 12,
    },
  });

  useEffect(() => {
    if (!open || !currentRow) return;
    form.reset({
      annualLeaveDays: currentRow.leaveBalance?.annualLeaveDays ?? 12,
    });
  }, [open, currentRow, form]);

  async function onSubmit(values: FormValues) {
    if (!currentRow) return;

    try {
      if (hasBalance) {
        await staffApi.updateAnnualLeaveDays(
          currentRow.id,
          Number(values.annualLeaveDays),
        );
        toast.success("Đã cập nhật ngày phép năm");
      } else {
        await staffApi.createLeaveBalance(
          currentRow.id,
          Number(values.annualLeaveDays),
        );
        toast.success("Đã khởi tạo ngày phép năm");
      }
      await fetchStaffs();
      onOpenChange(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {hasBalance ? "Cập nhật ngày phép" : "Khởi tạo ngày phép"}
          </DialogTitle>
          <DialogDescription>
            {currentRow
              ? `${currentRow.fullName} · còn ${currentRow.leaveBalance?.remainingDays ?? "-"}/${currentRow.leaveBalance?.annualLeaveDays ?? "-"} ngày`
              : "Thiết lập số ngày phép năm cho nhân viên"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {hasBalance && usedDays > 0 && (
              <p className="rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                Đã dùng {usedDays} ngày. Số ngày còn lại sẽ được cập nhật tự
                động khi đổi hạn mức năm.
              </p>
            )}

            <FormField
              control={form.control}
              name="annualLeaveDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Số ngày phép năm</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={365}
                      className="cursor-pointer"
                      value={field.value ?? ""}
                      onChange={(event) => {
                        const raw = event.target.value;
                        field.onChange(
                          raw === "" ? undefined : Number(raw),
                        );
                      }}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
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
                disabled={form.formState.isSubmitting}
              >
                <CalendarDays className="mr-2 size-4" />
                {hasBalance ? "Cập nhật" : "Khởi tạo"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
