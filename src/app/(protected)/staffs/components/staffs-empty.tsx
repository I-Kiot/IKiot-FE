import { UsersRound } from "lucide-react";

export function StaffsEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <UsersRound className="size-12 text-muted-foreground mb-4" />
      <h3 className="text-base font-semibold mb-1">Không có nhân viên</h3>
      <p className="text-sm text-muted-foreground">
        Chưa có nhân viên nào phù hợp với bộ lọc hiện tại.
      </p>
    </div>
  );
}
