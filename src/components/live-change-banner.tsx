import { Info } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { cn, formatDateTime } from "@/lib/utils"
import type { EntityChangedEvent } from "@/types/change-feed"

/** Báo dữ liệu trong hộp thoại vừa bị người khác đổi. */
export function LiveChangeBanner({
  event,
  onReload,
  reloadLabel = "Đóng và tải lại",
  className,
}: {
  event: EntityChangedEvent | null
  onReload?: () => void
  reloadLabel?: string
  className?: string
}) {
  if (!event) return null
  return (
    <Alert
      className={cn(
        "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200",
        className,
      )}
    >
      <Info aria-hidden />
      <AlertTitle>Dữ liệu vừa thay đổi</AlertTitle>
      <AlertDescription className="text-amber-800/90 dark:text-amber-200/90">
        <p>
          {event.summary} lúc {formatDateTime(event.at)}. Thông tin trong hộp thoại có thể đã cũ.
        </p>
        {onReload ? (
          <Button type="button" size="sm" variant="outline" onClick={onReload}>
            {reloadLabel}
          </Button>
        ) : null}
      </AlertDescription>
    </Alert>
  )
}
