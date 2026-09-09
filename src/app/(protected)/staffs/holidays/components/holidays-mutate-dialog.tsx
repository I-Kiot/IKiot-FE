"use client";

import { FormEvent, useEffect, useId, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Holiday } from "@/types/holiday";
import { useHolidays } from "./holidays-provider";

type HolidaysMutateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentRow?: Holiday;
};

export function HolidaysMutateDialog({
  open,
  onOpenChange,
  currentRow,
}: HolidaysMutateDialogProps) {
  const { handleAdd, handleEdit } = useHolidays();
  const dateId = useId();
  const nameId = useId();
  const [date, setDate] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const isEdit = Boolean(currentRow);

  useEffect(() => {
    if (!open) return;
    setDate(currentRow?.date?.slice(0, 10) ?? "");
    setName(currentRow?.name ?? "");
    setError("");
  }, [open, currentRow]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!date || !trimmedName) {
      setError("Vui lòng nhập đầy đủ ngày và tên ngày lễ.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      if (currentRow) {
        await handleEdit(currentRow.id, { date, name: trimmedName });
      } else {
        await handleAdd({ date, name: trimmedName });
      }
      onOpenChange(false);
    } catch {
      // Provider đã toast lỗi API.
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "Chỉnh sửa ngày lễ" : "Thêm ngày lễ"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-5">
            <div className="grid gap-2">
              <Label htmlFor={dateId}>Ngày</Label>
              <Input
                id={dateId}
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={nameId}>Tên ngày lễ</Label>
              <Input
                id={nameId}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ví dụ: Quốc khánh"
                maxLength={120}
                disabled={isSubmitting}
                required
                autoFocus
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              {isEdit ? "Lưu thay đổi" : "Thêm ngày lễ"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
