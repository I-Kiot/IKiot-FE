"use client";

import { useState } from "react";
import { CalendarX2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatSeriesSummary } from "@/app/(protected)/staffs/shared/schedule-series";
import { useSchedule, type StopSeriesTarget } from "./schedule-provider";

/** Dừng một lịch lặp lại từ một ngày: các ca từ ngày đó bị gỡ, ca trước đó giữ nguyên. */
export function ScheduleStopSeriesDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
}) {
  const { stopSeriesTarget } = useSchedule();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {stopSeriesTarget && (
          // key: mở lại cho lịch khác thì ngày mặc định khởi tạo lại, không cần effect.
          <StopSeriesForm
            key={`${stopSeriesTarget.series.id}:${stopSeriesTarget.defaultFromDate}`}
            target={stopSeriesTarget}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function StopSeriesForm({
  target,
  onDone,
}: {
  target: StopSeriesTarget;
  onDone: () => void;
}) {
  const { handleStopSeries } = useSchedule();
  const [fromDate, setFromDate] = useState(target.defaultFromDate);
  const [submitting, setSubmitting] = useState(false);
  const stopSeriesTarget = target;

  async function onConfirm() {
    if (!fromDate) return;
    setSubmitting(true);
    try {
      await handleStopSeries(stopSeriesTarget.series.id, fromDate);
      onDone();
    } catch {
      // Provider đã toast lỗi.
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Dừng lịch lặp lại</DialogTitle>
        <DialogDescription>
          <>
            Lịch lặp của{" "}
            <strong className="text-foreground">
              {stopSeriesTarget.staffName}
            </strong>{" "}
            ({formatSeriesSummary(stopSeriesTarget.series)}). Các ca của lịch
            này từ ngày đã chọn trở đi sẽ bị gỡ; ca trước đó và ca xếp tay giữ
            nguyên.
          </>
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-2">
        <Label htmlFor="stop-series-from">Dừng từ ngày</Label>
        <Input
          id="stop-series-from"
          type="date"
          value={fromDate}
          min={stopSeriesTarget.series.startDate}
          max={stopSeriesTarget.series.endDate}
          onChange={(event) => setFromDate(event.target.value)}
        />
      </div>

      <DialogFooter className="gap-2">
        <Button variant="outline" className="cursor-pointer" onClick={onDone}>
          Hủy
        </Button>
        <Button
          variant="destructive"
          className="cursor-pointer"
          onClick={onConfirm}
          disabled={submitting || !fromDate}
        >
          <CalendarX2 className="mr-2 size-4" />
          Dừng lịch lặp
        </Button>
      </DialogFooter>
    </>
  );
}
