"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil } from "lucide-react";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import type { Plan, UpdatePlanPayload } from "@/lib/api/subscription";
import {
  PLAN_FEATURE_OPTIONS,
  BILLING_CYCLE_LABELS,
} from "../_constants/plan-features";
import { planFormSchema, type PlanFormValues } from "../_types/plan.types";

type EditPlanDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan?: Plan;
  onSubmit: (id: string, payload: UpdatePlanPayload) => Promise<boolean>;
};

// number input onChange helper: empty string -> NaN so zod flags "required"
const numberChange =
  (onChange: (v: number) => void) =>
  (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange(e.target.value === "" ? NaN : e.target.valueAsNumber);

export function EditPlanDialog({
  open,
  onOpenChange,
  plan,
  onSubmit,
}: EditPlanDialogProps) {
  const form = useForm<PlanFormValues>({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
      planName: "",
      description: "",
      price: 0,
      maxBranches: 0,
      maxUsers: 0,
      maxProducts: 0,
      trialDays: 0,
      features: [],
      displayFeaturesText: "",
      isPopular: false,
      isActive: true,
    },
  });

  useEffect(() => {
    if (!open || !plan) return;
    form.reset({
      planName: plan.planName,
      description: plan.description ?? "",
      price: plan.price,
      maxBranches: plan.maxBranches,
      maxUsers: plan.maxUsers,
      maxProducts: plan.maxProducts,
      trialDays: plan.trialDays,
      features: plan.features ?? [],
      displayFeaturesText: (plan.displayFeatures ?? []).join("\n"),
      isPopular: plan.isPopular ?? false,
      isActive: plan.isActive,
    });
  }, [open, plan, form]);

  async function handleSubmit(values: PlanFormValues) {
    if (!plan) return;
    const payload: UpdatePlanPayload = {
      planName: values.planName.trim(),
      description: values.description?.trim() ?? "",
      price: values.price,
      maxBranches: values.maxBranches,
      maxUsers: values.maxUsers,
      maxProducts: values.maxProducts,
      trialDays: values.trialDays,
      features: values.features,
      displayFeatures: (values.displayFeaturesText ?? "")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      isPopular: values.isPopular,
      isActive: values.isActive,
    };
    const ok = await onSubmit(plan.id, payload);
    if (ok) onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Chỉnh sửa gói dịch vụ
            {plan && (
              <>
                <Badge variant="outline">{plan.planCode}</Badge>
                <Badge variant="secondary">
                  {BILLING_CYCLE_LABELS[plan.billingCycle] ?? plan.billingCycle}
                </Badge>
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            Mã gói và chu kỳ thanh toán không thể thay đổi. Thay đổi sẽ hiển thị
            ngay trên trang landing và trang thanh toán.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-5"
          >
            <FormField
              control={form.control}
              name="planName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Tên gói <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Tên gói" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mô tả</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Mô tả ngắn hiển thị trên thẻ gói"
                      rows={2}
                      className="resize-none"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Giá (VND)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        value={Number.isNaN(field.value) ? "" : field.value}
                        onChange={numberChange(field.onChange)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="trialDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Số ngày dùng thử</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        value={Number.isNaN(field.value) ? "" : field.value}
                        onChange={numberChange(field.onChange)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              {(
                [
                  ["maxBranches", "Chi nhánh tối đa"],
                  ["maxUsers", "Nhân viên tối đa"],
                  ["maxProducts", "Sản phẩm tối đa"],
                ] as const
              ).map(([name, label]) => (
                <FormField
                  key={name}
                  control={form.control}
                  name={name}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{label}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={-1}
                          value={Number.isNaN(field.value) ? "" : field.value}
                          onChange={numberChange(field.onChange)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>
            <p className="-mt-2 text-xs text-muted-foreground">
              Nhập <span className="font-mono">-1</span> để đặt không giới hạn.
            </p>

            <FormField
              control={form.control}
              name="features"
              render={() => (
                <FormItem>
                  <FormLabel>Tính năng khả dụng (feature-flags)</FormLabel>
                  <div className="grid grid-cols-2 gap-2">
                    {PLAN_FEATURE_OPTIONS.map((opt) => (
                      <FormField
                        key={opt.key}
                        control={form.control}
                        name="features"
                        render={({ field }) => {
                          const checked = field.value?.includes(opt.key);
                          return (
                            <FormItem className="flex flex-row items-center gap-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={(v) => {
                                    const set = new Set(field.value ?? []);
                                    if (v) set.add(opt.key);
                                    else set.delete(opt.key);
                                    field.onChange(Array.from(set));
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal">
                                {opt.label}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="displayFeaturesText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Danh sách hiển thị (marketing)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={"Mỗi dòng một gạch đầu dòng\nVí dụ: Tối đa 3 chi nhánh"}
                      rows={5}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Mỗi dòng là một mục hiển thị trên thẻ gói ở landing/billing.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col gap-3 rounded-lg border p-4">
              <FormField
                control={form.control}
                name="isPopular"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between space-y-0">
                    <div>
                      <FormLabel>Gói nổi bật</FormLabel>
                      <FormDescription>
                        Đánh dấu &quot;Phổ biến&quot; và làm nổi bật thẻ gói.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between space-y-0">
                    <div>
                      <FormLabel>Đang kích hoạt</FormLabel>
                      <FormDescription>
                        Tắt để ẩn gói khỏi landing và trang thanh toán.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="cursor-pointer"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                className="cursor-pointer"
                disabled={form.formState.isSubmitting}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Lưu thay đổi
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
