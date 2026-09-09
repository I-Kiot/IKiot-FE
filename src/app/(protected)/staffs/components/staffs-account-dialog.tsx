"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, UserCheck } from "lucide-react";
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
import type { Staff } from "@/types/staff";
import { useStaffs } from "./staffs-provider";

const passwordSchema = z
  .object({
    newPassword: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
    reEnterPassword: z.string().min(6, "Xác nhận mật khẩu tối thiểu 6 ký tự"),
  })
  .refine((data) => data.newPassword === data.reEnterPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["reEnterPassword"],
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

type StaffsAccountDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentRow: Staff | null;
  mode: "activate" | "password";
};

export function StaffsAccountDialog({
  open,
  onOpenChange,
  currentRow,
  mode,
}: StaffsAccountDialogProps) {
  const { handleActivate, handleUpdatePassword } = useStaffs();
  const isActivate = mode === "activate";

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { newPassword: "", reEnterPassword: "" },
  });

  async function onSubmit(data: PasswordFormValues) {
    if (!currentRow) return;

    try {
      if (isActivate) {
        await handleActivate(currentRow.id, data);
      } else {
        await handleUpdatePassword(currentRow.id, data);
      }
      form.reset();
      onOpenChange(false);
    } catch {
      // Error toast handled in provider
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) form.reset();
        onOpenChange(value);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isActivate ? "Kích hoạt tài khoản" : "Đổi mật khẩu"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mật khẩu mới</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reEnterPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Xác nhận mật khẩu</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
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
                {isActivate ? (
                  <>
                    <UserCheck className="mr-2 size-4" />
                    Kích hoạt
                  </>
                ) : (
                  <>
                    <KeyRound className="mr-2 size-4" />
                    Lưu mật khẩu
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
