"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { InboundSource } from "@/app/(protected)/exchange/shared/inbound-source";
import {
  PRODUCTION_REQUEST_FORM_DESCRIPTION,
  ProductionRequestForm,
  type DraftLine,
} from "@/app/(protected)/exchange/production-requests/components/production-request-form-dialog";
import type { ProductionRequest } from "@/types/order-flow";
import { ImportCreateForm } from "./import-create-form";

/** Tiêu đề / mô tả theo nguồn, dùng chung cho dialog "Tạo mới" và trang `/exchange/imports/new`. */
export const CREATE_INBOUND_COPY: Record<InboundSource, { title: string; description: string }> = {
  SUPPLIER: {
    title: "Tạo đơn nhập hàng",
    description: "Mua hàng từ nhà cung cấp. Tồn kho chỉ tăng khi nhận hàng.",
  },
  WORKSHOP: {
    title: "Tạo yêu cầu sản xuất",
    description: PRODUCTION_REQUEST_FORM_DESCRIPTION,
  },
};

/** Giữ mount form đã mở để đổi qua lại không mất dữ liệu. */
export function useInboundSourceSwitch(defaultSource: InboundSource) {
  const [source, setSource] = useState(defaultSource);
  const [opened, setOpened] = useState<InboundSource[]>([defaultSource]);

  function select(next: InboundSource) {
    setSource(next);
    setOpened((prev) => (prev.includes(next) ? prev : [...prev, next]));
  }

  return { source, opened, select };
}

type Props = {
  source: InboundSource;
  opened: InboundSource[];
  onImportCreated: () => void;
  onRequestCreated: (request: ProductionRequest) => void;
  onCancel: () => void;
  onSubmittingChange: (submitting: boolean) => void;
  /** Điền sẵn dòng cho form xưởng (nút "Tạo YCSX" trên đơn hàng). */
  initialRequestLines?: DraftLine[];
  /** Điền sẵn nơi nhận hàng cho form xưởng (kho xuất của đơn). */
  initialRequestLocationId?: string;
};

/** Hai form tạo mới (nhà cung cấp / xưởng) xếp chồng, chỉ hiện form của nguồn đang chọn. */
export function CreateInboundPanes({
  source,
  opened,
  onImportCreated,
  onRequestCreated,
  onCancel,
  onSubmittingChange,
  initialRequestLines,
  initialRequestLocationId,
}: Props) {
  const paneClass = (pane: InboundSource) =>
    cn("flex min-h-0 flex-1 flex-col", source !== pane && "hidden");

  return (
    <>
      {opened.includes("SUPPLIER") && (
        <div className={paneClass("SUPPLIER")}>
          <ImportCreateForm
            onCreated={onImportCreated}
            onCancel={onCancel}
            onSubmittingChange={onSubmittingChange}
          />
        </div>
      )}
      {opened.includes("WORKSHOP") && (
        <div className={paneClass("WORKSHOP")}>
          <ProductionRequestForm
            initialLines={initialRequestLines}
            initialLocationId={initialRequestLocationId}
            onSaved={onRequestCreated}
            onCancel={onCancel}
            onSubmittingChange={onSubmittingChange}
          />
        </div>
      )}
    </>
  );
}
