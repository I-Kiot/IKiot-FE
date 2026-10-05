import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  ORDER_ITEM_STATUS_LABELS,
  type OrderDetailLine,
  type OrderItemCustomization,
} from "@/types/order-flow";
import { formatVND, orderedLines, stockDisplay } from "../../shared/order-display";

/** "181 × 60 × 75 cm · Gỗ sồi · Trắng" plus each named spec - the customer's own measurements. */
function CustomizationDetails({ customization }: { customization: OrderItemCustomization }) {
  const size = [customization.lengthCm, customization.widthCm, customization.heightCm]
    .map((value) => (value === null || value === undefined ? "?" : `${value}`))
    .join(" × ");
  const hasSize = [customization.lengthCm, customization.widthCm, customization.heightCm].some(
    (value) => value !== null && value !== undefined,
  );
  const summary = [
    hasSize ? `${size} cm` : null,
    customization.material,
    customization.color,
    customization.fabricCode ? `Mã vải ${customization.fabricCode}` : null,
  ].filter(Boolean);

  return (
    <div className="mt-2 space-y-1 rounded-md border border-dashed bg-muted/30 p-2 text-xs">
      {summary.length > 0 && <p className="font-medium">{summary.join(" · ")}</p>}
      {customization.specs.length > 0 && (
        <ul className="space-y-0.5">
          {customization.specs.map((spec, index) => (
            <li key={`${spec.name}-${index}`}>
              <span className="text-muted-foreground">{spec.name}:</span>{" "}
              <span className="whitespace-nowrap">
                {spec.value}
                {spec.unit ? ` ${spec.unit}` : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
      {customization.note && <p className="text-muted-foreground">{customization.note}</p>}
      {customization.attachmentUrls.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {customization.attachmentUrls.map((url) => (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="text-primary underline-offset-2 hover:underline"
            >
              Ảnh mẫu / bản vẽ
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

/** Every line of the order, with where it ships from and whether the shelf covers it right now. */
export function OrderLinesCard({ items }: { items: OrderDetailLine[] }) {
  const lines = orderedLines(items);
  const topLevel = items.filter((line) => !line.parentItemId).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sản phẩm ({topLevel})</CardTitle>
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
              </tr>
            </thead>
            <tbody>
              {lines.map(({ line, depth }) => {
                const isComponent = line.lineType === "COMBO_COMPONENT";
                const stock = line.stockCheck ? stockDisplay(line.stockCheck.status) : null;
                return (
                  <tr key={line.id} className="border-t align-top">
                    <td className={cn("px-3 py-2", depth > 0 && "pl-8")}>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{line.productName ?? "-"}</span>
                        {line.lineType === "COMBO" && <Badge variant="secondary">Combo</Badge>}
                        {line.isCustom && <Badge variant="info">Thiết kế riêng</Badge>}
                        {line.status !== "PENDING" && (
                          <Badge variant="outline">{ORDER_ITEM_STATUS_LABELS[line.status]}</Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {[line.sku, line.variantLabel].filter(Boolean).join(" · ")}
                        {line.returnedQuantity > 0 && ` · đã hoàn ${line.returnedQuantity}`}
                      </div>
                      {line.customization && (
                        <CustomizationDetails customization={line.customization} />
                      )}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {line.sourceLocation?.name ?? "-"}
                    </td>
                    <td className="px-3 py-2 text-right">{line.quantity}</td>
                    {/* Combo components carry price 0; the combo line carries the price. */}
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
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
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
