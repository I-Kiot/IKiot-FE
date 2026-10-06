"use client";

// Dialog "Đã giao" của shipper (POST /shipments/:id/deliver): chụp ảnh bằng chứng, chọn cách thu tiền.

import { useState } from "react";
import { X } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { shipmentApi } from "@/lib/api/shipment";
import { uploadImage } from "@/lib/api/upload";
import type { DeliveryCollectionMethod, Shipment } from "@/types/order-flow";
import { formatVND, reportShipmentError } from "../../shipments/components/shipment-ui";

interface DeliverDialogProps {
  shipment: Shipment;
  open: boolean;
  onClose: () => void;
  /** Giao xong: lần giao mới (có `payment.qrUrl` nếu thu QR) để màn hình hiện tiếp. */
  onDelivered: (shipment: Shipment) => void;
  /** Lần giao vừa đổi ở nơi khác (người khác vừa xác nhận / báo thất bại) – tải lại. */
  onNeedsReload: () => void;
}

/**
 * Chỉ thu đủ 100% (chốt 2026-10-06): số thu luôn bằng số còn phải thu, không cho sửa. Đã cọc đủ thì
 * không có gì phải thu. Ảnh tải lên ngay khi chọn; nút xác nhận khoá khi chưa có ảnh hoặc đang tải.
 * Nơi gọi đặt `key` theo lần mở nên mỗi lần mở là form trống.
 */
export function DeliverDialog({ shipment, open, onClose, onDelivered, onNeedsReload }: DeliverDialogProps) {
  const amountDue = shipment.order.amountDue;
  const nothingDue = amountDue === 0;

  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(0);
  const [method, setMethod] = useState<DeliveryCollectionMethod>(nothingDue ? "NONE" : "CASH");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const busy = submitting || uploading > 0;
  const canSubmit = !busy && photoUrls.length > 0;

  /** Tải từng ảnh lên ngay khi chọn; ảnh nào lỗi thì báo và bỏ qua ảnh đó. */
  const addPhotos = (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      setUploading((count) => count + 1);
      uploadImage(file)
        .then((url) => setPhotoUrls((urls) => [...urls, url]))
        .catch(() => toast.error(`Tải ảnh ${file.name} thất bại`))
        .finally(() => setUploading((count) => count - 1));
    }
  };

  const removePhoto = (url: string) => setPhotoUrls((urls) => urls.filter((u) => u !== url));

  const submit = () => {
    // Khoá nút trong lúc gọi: bấm đúp không gửi hai request.
    if (!canSubmit) return;
    setSubmitting(true);
    shipmentApi
      .deliver(shipment.id, {
        proofPhotoUrls: photoUrls,
        paymentMethod: method,
        collectedAmount: nothingDue ? 0 : amountDue,
        note: note.trim() || undefined,
      })
      .then((delivered) => {
        toast.success(`Đã giao đơn ${shipment.order.code}`);
        onDelivered(delivered);
      })
      .catch((error: unknown) => {
        if (reportShipmentError(error, "Xác nhận đã giao thất bại, vui lòng thử lại")) onNeedsReload();
      })
      .finally(() => setSubmitting(false));
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && !busy && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Đã giao đơn {shipment.order.code}</DialogTitle>
          <DialogDescription>
            {nothingDue ? "Đơn đã cọc đủ, không còn gì phải thu." : `Còn phải thu: ${formatVND(amountDue)}.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Ảnh bằng chứng giao hàng</Label>
            <Input
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              disabled={busy}
              onChange={(event) => {
                addPhotos(event.target.files);
                event.target.value = "";
              }}
            />
            {uploading > 0 && <p className="text-xs text-muted-foreground">Đang tải {uploading} ảnh...</p>}
            {photoUrls.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {photoUrls.map((url) => (
                  <div key={url} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element -- ảnh Cloudinary xem trước, không cần tối ưu */}
                    <img src={url} alt="Ảnh bằng chứng" className="size-16 rounded-md object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(url)}
                      disabled={busy}
                      className="absolute -right-1 -top-1 rounded-full bg-background p-0.5 shadow"
                      aria-label="Bỏ ảnh"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {!nothingDue && (
            <div className="space-y-2">
              <Label>Khách trả bằng</Label>
              <RadioGroup
                value={method}
                onValueChange={(value) => setMethod(value as DeliveryCollectionMethod)}
                className="flex gap-6"
              >
                <Label className="flex items-center gap-2 font-normal">
                  <RadioGroupItem value="CASH" /> Tiền mặt
                </Label>
                <Label className="flex items-center gap-2 font-normal">
                  <RadioGroupItem value="BANK_TRANSFER_QR" /> Chuyển khoản QR
                </Label>
              </RadioGroup>
              {method === "BANK_TRANSFER_QR" && (
                <p className="text-xs text-muted-foreground">
                  Sau khi xác nhận sẽ hiện mã QR cho khách quét. Đơn hoàn thành khi tiền về tài khoản.
                </p>
              )}
            </div>
          )}

          <Textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="Ghi chú" />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Huỷ
          </Button>
          <Button onClick={submit} disabled={!canSubmit}>
            {submitting ? "Đang xử lý..." : "Xác nhận đã giao"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
