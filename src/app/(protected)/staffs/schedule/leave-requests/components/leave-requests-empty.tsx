import { CalendarX2 } from "lucide-react";

export function LeaveRequestsEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <CalendarX2 className="size-12 text-muted-foreground mb-4" />
      <h3 className="text-base font-semibold mb-1">Không có đơn nghỉ phép</h3>
      <p className="text-sm text-muted-foreground">
        Chưa có đơn nào phù hợp với bộ lọc hiện tại.
      </p>
    </div>
  );
}
