import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatVietnamDateTime } from "@/app/(protected)/staffs/shared/vietnam-datetime";
import { ORDER_EVENT_FIELD_LABELS, type OrderEvent } from "@/types/order-event";
import {
  actorLabel,
  eventTypeLabel,
  formatChangeValue,
  lineChangeTexts,
  metadataTexts,
  refLink,
  statusTransition,
} from "../hooks/order-event-format";

/** Một dòng của lịch sử đơn. Chịu được loại sự kiện, khóa `changes`/`metadata` lạ và giá trị null. */
export function OrderHistoryRow({ event, role }: { event: OrderEvent; role: string | null | undefined }) {
  const transition = statusTransition(event);
  const changes = Object.entries(event.changes ?? {});
  const lines = lineChangeTexts(event.metadata?.lines);
  const details = metadataTexts(event.metadata);
  const link = refLink(event.metadata, role);

  return (
    <li className="relative space-y-1 border-l pb-5 pl-4 last:pb-0">
      <span className="absolute -left-[5px] top-1.5 size-2.5 rounded-full bg-primary" />
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{eventTypeLabel(event.type, event.metadata)}</span>
        {transition && <Badge variant="outline">{transition}</Badge>}
      </div>
      <p className="text-xs text-muted-foreground">
        {actorLabel(event)} · {formatVietnamDateTime(event.occurredAt)}
      </p>
      {changes.length > 0 && (
        <ul className="space-y-0.5 text-sm">
          {changes.map(([field, change]) => (
            <li key={field}>
              <span className="text-muted-foreground">
                {ORDER_EVENT_FIELD_LABELS[field] ?? field}:
              </span>{" "}
              {formatChangeValue(field, change?.from)} → {formatChangeValue(field, change?.to)}
            </li>
          ))}
        </ul>
      )}
      {lines.length > 0 && (
        <ul className="space-y-0.5 text-sm">
          {lines.map((text, index) => (
            <li key={index}>{text}</li>
          ))}
        </ul>
      )}
      {details.length > 0 && (
        <ul className="space-y-0.5 text-sm text-muted-foreground">
          {details.map((text, index) => (
            <li key={index}>{text}</li>
          ))}
        </ul>
      )}
      {link &&
        (link.href ? (
          <Link href={link.href} className="text-sm text-primary underline-offset-4 hover:underline">
            {link.label}
          </Link>
        ) : (
          <span className="text-sm text-muted-foreground">{link.label}</span>
        ))}
    </li>
  );
}
