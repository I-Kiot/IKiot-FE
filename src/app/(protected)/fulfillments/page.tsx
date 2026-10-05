"use client";

// [C-6] SỬA: thay toàn bộ placeholder `ComingSoonPage` (P0-7) bằng màn Đóng hàng.

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { allows } from "@/components/sidebar/constants/role-permissions";
import { getCachedUser } from "@/lib/auth";
import { orderJourneyApi } from "@/lib/api/order-journey";
import type { PackableOrder } from "@/types/order-flow";
import { PackOrderDialog } from "./components/pack-order-dialog";

// [C-6] THÊM MỚI
/**
 * Số loại sản phẩm trong đơn = số SKU khác nhau, KHÔNG phải số dòng (`items.length`):
 * cùng một SKU có thể nằm ở hai dòng (vd. một dòng có thông số đặt riêng), đếm dòng sẽ ra dư.
 * Dòng chưa có SKU thì tính riêng theo id dòng.
 */
function productKindCount(order: PackableOrder): number {
  return new Set(order.items.map((item) => item.sku ?? item.id)).size;
}

/** Màn Đóng hàng (C-6): đơn CONFIRMED chờ đóng gói; bấm "Đóng hàng" để khoá hàng và chuyển đơn sang PACKED. */
export default function FulfillmentsPage() {
  // `null` = đang tải lần đầu. Không có state loading riêng: lint cấm setState trong useEffect.
  const [rows, setRows] = useState<PackableOrder[] | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [selected, setSelected] = useState<PackableOrder | null>(null);
  const canPack = allows(getCachedUser()?.role, "orders", "pack");

  useEffect(() => {
    orderJourneyApi.listPackable().then(setRows, () => {
      toast.error("Không tải được danh sách đơn chờ đóng gói");
      setRows([]);
    });
  }, [reloadKey]);

  // Danh sách trên màn hình chỉ là ảnh chụp lúc tải - sau mỗi lần đóng (thành công hay bị người khác
  // đóng trước) đều tải lại. Đúng/sai do BE quyết định (nhận đơn theo status, khoá hàng có điều kiện).
  const reload = () => {
    setSelected(null);
    setReloadKey((key) => key + 1);
  };

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <PageHeader
        breadcrumbs={[{ label: "Trang chủ", href: "/dashboard" }, { label: "Vận hành" }, { label: "Đóng hàng" }]}
        title="Đóng hàng"
        description="Đơn đã xác nhận, chờ đóng gói. Đóng gói sẽ khoá hàng trên kệ cho đơn."
        actions={
          <Button variant="outline" onClick={reload} disabled={rows === null}>
            Tải lại
          </Button>
        }
      />

      <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead>Mã đơn</TableHead>
              <TableHead>Khách hàng</TableHead>
              <TableHead>Chi nhánh</TableHead>
              {/* [C-6] SỬA: trước là "Số dòng" - khó hiểu với cả dev lẫn người dùng. */}
              <TableHead className="text-right">Số loại sản phẩm</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead className="w-[120px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows === null ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  Không có đơn nào chờ đóng gói
                </TableCell>
              </TableRow>
            ) : (
              rows.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.code}</TableCell>
                  <TableCell>
                    {order.customer.name}
                    {order.customer.phone && (
                      <span className="block text-xs text-muted-foreground">{order.customer.phone}</span>
                    )}
                  </TableCell>
                  <TableCell>{order.branch.name}</TableCell>
                  <TableCell className="text-right">{productKindCount(order)}</TableCell>
                  <TableCell>{new Date(order.createdAt).toLocaleString("vi-VN")}</TableCell>
                  <TableCell>
                    {canPack && (
                      <Button size="sm" onClick={() => setSelected(order)}>
                        Đóng hàng
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PackOrderDialog
        key={selected?.id ?? "none"}
        order={selected}
        onClose={() => setSelected(null)}
        onPacked={reload}
      />
    </div>
  );
}
