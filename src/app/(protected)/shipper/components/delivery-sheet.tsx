"use client";

// Chi tiết một lần giao của shipper: người nhận, số tiền phải thu, nhật trình, và các nút theo trạng thái
// (đã lấy hàng, đang đi giao, đã giao, giao không thành; sau khi giao bằng QR: mã QR, kiểm tra tiền về, đổi sang tiền mặt).

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { shipmentApi } from "@/lib/api/shipment";
import { useCountdown } from "@/hooks/use-countdown";
import { QrCountdown } from "@/components/qr-countdown";
import {
  type Shipment,
  type ShipmentQrPayment,
} from "@/types/order-flow";
import { ShipmentNoteDialog } from "../../shipments/components/shipment-detail-sheet";
import {
  amountDueText,
  formatVND,
  isOnTheRoad,
  reportShipmentError,
  ShipmentStatusBadge,
  ShipmentTimeline,
} from "../../shipments/components/shipment-ui";
import { DeliverDialog } from "./deliver-dialog";

type DetailState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; shipment: Shipment };

/** Thao tác đang mở dialog. */
type OpenAction = "pickUp" | "outForDelivery" | "deliver" | "fail" | "payCash" | null;

interface DeliverySheetProps {
  /** Lần giao đang mở; `null` = đóng. Trang đặt `key` theo id nên mỗi lần mở là state mới. */
  shipmentId: string | null;
  onClose: () => void;
  /** Có thao tác thành công, hoặc dữ liệu vừa đổi ở nơi khác – trang tải lại danh sách. */
  onChanged: () => void;
}

/** Chữ ở đầu sheet khi chưa có dữ liệu. */
function loadingText(state: DetailState): string {
  return state.status === "error" ? "Không tải được lần giao" : "Đang tải...";
}

/** Một dòng thông tin "nhãn: giá trị". */
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span>{children || "—"}</span>
    </div>
  );
}

/**
 * Khung thu tiền QR: chờ tiền về thì hiện mã + đồng hồ cho khách quét; hết hạn thì ẩn mã, cho tạo lại hoặc thu tiền mặt;
 * đã về thì báo đã nhận. Hạn do server trả (`expiresAt`); ảnh QR chỉ vẽ khi có `qrUrl` và chưa hết hạn.
 */
function QrPaymentPanel({
  payment,
  due,
  checking,
  reissuing,
  onCheck,
  onPayCash,
  onReissue,
}: {
  payment: ShipmentQrPayment;
  /** Còn phải thu của đơn (server tính, trừ mọi khoản đã nhận). */
  due: number;
  checking: boolean;
  reissuing: boolean;
  onCheck: () => void;
  onPayCash: () => void;
  onReissue: () => void;
}) {
  const countdown = useCountdown(payment.expiresAt);
  if (payment.status === "PAID" && due > 0) {
    // Khách chuyển thiếu: khoản QR đã nhận (số thực nhận), đơn vẫn còn phải thu.
    return (
      <div className="space-y-3 rounded-md border border-amber-300 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
        <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
          Khách chuyển thiếu: đã nhận {formatVND(payment.amount)}
        </p>
        <p className="text-sm">
          Còn phải thu: <span className="font-semibold">{formatVND(due)}</span>
        </p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={onReissue} disabled={reissuing}>
            {reissuing ? "Đang tạo..." : "Tạo QR số còn lại"}
          </Button>
          <Button variant="outline" onClick={onPayCash}>
            Thu tiền mặt số còn lại
          </Button>
        </div>
      </div>
    );
  }
  if (payment.status === "PAID") {
    return (
      <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
        Đã nhận chuyển khoản {formatVND(payment.amount)} - đơn hoàn thành.
      </div>
    );
  }
  if (payment.status !== "PENDING" && payment.status !== "EXPIRED") {
    return null;
  }
  const expired =
    payment.status === "EXPIRED" || payment.expired || countdown.expired || !payment.qrUrl;
  if (expired) {
    return (
      <div className="space-y-3 rounded-md border border-destructive/40 bg-destructive/5 p-3">
        <p className="text-sm font-medium text-destructive">Mã QR đã hết hạn</p>
        <p className="text-xs text-muted-foreground">
          Tạo mã mới cho khách quét {formatVND(due > 0 ? due : payment.amount)}, hoặc thu tiền mặt.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={onReissue} disabled={reissuing}>
            {reissuing ? "Đang tạo..." : "Tạo lại mã QR"}
          </Button>
          <Button variant="outline" onClick={onPayCash}>
            Thu tiền mặt
          </Button>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-3 rounded-md border p-3">
      <p className="text-sm font-medium">
        Khách quét mã để chuyển {formatVND(payment.amount)}
      </p>
      {due > 0 && due !== payment.amount && (
        <p className="text-xs text-muted-foreground">Còn phải thu của đơn: {formatVND(due)}</p>
      )}
      {payment.qrUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- ảnh VietQR từ dịch vụ ngoài
        <img
          src={payment.qrUrl}
          alt="Mã QR chuyển khoản"
          className="mx-auto w-60 max-w-full"
        />
      )}
      <p className="text-center text-xs text-muted-foreground">
        Nội dung chuyển khoản: {payment.reference}
      </p>
      <QrCountdown label={countdown.label} remainingMs={countdown.remainingMs} />
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={onCheck} disabled={checking}>
          {checking ? "Đang kiểm tra..." : "Kiểm tra tiền về"}
        </Button>
        <Button variant="outline" onClick={onPayCash}>
          Khách không chuyển - thu tiền mặt
        </Button>
      </div>
    </div>
  );
}

export function DeliverySheet({
  shipmentId,
  onClose,
  onChanged,
}: DeliverySheetProps) {
  const [state, setState] = useState<DetailState>({ status: "loading" });
  const [action, setAction] = useState<OpenAction>(null);
  // Tải lại sheet sau một thao tác ghi; thao tác ghi còn báo trang tải lại danh sách.
  const [reloadKey, setReloadKey] = useState(0);
  const [checking, setChecking] = useState(false);
  const [reissuing, setReissuing] = useState(false);

  useEffect(() => {
    if (!shipmentId) return;
    let cancelled = false;
    shipmentApi.getById(shipmentId).then(
      (shipment) => {
        if (!cancelled) setState({ status: "ready", shipment });
      },
      () => {
        if (!cancelled) setState({ status: "error" });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [shipmentId, reloadKey]);

  const reloadSheet = () => setReloadKey((key) => key + 1);

  /** "Kiểm tra tiền về": đọc lại lần giao; tiền vẫn chưa về thì nói rõ để shipper chờ hoặc đổi sang tiền mặt. */
  const checkPayment = () => {
    if (!shipmentId || checking) return;
    setChecking(true);
    shipmentApi
      .getById(shipmentId)
      .then((fresh) => {
        setState({ status: "ready", shipment: fresh });
        if (fresh.payment?.status === "PENDING" || fresh.payment?.status === "EXPIRED") {
          toast.info("Chưa thấy tiền về - đợi thêm hoặc thu tiền mặt");
        } else {
          onChanged();
        }
      })
      .catch(() => toast.error("Không tải được lần giao, vui lòng thử lại"))
      .finally(() => setChecking(false));
  };

  /** "Tạo lại mã QR" khi mã hết hạn: hiện ngay lần giao server trả về (mã mới, hoặc mã cũ nếu vẫn còn hạn). */
  const reissueQr = () => {
    if (!shipmentId || reissuing) return;
    setReissuing(true);
    shipmentApi
      .reissueQr(shipmentId)
      .then((fresh) => {
        setState({ status: "ready", shipment: fresh });
        toast.success("Đã tạo mã QR mới");
        onChanged();
      })
      .catch((error: unknown) => {
        if (reportShipmentError(error, "Không tạo lại được mã QR, vui lòng thử lại")) afterWrite();
      })
      .finally(() => setReissuing(false));
  };

  /** Thao tác ghi xong (hoặc dữ liệu đã cũ): đóng dialog, tải lại sheet và danh sách. */
  const afterWrite = () => {
    setAction(null);
    reloadSheet();
    onChanged();
  };

  /** Chạy một thao tác ghi: thành công → báo; dữ liệu cũ → cũng tải lại; lỗi khác → giữ dialog để thử lại. */
  const run = (
    call: () => Promise<unknown>,
    success: string,
    fallback: string,
  ) =>
    call().then(
      () => {
        toast.success(success);
        afterWrite();
      },
      (error: unknown) => {
        if (reportShipmentError(error, fallback)) afterWrite();
      },
    );

  const shipment = state.status === "ready" ? state.shipment : null;

  return (
    <Sheet
      open={shipmentId !== null}
      onOpenChange={(open) => !open && onClose()}
    >
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Đơn {shipment?.order.code ?? ""}</SheetTitle>
          <SheetDescription>
            {shipment ? (
              <ShipmentStatusBadge status={shipment.status} />
            ) : (
              loadingText(state)
            )}
          </SheetDescription>
        </SheetHeader>

        {shipment && (
          <div className="space-y-5 px-4 pb-6">
            <div className="space-y-2">
              <Field label="Người nhận">{shipment.recipientName}</Field>
              <Field label="Điện thoại">
                {shipment.recipientPhone && (
                  <a
                    href={`tel:${shipment.recipientPhone}`}
                    className="text-primary underline"
                  >
                    {shipment.recipientPhone}
                  </a>
                )}
              </Field>
              <Field label="Địa chỉ">{shipment.deliveryAddress}</Field>
              <Field label="Hẹn giao">
                {[shipment.scheduledDate?.slice(0, 10), shipment.scheduledSlot]
                  .filter(Boolean)
                  .join(" · ")}
              </Field>
              <Field label="Lắp đặt">
                {shipment.requiresInstallation ? "Có" : "Không"}
              </Field>
              <Field label="Còn phải thu">
                <span className="font-semibold">
                  {amountDueText(shipment)}
                </span>
              </Field>
              <Field label="Ghi chú">{shipment.note}</Field>
            </div>

            {/* Mới được gán: tới kho lấy hàng rồi xác nhận thì đơn mới sang ĐVVC đã lấy hàng (chốt 2026-10-15). */}
            {shipment.status === "CREATED" && (
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => setAction("pickUp")}>Xác nhận đã lấy hàng</Button>
              </div>
            )}

            {isOnTheRoad(shipment.status) && (
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => setAction("deliver")}>Giao hàng thành công</Button>
                <Button
                  variant="outline"
                  onClick={() => setAction("outForDelivery")}
                >
                  Cập nhật trạng thái đơn hàng
                </Button>
                {shipment.status !== "FAILED" && (
                  <Button variant="destructive" onClick={() => setAction("fail")}>
                    Giao hàng thất bại
                  </Button>
                )}
              </div>
            )}

            {shipment.payment && (
              <QrPaymentPanel
                payment={shipment.payment}
                due={shipment.order.amountDue}
                checking={checking}
                reissuing={reissuing}
                onCheck={checkPayment}
                onPayCash={() => setAction("payCash")}
                onReissue={reissueQr}
              />
            )}

            <Separator />

            <div className="space-y-3">
              <p className="text-sm font-medium">Trạng thái đơn hàng</p>
              <ShipmentTimeline shipment={shipment} />
            </div>

            <DeliverDialog
              key={`deliver-${action === "deliver"}`}
              shipment={shipment}
              open={action === "deliver"}
              onClose={() => setAction(null)}
              onDelivered={(delivered) => {
                setAction(null);
                // Hiện ngay kết quả (có mã QR nếu thu QR), không chờ tải lại.
                setState({ status: "ready", shipment: delivered });
                onChanged();
              }}
              onNeedsReload={afterWrite}
            />
            <ShipmentNoteDialog
              key={`pickup-${action === "pickUp"}`}
              open={action === "pickUp"}
              title="Xác nhận đã lấy hàng"
              description="Xác nhận đã nhận đủ hàng của đơn tại kho. Đơn chuyển sang ĐVVC đã lấy hàng; tồn kho chưa bị trừ."
              confirmLabel="Đã lấy hàng"
              placeholder="Ghi chú (vd. thùng 2 móp góc)"
              onClose={() => setAction(null)}
              onConfirm={(note) =>
                run(
                  () => shipmentApi.pickUp(shipment.id, note),
                  `Đã lấy hàng đơn ${shipment.order.code}`,
                  "Xác nhận lấy hàng thất bại, vui lòng thử lại",
                )
              }
            />
            <ShipmentNoteDialog
              key={`out-${action === "outForDelivery"}`}
              open={action === "outForDelivery"}
              title="Đang đi giao"
              description="Ghi nhật trình: bạn đang trên đường tới khách."
              confirmLabel="Ghi nhật trình"
              placeholder="vd. Còn 15 phút tới nơi"
              onClose={() => setAction(null)}
              onConfirm={(note) =>
                run(
                  () =>
                    shipmentApi.addEvent(shipment.id, {
                      status: "OUT_FOR_DELIVERY",
                      note,
                    }),
                  "Đã ghi nhật trình",
                  "Ghi nhật trình thất bại, vui lòng thử lại",
                )
              }
            />
            <ShipmentNoteDialog
              key={`fail-${action === "fail"}`}
              open={action === "fail"}
              title="Giao không thành"
              description="Đơn giữ trạng thái Đang vận chuyển, bạn vẫn giao lại được trong lần thử tiếp. Người phụ trách đơn và chủ shop sẽ được báo; đơn chỉ chuyển Hoàn trả khi shop xác nhận hàng đã về."
              confirmLabel="Xác nhận giao không thành"
              placeholder="Lý do (bắt buộc), vd. khách không nghe máy"
              requireNote
              destructive
              onClose={() => setAction(null)}
              onConfirm={(note) =>
                run(
                  () => shipmentApi.fail(shipment.id, note ?? ""),
                  "Đã ghi nhận giao không thành",
                  "Báo giao không thành thất bại, vui lòng thử lại",
                )
              }
            />
            <ShipmentNoteDialog
              key={`cash-${action === "payCash"}`}
              open={action === "payCash"}
              title="Thu tiền mặt thay chuyển khoản"
              description={`Khách không chuyển khoản (hoặc chuyển thiếu): huỷ mã QR còn mở và ghi bạn đã thu ${formatVND(
                shipment.order.amountDue > 0 ? shipment.order.amountDue : (shipment.payment?.amount ?? 0),
              )} tiền mặt - đúng số còn phải thu. Bạn giữ tiền cho tới khi nộp lại cho chủ.`}
              confirmLabel="Đã thu tiền mặt"
              onClose={() => setAction(null)}
              onConfirm={(note) =>
                run(
                  () => shipmentApi.payCash(shipment.id, note),
                  "Đã ghi nhận thu tiền mặt",
                  "Ghi nhận tiền mặt thất bại, vui lòng thử lại",
                )
              }
            />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
