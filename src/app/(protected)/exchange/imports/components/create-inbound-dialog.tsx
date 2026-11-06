"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { InboundSource } from "@/app/(protected)/exchange/shared/inbound-source";
import {
  PRODUCTION_REQUEST_FORM_DESCRIPTION,
  ProductionRequestForm,
} from "@/app/(protected)/exchange/production-requests/components/production-request-form-dialog";
import type { ProductionRequest } from "@/types/order-flow";
import { ImportCreateForm } from "./import-create-form";
import { InboundSourceToggle } from "./inbound-source-toggle";

const COPY: Record<InboundSource, { title: string; description: string }> = {
  SUPPLIER: {
    title: "Tạo đơn nhập hàng",
    description: "Mua hàng từ nhà cung cấp. Tồn kho chỉ tăng khi nhận hàng.",
  },
  WORKSHOP: {
    title: "Tạo yêu cầu sản xuất",
    description: PRODUCTION_REQUEST_FORM_DESCRIPTION,
  },
};

type Props = {
  defaultSource: InboundSource;
  options: InboundSource[];
  onOpenChange: (open: boolean) => void;
  onImportCreated: () => void;
  onRequestCreated: (request: ProductionRequest) => void;
};

/**
 * Dialog "Tạo mới": toggle chọn nguồn, form đổi theo. Chỉ mount khi mở.
 * Form đã mở một lần được giữ mount và chỉ ẩn đi, để đổi qua lại không mất phần đang nhập;
 * form chưa từng chọn thì chưa mount, nên chưa tải cả catalog khi chưa cần.
 */
export function CreateInboundDialog({
  defaultSource,
  options,
  onOpenChange,
  onImportCreated,
  onRequestCreated,
}: Props) {
  const [source, setSource] = useState(defaultSource);
  const [opened, setOpened] = useState<InboundSource[]>([defaultSource]);
  const [submitting, setSubmitting] = useState(false);

  function select(next: InboundSource) {
    setSource(next);
    setOpened((prev) => (prev.includes(next) ? prev : [...prev, next]));
  }

  // Đang gửi thì không cho đóng: kết quả về sau khi đóng sẽ làm mất bản nháp của form còn lại mà người dùng không hay biết.
  function requestClose(open: boolean) {
    if (!open && submitting) return;
    onOpenChange(open);
  }

  const paneClass = (pane: InboundSource) =>
    cn("flex min-h-0 flex-1 flex-col", source !== pane && "hidden");

  return (
    <Dialog open onOpenChange={requestClose}>
      <DialogContent className="flex h-[94vh] flex-col gap-0 p-0 sm:max-w-[min(1200px,96vw)]">
        <DialogHeader className="gap-3 border-b px-6 pt-6 pb-4">
          <DialogTitle>{COPY[source].title}</DialogTitle>
          <DialogDescription>{COPY[source].description}</DialogDescription>
          <InboundSourceToggle
            value={source}
            options={options}
            onChange={select}
            disabled={submitting}
          />
        </DialogHeader>

        {opened.includes("SUPPLIER") && (
          <div className={paneClass("SUPPLIER")}>
            <ImportCreateForm
              onCreated={onImportCreated}
              onCancel={() => requestClose(false)}
              onSubmittingChange={setSubmitting}
            />
          </div>
        )}
        {opened.includes("WORKSHOP") && (
          <div className={paneClass("WORKSHOP")}>
            <ProductionRequestForm
              onSaved={onRequestCreated}
              onCancel={() => requestClose(false)}
              onSubmittingChange={setSubmitting}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
