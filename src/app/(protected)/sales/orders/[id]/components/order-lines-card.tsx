import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ImageAttachments } from "@/components/image-attachments";
import { CustomizationChips } from "../../shared/customization-chips";
import {
  ORDER_ITEM_STATUS_LABELS,
  OrderLine,
  type OrderDetail,
  type OrderDetailLine,
  type OrderItemCustomization,
} from "@/types/order-flow";
import {
  formatVND,
  orderedLines,
  stockDisplay,
} from "../../shared/order-display";
import { canCreateProductionFor } from "../../shared/production-prefill";
import { ProductionProgressList } from "../../shared/production-progress-list";
import { CreateProductionRequestButton } from "../../shared/create-production-request-button";

/** Yêu cầu riêng của khách: chip thay đổi, ghi chú, ảnh. */
function CustomizationDetails({
  customization,
}: {
  customization: OrderItemCustomization;
}) {
  return (
    <div className="mt-2 flex flex-col gap-1.5 text-xs">
      <CustomizationChips customization={customization} />
      {customization.note && (
        <p className="text-muted-foreground">
          Ghi chú cho xưởng: {customization.note}
        </p>
      )}
      {customization.attachmentUrls.length > 0 && (
        <ImageAttachments
          value={customization.attachmentUrls}
          onChange={() => undefined}
          disabled
        />
      )}
    </div>
  );
}

function ManufacturableCell({ line }: { line: OrderLine }) {
  const hasNoGoods = line.lineType === "COMBO" || line.lineType === "SERVICE";
  if (hasNoGoods) return <span className="text-muted-foreground">-</span>;
  if (line.isManufacturable) {
    return <Badge variant="info">Có thể sản xuất</Badge>;
  }
  return <span className="text-xs text-muted-foreground">Nhập từ NCC</span>;
}

/** Các dòng của đơn kèm kho xuất và tình trạng hàng. */
export function OrderLinesCard({ order }: { order: OrderDetail }) {
  const items: OrderDetailLine[] = order.items;
  const lines = orderedLines(items);
  const topLevel = items.filter((line) => !line.parentItemId).length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle>Sản phẩm ({topLevel})</CardTitle>
        {canCreateProductionFor(order) && (
          <CreateProductionRequestButton orderId={order.id} order={order} />
        )}
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Sản phẩm</th>
                <th className="px-3 py-2 font-medium">Xuất từ</th>
                <th className="px-3 py-2 text-right font-medium">SL</th>
                <th className="px-3 py-2 text-right font-medium">Đơn giá</th>
                <th className="px-3 py-2 text-right font-medium">Thành tiền</th>
                <th className="px-3 py-2 font-medium">Tồn kho</th>
                <th className="px-3 py-2 font-medium">Nguồn hàng</th>
              </tr>
            </thead>
            <tbody>
              {lines.map(({ line, depth }) => {
                const isComponent = line.lineType === "COMBO_COMPONENT";
                const stock = line.stockCheck
                  ? stockDisplay(line.stockCheck.status)
                  : null;
                return (
                  <tr key={line.id} className="border-t align-top">
                    <td className={cn("px-3 py-2", depth > 0 && "pl-8")}>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">
                          {line.productName ?? "-"}
                        </span>
                        {line.lineType === "COMBO" && (
                          <Badge variant="secondary">Combo</Badge>
                        )}
                        {line.isCustom && (
                          <Badge variant="info">Thiết kế riêng</Badge>
                        )}
                        {line.status !== "PENDING" && (
                          <Badge variant="outline">
                            {ORDER_ITEM_STATUS_LABELS[line.status]}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {[line.sku, line.variantLabel]
                          .filter(Boolean)
                          .join(" · ")}
                        {line.returnedQuantity > 0 &&
                          ` · đã hoàn ${line.returnedQuantity}`}
                      </div>
                      {line.production.progress.length > 0 && (
                        <div className="mt-1">
                          <div className="text-xs text-muted-foreground">
                            Sản xuất cho dòng này
                          </div>
                          <ProductionProgressList
                            progress={line.production.progress}
                            sourceLocationId={line.sourceLocation?.id}
                          />
                        </div>
                      )}
                      {line.customization && (
                        <CustomizationDetails
                          customization={line.customization}
                        />
                      )}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {line.sourceLocation?.name ?? "-"}
                    </td>
                    <td className="px-3 py-2 text-right">{line.quantity}</td>
                    {/* Thành phần combo có giá 0; giá nằm ở dòng combo. */}
                    <td className="px-3 py-2 text-right">
                      {isComponent ? "-" : formatVND(line.unitPrice)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {isComponent ? "-" : formatVND(line.lineTotal)}
                      {!isComponent && line.discountAmount > 0 && (
                        <div className="text-xs text-muted-foreground">
                          Giảm {formatVND(line.discountAmount)}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {stock && line.stockCheck ? (
                        <div className="flex flex-col items-start gap-0.5">
                          <Badge variant={stock.variant}>{stock.label}</Badge>
                          <span className="text-xs text-muted-foreground">
                            Trên kệ {line.stockCheck.stock}
                            {line.stockCheck.shortQuantity > 0 &&
                              ` · thiếu ${line.stockCheck.shortQuantity}`}
                            {line.stockCheck.shortQuantity > 0 &&
                              line.production.orderableQuantity === 0 &&
                              line.production.coveringRequests.length > 0 &&
                              ` · đã có ${line.production.coveringRequests.map((request) => request.code).join(", ")} đặt chung`}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <ManufacturableCell line={line} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
