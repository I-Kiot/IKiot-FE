"use client";

import * as React from "react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getApiErrorBody } from "@/lib/api/error-codes";
import { orderJourneyApi } from "@/lib/api/order-journey";
import { getSessionUserId } from "@/lib/auth";
import {
  ORDER_PRIORITIES,
  ORDER_PRIORITY_LABELS,
  type OrderDetail,
  type OrderPriority,
} from "@/types/order-flow";

type Props = {
  order: OrderDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (order: OrderDetail) => void;
  /** Đổi ưu tiên cần `orders:update`; người đang phụ trách không có quyền này chỉ giao lại đơn được. */
  canSetPriority: boolean;
};

interface AssigneeOption {
  id: string;
  name: string;
}

/**
 * D-7: giao đơn cho người khác hoặc đổi độ ưu tiên mà không mở form sửa (`PATCH /orders/:id/assignee`, `/priority`, A-8).
 * Được phép tới khi đơn giao đi, kể cả đơn đã đóng gói.
 */
export function OrderHandlingDialog({ order, open, onOpenChange, onSaved, canSetPriority }: Props) {
  const [assignees, setAssignees] = React.useState<AssigneeOption[] | null>(null);
  const [assigneeId, setAssigneeId] = React.useState(order.assignee?.id ?? "");
  const [priority, setPriority] = React.useState<OrderPriority>(order.priority);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    let stale = false;
    const me = getSessionUserId();
    // BE trả đúng những người nhận được đơn này (nhân viên tại nơi bán và chủ shop), cùng luật với lúc lưu.
    orderJourneyApi
      .assignees(order.id)
      .catch(() => [])
      .then((people) => {
        if (stale) return;
        const options = people.map((person) => {
          const tags = [person.isOwner ? "chủ shop" : null, person.id === me ? "tôi" : null].filter(Boolean);
          return { id: person.id, name: tags.length > 0 ? `${person.name} (${tags.join(", ")})` : person.name };
        });
        // Người đang phụ trách luôn có trong danh sách, kể cả khi đã chuyển nơi làm.
        if (order.assignee && !options.some((o) => o.id === order.assignee?.id)) {
          options.unshift({ id: order.assignee.id, name: order.assignee.name });
        }
        setAssignees(options);
      });
    return () => {
      stale = true;
    };
  }, [order.assignee, order.id]);

  const assigneeChanged = !!assigneeId && assigneeId !== (order.assignee?.id ?? "");
  const priorityChanged = priority !== order.priority;

  async function save() {
    setSaving(true);
    try {
      let updated = order;
      if (assigneeChanged) updated = await orderJourneyApi.assign(order.id, assigneeId);
      if (priorityChanged) updated = await orderJourneyApi.setPriority(order.id, priority);
      toast.success("Đã cập nhật đơn hàng");
      onSaved(updated);
    } catch (error) {
      toast.error(getApiErrorBody(error)?.message ?? "Không cập nhật được đơn hàng");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Người phụ trách và ưu tiên</DialogTitle>
          <DialogDescription>Đổi được cho tới khi đơn chuyển sang đang vận chuyển.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Người phụ trách</Label>
            <Select value={assigneeId} onValueChange={setAssigneeId} disabled={assignees === null}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={assignees === null ? "Đang tải..." : "Chọn người phụ trách"} />
              </SelectTrigger>
              <SelectContent>
                {(assignees ?? []).map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Mức ưu tiên</Label>
            <Select
              value={priority}
              onValueChange={(value) => setPriority(value as OrderPriority)}
              disabled={!canSetPriority}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ORDER_PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {ORDER_PRIORITY_LABELS[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Huỷ
          </Button>
          <Button onClick={save} disabled={saving || (!assigneeChanged && !priorityChanged)}>
            {saving ? "Đang lưu..." : "Lưu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
