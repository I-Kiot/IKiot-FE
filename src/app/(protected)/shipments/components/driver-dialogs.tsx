"use client";

// Chọn shipper: ô chọn dùng chung (`DriverSelect`, cũng dùng ở dialog "Giao cho vận chuyển") và dialog
// "Đổi shipper" của một lần giao nội bộ chưa kết thúc (PATCH /shipments/:id/driver).

import { useEffect, useState } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { shipmentApi } from "@/lib/api/shipment";
import { personName, type DriverOption, type Shipment } from "@/types/order-flow";
import { reportShipmentError } from "./shipment-ui";

// ─── Ô chọn shipper ─────────────────────────────────────────────────────────

type DriversState = { status: "loading" } | { status: "error" } | { status: "ready"; drivers: DriverOption[] };

/** Nhãn một lựa chọn: tên, kèm "chủ shop" / "người phụ trách đơn" để người chọn biết vì sao người đó có mặt. */
function optionLabel(driver: DriverOption): string {
  const tags = [
    driver.systemRole === "TENANT_OWNER" ? "chủ shop" : null,
    driver.isAssignee ? "người phụ trách đơn" : null,
  ].filter(Boolean);
  return tags.length > 0 ? `${personName(driver)} (${tags.join(", ")})` : personName(driver);
}

/** Chữ trong ô khi chưa chọn ai. */
function placeholderOf(state: DriversState): string {
  if (state.status === "loading") return "Đang tải danh sách shipper...";
  if (state.status === "error") return "Không tải được danh sách shipper";
  return "Chọn shipper";
}

interface DriverSelectProps {
  orderId: string;
  value: string;
  onChange: (driverId: string) => void;
  disabled?: boolean;
}

/**
 * Danh sách lấy từ BE (`GET /shipments/drivers`) – đúng những người BE sẽ chấp nhận. Tải lại mỗi lần mở
 * (component được dựng lại theo dialog), nên người vừa bị khoá tài khoản không còn trong danh sách.
 */
export function DriverSelect({ orderId, value, onChange, disabled }: DriverSelectProps) {
  const [state, setState] = useState<DriversState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    shipmentApi.getDrivers(orderId).then(
      (drivers) => {
        if (!cancelled) setState({ status: "ready", drivers });
      },
      () => {
        if (!cancelled) setState({ status: "error" });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled || state.status !== "ready"}>
      <SelectTrigger className="w-full cursor-pointer">
        <SelectValue placeholder={placeholderOf(state)} />
      </SelectTrigger>
      <SelectContent>
        {state.status === "ready" &&
          state.drivers.map((driver) => (
            <SelectItem key={driver.id} value={driver.id}>
              {optionLabel(driver)}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
}

// ─── Dialog đổi shipper ─────────────────────────────────────────────────────

interface ChangeDriverDialogProps {
  shipment: Shipment;
  open: boolean;
  onClose: () => void;
  /** Đổi xong, hoặc lần giao vừa đổi ở nơi khác. */
  onNeedsReload: () => void;
}

/** Chọn shipper mới; danh sách tải mới mỗi lần mở. */
export function ChangeDriverDialog({ shipment, open, onClose, onNeedsReload }: ChangeDriverDialogProps) {
  const [driverId, setDriverId] = useState(shipment.driver?.id ?? "");
  const [submitting, setSubmitting] = useState(false);
  const unchanged = !driverId || driverId === shipment.driver?.id;

  const submit = () => {
    // Khoá nút trong lúc gọi: bấm đúp không gửi hai request.
    if (submitting || unchanged) return;
    setSubmitting(true);
    shipmentApi
      .changeDriver(shipment.id, driverId)
      .then((updated) => {
        toast.success(`Đã đổi shipper thành ${personName(updated.driver)}`);
        onNeedsReload();
      })
      .catch((error: unknown) => {
        if (reportShipmentError(error, "Đổi shipper thất bại, vui lòng thử lại")) onNeedsReload();
      })
      .finally(() => setSubmitting(false));
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && !submitting && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Đổi shipper đơn {shipment.order.code}</DialogTitle>
          <DialogDescription>
            Shipper hiện tại: {personName(shipment.driver) || "chưa có"}. Người mới sẽ nhận thông báo.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <DriverSelect orderId={shipment.order.id} value={driverId} onChange={setDriverId} disabled={submitting} />
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Huỷ
          </Button>
          <Button onClick={submit} disabled={submitting || unchanged}>
            {submitting ? "Đang xử lý..." : "Đổi shipper"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
