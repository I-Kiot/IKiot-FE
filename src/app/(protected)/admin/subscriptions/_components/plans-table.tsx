"use client";

import { useState } from "react";
import { Pencil, Loader2, Star } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import type { Plan } from "@/lib/api/subscription";
import { usePlansMutations } from "../_hooks/use-plans-mutations";
import { BILLING_CYCLE_LABELS } from "../_constants/plan-features";
import { EditPlanDialog } from "./edit-plan-dialog";

const formatVnd = (amount: number) =>
  amount === 0 ? "Miễn phí" : `${amount.toLocaleString("vi-VN")}đ`;

const formatLimit = (n: number) => (n === -1 ? "∞" : n.toLocaleString("vi-VN"));

export function PlansTable() {
  const { plans, isLoading, editPlan, toggleActive } = usePlansMutations();
  const [editing, setEditing] = useState<Plan | undefined>(undefined);
  const [dialogOpen, setDialogOpen] = useState(false);

  const openEdit = (plan: Plan) => {
    setEditing(plan);
    setDialogOpen(true);
  };

  if (isLoading && plans.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-xl border py-20 text-muted-foreground">
        <Loader2 className="mr-2 size-5 animate-spin" />
        Đang tải danh sách gói...
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Gói</TableHead>
              <TableHead>Mã</TableHead>
              <TableHead>Chu kỳ</TableHead>
              <TableHead className="text-right">Giá</TableHead>
              <TableHead className="text-center">CN</TableHead>
              <TableHead className="text-center">NV</TableHead>
              <TableHead className="text-center">SP</TableHead>
              <TableHead className="text-center">Kích hoạt</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="py-10 text-center text-muted-foreground"
                >
                  Chưa có gói dịch vụ nào. Chạy{" "}
                  <span className="font-mono">npm run seed:plans</span> ở backend.
                </TableCell>
              </TableRow>
            ) : (
              plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">
                    <span className="flex items-center gap-2">
                      {plan.planName}
                      {plan.isPopular && (
                        <Star className="size-3.5 fill-amber-400 text-amber-400" />
                      )}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">
                      {plan.planCode}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {BILLING_CYCLE_LABELS[plan.billingCycle] ??
                      plan.billingCycle}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatVnd(plan.price)}
                  </TableCell>
                  <TableCell className="text-center">
                    {formatLimit(plan.maxBranches)}
                  </TableCell>
                  <TableCell className="text-center">
                    {formatLimit(plan.maxUsers)}
                  </TableCell>
                  <TableCell className="text-center">
                    {formatLimit(plan.maxProducts)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={plan.isActive}
                      onCheckedChange={(v) => toggleActive(plan.id, v)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="cursor-pointer"
                      onClick={() => openEdit(plan)}
                    >
                      <Pencil className="mr-1.5 size-4" />
                      Sửa
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <EditPlanDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        plan={editing}
        onSubmit={editPlan}
      />
    </>
  );
}
