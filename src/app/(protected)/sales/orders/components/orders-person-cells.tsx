"use client";

// Ô "Phụ trách" và "Người giao hàng" của danh sách đơn: chọn người ngay tại dòng (2026-11-08).
// Danh sách người chỉ tải khi mở ô, nên mở trang không tốn thêm request nào. Luật thật ở BE:
// đổi người phụ trách là `assertReassignAccess`, đổi shipper là `assertOrderStepAccess(CHANGE_DRIVER)`.

import * as React from "react";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { warnNoPermission } from "@/components/permission-button";
import { allows } from "@/components/sidebar/constants/role-permissions";
import { getApiErrorBody, messageForCode } from "@/lib/api/error-codes";
import { orderJourneyApi } from "@/lib/api/order-journey";
import { shipmentApi } from "@/lib/api/shipment";
import { getSessionRole, getSessionUserId } from "@/lib/auth";
import { cn } from "@/lib/utils";
import {
  personName,
  type OrderListItem,
  type OrderStatus,
  type ShipmentStatus,
} from "@/types/order-flow";
import { useOrders } from "./orders-provider";

/** Đổi người phụ trách được tới trước Đang vận chuyển (BE `UNSHIPPED_ORDER_STATUSES`). */
const REASSIGNABLE_STATUSES: readonly OrderStatus[] = ["CONFIRMED", "PACKED", "PICKED_UP"];
/** Đổi shipper khi hàng còn ở shop (BE `DRIVER_CHANGEABLE_STATUSES`). */
const DRIVER_CHANGEABLE: readonly ShipmentStatus[] = ["CREATED", "PICKED_UP"];

const WHO_REASSIGN = "Chủ shop, người đang phụ trách đơn, hoặc nhân viên có quyền này mới đổi được.";
const WHO_DRIVER = "Chủ shop, người phụ trách đơn, hoặc nhân viên có quyền này tại kho xuất mới đổi được.";

interface Option {
  id: string;
  label: string;
}

function errorText(error: unknown, fallback: string): string {
  return messageForCode(getApiErrorBody(error)?.code) ?? fallback;
}

function isOwner(): boolean {
  const role = getSessionRole();
  return role === "TENANT_OWNER" || role === "ADMIN";
}

interface PersonSelectProps {
  current: { id: string; name: string } | null;
  allowed: boolean;
  permission: string;
  who: string;
  /** Tải danh sách mỗi lần mở: người vừa bị khoá tài khoản không còn trong đó. */
  load: () => Promise<Option[]>;
  save: (id: string) => Promise<void>;
}

/** Ô chọn người trong một dòng. Không có quyền thì mờ đi, bấm vào báo cần quyền gì (như `PermissionButton`). */
function PersonSelect({ current, allowed, permission, who, load, save }: PersonSelectProps) {
  const [options, setOptions] = React.useState<Option[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const shown = options ?? (current ? [{ id: current.id, label: current.name }] : []);
  const triggerClass = "h-8 w-44 cursor-pointer text-sm";

  if (!allowed) {
    return (
      <button
        type="button"
        aria-disabled
        className={cn(
          triggerClass,
          "flex items-center justify-between gap-2 rounded-md border px-3 opacity-50 cursor-not-allowed",
        )}
        onClick={(event) => {
          event.stopPropagation();
          warnNoPermission(permission, who);
        }}
      >
        <span className="truncate">{current?.name ?? "-"}</span>
        <ChevronDown className="size-4 opacity-50" />
      </button>
    );
  }

  const onOpenChange = (open: boolean) => {
    if (!open) return;
    setLoading(true);
    load()
      .then(setOptions, (error: unknown) => {
        toast.error(errorText(error, "Không tải được danh sách người"));
      })
      .finally(() => setLoading(false));
  };

  const pick = (id: string) => {
    if (id === current?.id || saving) return;
    setSaving(true);
    save(id)
      .catch((error: unknown) => {
        toast.error(errorText(error, "Không đổi được người"));
      })
      .finally(() => setSaving(false));
  };

  return (
    // Item của Select nằm trong portal nhưng sự kiện React vẫn nổi lên tới dòng: chặn ở đây để chọn không mở / đóng dòng.
    <div onClick={(event) => event.stopPropagation()}>
      <Select value={current?.id ?? ""} onValueChange={pick} onOpenChange={onOpenChange} disabled={saving}>
        <SelectTrigger size="sm" className={triggerClass}>
          <SelectValue placeholder="Chọn người" />
        </SelectTrigger>
        <SelectContent>
          {loading && <div className="px-2 py-1.5 text-sm text-muted-foreground">Đang tải...</div>}
          {shown.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/** Cột "Phụ trách": đổi người phụ trách khi đơn chưa đi giao. */
export function AssigneeCell({ order }: { order: OrderListItem }) {
  const { patchOrder } = useOrders();
  const editable =
    order.fulfillmentType !== "TAKEAWAY" && REASSIGNABLE_STATUSES.includes(order.status);
  if (!editable) return <span className="text-sm">{order.assignee?.name ?? "-"}</span>;

  const me = getSessionUserId();
  const allowed =
    isOwner() ||
    (me !== undefined && order.assignee?.id === me) ||
    allows(getSessionRole(), "orders", "update");

  return (
    <PersonSelect
      current={order.assignee}
      allowed={allowed}
      permission="orders:update"
      who={WHO_REASSIGN}
      load={async () =>
        (await orderJourneyApi.assignees(order.id)).map((person) => {
          const tags = [person.isOwner ? "chủ shop" : null, person.id === me ? "tôi" : null].filter(
            Boolean,
          );
          return {
            id: person.id,
            label: tags.length > 0 ? `${person.name} (${tags.join(", ")})` : person.name,
          };
        })
      }
      save={async (assigneeId) => {
        const updated = await orderJourneyApi.assign(order.id, assigneeId);
        patchOrder(order.id, { assignee: updated.assignee, updatedAt: updated.updatedAt });
        toast.success(`Đã giao đơn ${order.code} cho ${updated.assignee?.name ?? "người mới"}`);
      }}
    />
  );
}

/** Cột "Người giao hàng": chỉ đổi shipper đã gán của lần giao nội bộ còn ở shop; gán lần đầu vẫn ở trang chi tiết. */
export function DriverCell({ order }: { order: OrderListItem }) {
  const { patchOrder } = useOrders();
  const shipment = order.latestShipment;
  const name = shipment?.status === "CANCELLED" ? null : order.driver?.name;
  const changeable =
    shipment !== null &&
    shipment.carrierType === "INTERNAL" &&
    DRIVER_CHANGEABLE.includes(shipment.status) &&
    order.driver !== null;
  if (!changeable) return <span className="text-sm">{name ?? "-"}</span>;

  const me = getSessionUserId();
  const allowed =
    isOwner() ||
    (me !== undefined && order.assignee?.id === me) ||
    allows(getSessionRole(), "shipments", "update");

  return (
    <PersonSelect
      current={order.driver}
      allowed={allowed}
      permission="shipments:update"
      who={WHO_DRIVER}
      load={async () =>
        (await shipmentApi.getDrivers(order.id)).map((driver) => {
          const tags = [
            driver.systemRole === "TENANT_OWNER" ? "chủ shop" : null,
            driver.isAssignee ? "người phụ trách" : null,
          ].filter(Boolean);
          const label = personName(driver);
          return { id: driver.id, label: tags.length > 0 ? `${label} (${tags.join(", ")})` : label };
        })
      }
      save={async (driverId) => {
        const updated = await shipmentApi.changeDriver(shipment.id, driverId);
        const driver = updated.driver
          ? { id: updated.driver.id, name: personName(updated.driver), phoneNumber: updated.driver.phoneNumber }
          : null;
        patchOrder(order.id, { driver });
        toast.success(`Đã đổi shipper đơn ${order.code} thành ${driver?.name ?? "người mới"}`);
      }}
    />
  );
}
