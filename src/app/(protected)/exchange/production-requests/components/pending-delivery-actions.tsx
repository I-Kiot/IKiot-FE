"use client";

import * as React from "react";
import { toast } from "sonner";
import { PermissionButton } from "@/components/permission-button";
import { allows } from "@/components/sidebar/constants/role-permissions";
import { getSessionRole } from "@/lib/auth";
import { getApiErrorBody } from "@/lib/api/error-codes";
import { productionDeliveryApi } from "@/lib/api/production-delivery";
import { useProductionListAlertsStore } from "@/store/production-list-alerts-store";
import type { ProductionDelivery, ProductionDeliverySummary } from "@/types/order-flow";
import { CancelDeliveryDialog } from "./cancel-delivery-dialog";
import { ReceiveDeliveryDialog } from "./receive-delivery-dialog";

type Props = {
  delivery: ProductionDeliverySummary;
  /** Phiếu đã đổi trạng thái (nhận, từ chối, hoặc người khác vừa xử lý trước): bảng tải lại. */
  onChanged: () => void;
};

/** Nút "Nhận hàng" / "Từ chối" cho phiếu giao xưởng đang chờ. */
export function PendingDeliveryActions({ delivery, onChanged }: Props) {
  const canReceive = allows(getSessionRole(), "production", "receive");
  // Nhận hàng đổi tồn kho nên danh sách cần sản xuất (và badge của nó) cũng đổi.
  const refreshProductionNeed = useProductionListAlertsStore((state) => state.fetchNeed);

  const [loading, setLoading] = React.useState(false);
  const [receiving, setReceiving] = React.useState<ProductionDelivery | null>(null);
  const [refusing, setRefusing] = React.useState(false);

  function changed() {
    void refreshProductionNeed();
    onChanged();
  }

  async function openReceive() {
    setLoading(true);
    try {
      const full = await productionDeliveryApi.getById(delivery.id);
      if (full.status !== "PENDING") {
        toast.info(`Phiếu ${full.code} không còn chờ nhận`);
        changed();
        return;
      }
      setReceiving(full);
    } catch (error) {
      toast.error(getApiErrorBody(error)?.message ?? "Không tải được phiếu giao");
    } finally {
      setLoading(false);
    }
  }

  async function refuse(reason: string) {
    try {
      await productionDeliveryApi.cancel(delivery.id, reason);
      toast.success(`Đã từ chối phiếu giao ${delivery.code}`);
      setRefusing(false);
      changed();
    } catch (error) {
      toast.error(getApiErrorBody(error)?.message ?? "Không từ chối được phiếu giao");
      // Phiếu có thể vừa được người khác nhận / xưởng rút: tải lại để bảng đúng.
      changed();
      // Ném lại để CancelDeliveryDialog giữ nguyên lý do.
      throw error;
    }
  }

  return (
    <>
      <PermissionButton
        allowed={canReceive}
        permission="production:receive"
        size="sm"
        disabled={loading}
        onClick={() => void openReceive()}
      >
        {loading ? "Đang tải..." : "Nhận hàng"}
      </PermissionButton>
      <PermissionButton
        allowed={canReceive}
        permission="production:receive"
        size="sm"
        variant="outline"
        disabled={loading}
        onClick={() => setRefusing(true)}
      >
        Từ chối
      </PermissionButton>

      {receiving && (
        <ReceiveDeliveryDialog
          key={receiving.id}
          delivery={receiving}
          open
          onOpenChange={(open) => {
            if (open) return;
            setReceiving(null);
            // Đóng mà chưa nhận (có thể vì phiếu đã được xử lý): vẫn tải lại cho chắc.
            changed();
          }}
          onReceived={() => {
            setReceiving(null);
            changed();
          }}
        />
      )}
      <CancelDeliveryDialog
        open={refusing}
        onOpenChange={setRefusing}
        title={`Từ chối phiếu giao ${delivery.code}`}
        description="Sai hàng hoặc không có hàng. Phiếu chưa đụng tồn kho; xưởng sẽ được báo kèm lý do."
        confirmLabel="Từ chối"
        onConfirm={refuse}
      />
    </>
  );
}
