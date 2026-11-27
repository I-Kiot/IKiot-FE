"use client";

// Mở lại két chốt nhầm trong ngày: chọn người nhận két và ghi lý do. Kết quả chốt và các dòng sổ quỹ ghi lúc chốt
// (thừa / thiếu, chủ rút) bị gỡ; người nhận két phải nhận ca rồi báo cáo lại trước khi chốt lần nữa.

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cashDrawerApi } from "@/lib/api/cash-drawer";
import { messageForCode } from "@/lib/api/error-codes";
import type { CashierOption } from "@/types/cash-drawer";

/** Ngày giao dịch hôm nay theo giờ Việt Nam, `YYYY-MM-DD`; chỉ phiên của ngày này mở lại được. */
export function vietnamToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());
}

export function ReopenDrawerDialog({
  open,
  onOpenChange,
  sessionId,
  branchId,
  defaultStaffId,
  onReopened,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  branchId: string;
  /** Người giữ két lúc chốt: thường là người nhận lại. */
  defaultStaffId?: string;
  onReopened: () => void;
}) {
  const [staff, setStaff] = useState<CashierOption[] | null>(null);
  const [staffId, setStaffId] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    let stale = false;
    cashDrawerApi
      .getEligibleStaff(branchId)
      .then((list) => {
        if (stale) return;
        setStaff(list);
        setStaffId(list.find((s) => s.id === defaultStaffId)?.id ?? list[0]?.id ?? "");
      })
      .catch(() => {
        if (!stale) setStaff([]);
      });
    return () => {
      stale = true;
    };
  }, [open, branchId, defaultStaffId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffId) {
      toast.error("Vui lòng chọn nhân viên nhận két");
      return;
    }
    if (reason.trim().length < 3) {
      toast.error("Vui lòng ghi lý do mở lại két");
      return;
    }
    setIsSubmitting(true);
    try {
      await cashDrawerApi.reopenSession(sessionId, { staffId, reason: reason.trim() });
      toast.success("Đã mở lại két. Nhân viên nhận két cần nhận ca để bán tiếp.");
      setReason("");
      onOpenChange(false);
      onReopened();
    } catch (error) {
      const data = (error as { response?: { data?: { code?: string; message?: string } } })?.response?.data;
      toast.error(messageForCode(data?.code) || data?.message || "Không thể mở lại két");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Mở lại két</DialogTitle>
            <DialogDescription>
              Dùng khi chốt két nhầm trong hôm nay. Kết quả chốt và các khoản ghi vào sổ quỹ lúc chốt (thừa / thiếu két,
              tiền chủ rút) sẽ bị gỡ; khi chốt lại, sổ quỹ ghi lại theo số đếm mới.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="reopen-staff" className="font-semibold">
                Nhân viên nhận két
              </Label>
              {staff === null ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Đang tải...
                </div>
              ) : staff.length === 0 ? (
                <div className="text-sm text-destructive font-medium border border-destructive/20 bg-destructive/5 rounded-md p-3">
                  Không có nhân viên hoạt động tại chi nhánh.
                </div>
              ) : (
                <Select value={staffId} onValueChange={setStaffId}>
                  <SelectTrigger id="reopen-staff">
                    <SelectValue placeholder="Chọn nhân viên" />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reopen-reason" className="font-semibold">
                Lý do mở lại
              </Label>
              <Textarea
                id="reopen-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ví dụ: Chốt nhầm, chi nhánh còn bán đến 22h"
                className="resize-none h-20"
                maxLength={500}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting || !staff?.length} className="font-semibold">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin me-2" /> Đang mở lại...
                </>
              ) : (
                "Xác nhận mở lại"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
