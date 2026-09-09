"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserCog } from "lucide-react";
import { toast } from "sonner";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { branchApi } from "@/lib/api/branch";
import { staffApi } from "@/lib/api/staff";
import { getApiErrorMessage } from "@/lib/api/staff-mapper";
import {
  formatStaffOptionLabel,
  StaffSearchSelect,
} from "@/app/(protected)/staffs/shared/staff-search-select";
import type { Branch } from "@/types/branch";
import type { Staff } from "@/types/staff";

const formSchema = z.object({
  branchId: z.string().min(1, "Vui lòng chọn chi nhánh"),
  staffId: z.string().min(1, "Vui lòng chọn nhân viên"),
});

type FormValues = z.infer<typeof formSchema>;

type AssignBranchManagerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialBranchId?: string;
  initialBranchName?: string;
  onSuccess?: () => void;
};

export function AssignBranchManagerDialog({
  open,
  onOpenChange,
  initialBranchId,
  onSuccess,
}: AssignBranchManagerDialogProps) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [allStaff, setAllStaff] = useState<Staff[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingStaff, setLoadingStaff] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      branchId: "",
      staffId: "",
    },
  });

  const selectedBranchId = form.watch("branchId");
  const branchIsLocked = Boolean(initialBranchId);

  const currentManager = useMemo(() => {
    if (!selectedBranchId) return null;
    return (
      allStaff.find(
        (staff) =>
          staff.status === "ACTIVE" &&
          staff.branchId === selectedBranchId,
      ) ?? null
    );
  }, [allStaff, selectedBranchId]);

  const staffCandidates = useMemo(() => {
    if (!selectedBranchId) return [];
    return allStaff.filter(
      (staff) =>
        staff.status === "ACTIVE" &&
        staff.branchId === selectedBranchId,
    );
  }, [allStaff, selectedBranchId]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    form.reset({
      branchId: initialBranchId ?? "",
      staffId: "",
    });

    setLoadingBranches(true);
    setLoadingStaff(true);

    void branchApi
      .getList({ status: "ACTIVE", limit: 100 })
      .then((response) => {
        if (!cancelled) setBranches(response.data ?? []);
      })
      .catch((error) => {
        if (!cancelled) {
          toast.error(getApiErrorMessage(error));
          setBranches([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingBranches(false);
      });

    void staffApi
      .getAllForOptions()
      .then((list) => {
        if (!cancelled) setAllStaff(list);
      })
      .catch(() => {
        if (!cancelled) setAllStaff([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingStaff(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, form, initialBranchId]);

  useEffect(() => {
    form.setValue("staffId", "");
  }, [form, selectedBranchId]);

  async function onSubmit(values: FormValues) {
    try {
      await branchApi.assignManager(values.branchId, values.staffId);
      toast.success("Đã chuyển nhượng quản lý chi nhánh");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initialBranchId
              ? "Chuyển nhượng quản lý chi nhánh"
              : "Đổi quản lý chi nhánh"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="branchId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chi nhánh</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={branchIsLocked || loadingBranches}
                  >
                    <FormControl>
                      <SelectTrigger className="cursor-pointer w-full">
                        <SelectValue
                          placeholder={
                            loadingBranches
                              ? "Đang tải..."
                              : "Chọn chi nhánh"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedBranchId && (
              <div className="rounded-md border px-3 py-2 text-sm">
                <p className="text-xs text-muted-foreground">Quản lý hiện tại</p>
                <p className="mt-0.5 font-medium truncate">
                  {currentManager
                    ? formatStaffOptionLabel(currentManager)
                    : "-"}
                </p>
              </div>
            )}

            <FormField
              control={form.control}
              name="staffId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nhân viên mới</FormLabel>
                  <FormControl>
                    <StaffSearchSelect
                      staff={staffCandidates}
                      value={field.value}
                      onChange={field.onChange}
                      disabled={!selectedBranchId}
                      loading={loadingStaff}
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
                disabled={
                  form.formState.isSubmitting ||
                  !selectedBranchId ||
                  staffCandidates.length === 0
                }
              >
                <UserCog className="mr-2 size-4" />
                Xác nhận chuyển nhượng
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
