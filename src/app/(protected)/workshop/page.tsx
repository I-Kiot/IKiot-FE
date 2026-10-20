"use client";

// Màn của nhân viên xưởng (2026-10-09): các YCSX đã gửi cho xưởng mình ở mọi kho / chi nhánh.
// Bấm một YCSX để tạo phiếu giao (giao thiếu được) hoặc rút lại phiếu đang chờ nhận. Dùng được trên điện thoại.

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { workshopApi } from "@/lib/api/production-delivery";
import { useAuth } from "@/store/hooks/use-auth";
import {
  PRODUCTION_REQUEST_STATUS_LABELS,
  type ProductionRequest,
  type WorkshopProductionRequestQuery,
} from "@/types/order-flow";
import {
  formatDate,
  requestProgress,
  requestStatusDisplay,
} from "../exchange/production-requests/shared/production-display";
import { WorkshopRequestSheet } from "./components/workshop-request-sheet";

type ListState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; requests: ProductionRequest[] };

type StatusFilter = NonNullable<WorkshopProductionRequestQuery["status"]> | "ALL";

const STATUS_OPTIONS: StatusFilter[] = ["ALL", "SENT", "PARTIALLY_RECEIVED", "COMPLETED", "CANCELLED"];

/** Một YCSX: mã, nơi nhận, ngày hẹn, đã nhận / đặt, số đang chờ nhận. */
function RequestCard({ request, onOpen }: { request: ProductionRequest; onOpen: () => void }) {
  const { ordered, received } = requestProgress(request);
  const pending = request.items.reduce((sum, line) => sum + line.pendingDeliveryQuantity, 0);
  const badge = requestStatusDisplay(request.status, request.closedShort);
  return (
    <Card className="cursor-pointer py-4 transition-colors hover:bg-muted/40" onClick={onOpen}>
      <CardContent className="space-y-2 px-4">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium">{request.code}</span>
          <Badge variant={badge.variant}>{badge.label}</Badge>
        </div>
        <p className="text-sm">Giao về {request.location.name}</p>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Hẹn xong {formatDate(request.expectedReadyDate)}</span>
          <span className="font-semibold tabular-nums">
            Đã nhận {received}/{ordered}
            {pending > 0 && <span className="text-amber-600"> · chờ nhận {pending}</span>}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function WorkshopPage() {
  const { user } = useAuth();
  const linked = Boolean(user?.workshopId);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [state, setState] = useState<ListState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    if (!linked) return;
    let cancelled = false;
    workshopApi
      .getRequests({ page: 1, limit: 100, status: statusFilter === "ALL" ? undefined : statusFilter })
      .then(
        (page) => {
          if (!cancelled) setState({ status: "ready", requests: page.data });
        },
        () => {
          if (!cancelled) setState({ status: "error" });
        },
      );
    return () => {
      cancelled = true;
    };
  }, [linked, statusFilter, reloadKey]);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <PageHeader
        breadcrumbs={[{ label: "Trang chủ", href: "/dashboard" }, { label: "Xưởng của tôi" }]}
        title={user?.workshop ? `Xưởng – ${user.workshop.supplierName}` : "Xưởng của tôi"}
        description="Yêu cầu sản xuất gửi cho xưởng ở mọi kho. Làm xong phần nào, tạo phiếu giao phần đó - nơi nhận kiểm hàng rồi mới nhập kho."
        actions={
          linked && (
            <Button variant="outline" onClick={reload}>
              Tải lại
            </Button>
          )
        }
      />

      {!linked && (
        <p className="text-center text-muted-foreground">
          Tài khoản của bạn chưa được gắn với xưởng nào. Nhờ chủ cửa hàng chọn xưởng trong hồ sơ nhân viên.
        </p>
      )}

      {linked && (
        <>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
            <SelectTrigger className="w-full sm:w-60">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((status) => (
                <SelectItem key={status} value={status}>
                  {status === "ALL" ? "Tất cả trạng thái" : PRODUCTION_REQUEST_STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {state.status === "loading" && <p className="text-center text-muted-foreground">Đang tải...</p>}
          {state.status === "error" && (
            <p className="text-center text-muted-foreground">Không tải được danh sách - bấm Tải lại để thử lại</p>
          )}
          {state.status === "ready" && state.requests.length === 0 && (
            <p className="text-center text-muted-foreground">Không có yêu cầu sản xuất nào</p>
          )}
          {state.status === "ready" && state.requests.length > 0 && (
            <div className="grid gap-3 md:grid-cols-2">
              {state.requests.map((request) => (
                <RequestCard key={request.id} request={request} onOpen={() => setOpenId(request.id)} />
              ))}
            </div>
          )}

          <WorkshopRequestSheet
            key={openId ?? "none"}
            requestId={openId}
            onClose={() => setOpenId(null)}
            onChanged={reload}
          />
        </>
      )}
    </div>
  );
}
