import { CalendarDays } from "lucide-react";

export function HolidaysEmpty() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-4 rounded-full bg-muted p-3">
        <CalendarDays className="size-6 text-muted-foreground" />
      </div>
      <h3 className="font-semibold">Chưa có ngày lễ</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Thêm ngày lễ mới hoặc đồng bộ lịch nghỉ lễ Việt Nam.
      </p>
    </div>
  );
}
