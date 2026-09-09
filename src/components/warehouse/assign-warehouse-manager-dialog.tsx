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
import { staffApi } from "@/lib/api/staff";
import { getApiErrorMessage } from "@/lib/api/staff-mapper";
import { warehouseApi } from "@/lib/api/warehouse";
import {
  formatStaffOptionLabel,
  StaffSearchSelect,
} from "@/app/(protected)/staffs/shared/staff-search-select";
import type { Staff } from "@/types/staff";
import type { Warehouse } from "@/types/warehouse";

const formSchema = z.object({
  warehouseId: z.string().min(1, "Vui lòng chọn kho"),
  staffId: z.string().min(1, "Vui lòng chọn nhân viên"),
});

type FormValues = z.infer<typeof formSchema>;

type AssignWarehouseManagerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialWarehouseId?: string;
  initialWarehouseName?: string;
  onSuccess?: () => void;
};

export function AssignWarehouseManagerDialog({
  open,
  onOpenChange,
  initialWarehouseId,
  onSuccess,
}: AssignWarehouseManagerDialogProps) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [allStaff, setAllStaff] = useState<Staff[]>([]);
  const [loadingWarehouses, setLoadingWarehouses] = useState(false);
  const [loadingStaff, setLoadingStaff] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      warehouseId: "",
      staffId: "",
    },
  });

  const selectedWarehouseId = form.watch("warehouseId");
  const warehouseIsLocked = Boolean(initialWarehouseId);

  const currentManager = useMemo(() => {
    if (!selectedWarehouseId) return null;
    return (
      allStaff.find(
        (staff) =>
          staff.status === "ACTIVE" &&
          staff.warehouseId === selectedWarehouseId,
      ) ?? null
    );
  }, [allStaff, selectedWarehouseId]);

  const staffCandidates = useMemo(
    () =>
      allStaff.filter(
        (staff) => staff.status === "ACTIVE",
      ),
    [allStaff],
  );

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    form.reset({
      warehouseId: initialWarehouseId ?? "",
      staffId: "",
    });

    setLoadingWarehouses(true);
    setLoadingStaff(true);

    void warehouseApi
      .getList({ status: "ACTIVE", limit: 100 })
      .then((response) => {
        if (!cancelled) setWarehouses(response.data ?? []);
      })
      .catch((error) => {
        if (!cancelled) {
          toast.error(getApiErrorMessage(error));
          setWarehouses([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingWarehouses(false);
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
  }, [open, form, initialWarehouseId]);

  useEffect(() => {
    form.setValue("staffId", "");
  }, [form, selectedWarehouseId]);

  async function onSubmit(values: FormValues) {
    try {
      await warehouseApi.assignManager(values.warehouseId, values.staffId);
      toast.success("Đã đổi quản lý kho");
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
          <DialogTitle>Đổi quản lý kho</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="warehouseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kho hàng</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={warehouseIsLocked || loadingWarehouses}
                  >
                    <FormControl>
                      <SelectTrigger className="cursor-pointer w-full">
                        <SelectValue
                          placeholder={
                            loadingWarehouses
                              ? "Đang tải..."
                              : "Chọn kho hàng"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {warehouses.map((warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.id}>
                          {warehouse.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedWarehouseId && (
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
                      disabled={!selectedWarehouseId}
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
                  !selectedWarehouseId ||
                  staffCandidates.length === 0
                }
              >
                <UserCog className="mr-2 size-4" />
                Xác nhận đổi
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
