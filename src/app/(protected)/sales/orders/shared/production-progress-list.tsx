import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatDate, lineProgressDisplay } from "@/app/(protected)/exchange/production-requests/shared/production-display";
import type { LineProductionProgress } from "@/types/order-flow";

type Props = {
  progress: LineProductionProgress[];
  /** Kho xuất của dòng đơn; YCSX giao về nơi khác thì ghi rõ "giao về …". */
  sourceLocationId?: string | null;
  /** Một dòng chữ mỗi YCSX, cho panel mở rộng ở danh sách đơn. */
  compact?: boolean;
};

const requestHref = (code: string) => `/exchange/imports?source=WORKSHOP&search=${encodeURIComponent(code)}`;

/** Tiến độ các YCSX gắn một dòng đơn: mã, bước của xưởng, đã nhập kho bao nhiêu trên số đặt. */
export function ProductionProgressList({ progress, sourceLocationId, compact = false }: Props) {
  if (progress.length === 0) return null;

  if (compact) {
    return (
      <div className="text-xs text-muted-foreground">
        {progress.map((item) => (
          <div key={item.id}>
            {item.code} · {lineProgressDisplay(item).label} · {item.receivedQuantity}/{item.quantity}
            {item.deliveringQuantity > 0 && ` · chờ nhận ${item.deliveringQuantity}`}
          </div>
        ))}
      </div>
    );
  }

  return (
    <ul className="mt-1 space-y-1.5 text-xs">
      {progress.map((item) => {
        const display = lineProgressDisplay(item);
        const elsewhere = sourceLocationId && item.location.id !== sourceLocationId;
        const percent = item.quantity > 0 ? Math.min(100, (item.receivedQuantity / item.quantity) * 100) : 0;
        return (
          <li key={item.id} className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <Link href={requestHref(item.code)} className="font-medium text-foreground hover:underline">
                {item.code}
              </Link>
              <Badge variant={display.variant}>{display.label}</Badge>
              <span className="text-muted-foreground">
                {[
                  item.supplierName,
                  item.expectedReadyDate ? `hẹn ${formatDate(item.expectedReadyDate)}` : null,
                  elsewhere ? `giao về ${item.location.name}` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Progress value={percent} className="h-1.5 w-32" aria-label="Tiến độ nhập kho" />
              <span>
                Đã nhập kho {item.receivedQuantity}/{item.quantity}
                {item.deliveringQuantity > 0 && ` · xưởng đã giao ${item.deliveringQuantity} chờ nhận`}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
