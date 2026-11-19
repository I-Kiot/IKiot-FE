"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { InboundSource } from "@/app/(protected)/exchange/shared/inbound-source";
import type { DraftLine } from "@/app/(protected)/exchange/production-requests/components/production-request-form-dialog";
import type { ProductionRequest } from "@/types/order-flow";
import { CREATE_INBOUND_COPY, CreateInboundPanes, useInboundSourceSwitch } from "./create-inbound-panes";
import { InboundSourceToggle } from "./inbound-source-toggle";

type Props = {
  defaultSource: InboundSource;
  options: InboundSource[];
  onOpenChange: (open: boolean) => void;
  onImportCreated: () => void;
  onRequestCreated: (request: ProductionRequest) => void;
  /** Điền sẵn dòng cho form xưởng (nút "Tạo YCSX" trên đơn hàng). */
  initialRequestLines?: DraftLine[];
  /** Điền sẵn nơi nhận hàng cho form xưởng (kho xuất của đơn). */
  initialRequestLocationId?: string;
};

/**
 * Popup "Tạo mới" của nút "Tạo YCSX" trên đơn hàng (màn Nhập hàng dùng trang `/exchange/imports/new`).
 * Toggle chọn nguồn, form đổi theo; chỉ mount khi mở.
 */
export function CreateInboundDialog({
  defaultSource,
  options,
  onOpenChange,
  onImportCreated,
  onRequestCreated,
  initialRequestLines,
  initialRequestLocationId,
}: Props) {
  const { source, opened, select } = useInboundSourceSwitch(defaultSource);
  const [submitting, setSubmitting] = useState(false);

  // Đang gửi thì không cho đóng: kết quả về sau khi đóng sẽ làm mất bản nháp của form còn lại mà người dùng không hay biết.
  function requestClose(open: boolean) {
    if (!open && submitting) return;
    onOpenChange(open);
  }

  return (
    <Dialog open onOpenChange={requestClose}>
      <DialogContent className="flex h-[94vh] flex-col gap-0 p-0 sm:max-w-[min(1200px,96vw)]">
        <DialogHeader className="gap-3 border-b px-6 pt-6 pb-4">
          <DialogTitle>{CREATE_INBOUND_COPY[source].title}</DialogTitle>
          <DialogDescription>{CREATE_INBOUND_COPY[source].description}</DialogDescription>
          <InboundSourceToggle
            value={source}
            options={options}
            onChange={select}
            disabled={submitting}
          />
        </DialogHeader>

        <CreateInboundPanes
          source={source}
          opened={opened}
          onImportCreated={onImportCreated}
          onRequestCreated={onRequestCreated}
          onCancel={() => requestClose(false)}
          onSubmittingChange={setSubmitting}
          initialRequestLines={initialRequestLines}
          initialRequestLocationId={initialRequestLocationId}
        />
      </DialogContent>
    </Dialog>
  );
}
