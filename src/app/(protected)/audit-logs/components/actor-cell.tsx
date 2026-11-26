import { User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { AuditActor } from "@/lib/api/audit";

interface ActorCellProps {
  actor?: AuditActor | null;
  /** Dữ liệu chụp lúc ghi log, dùng khi tài khoản đã bị xóa hoặc là hệ thống / webhook. */
  fallbackName?: string | null;
  fallbackRole?: string | null;
  /** Gợi ý khi không phải người thật, vd. "Hệ thống", "SePay (tự động)". */
  automated?: string | null;
}

const ROLE_FALLBACKS: Record<string, string> = {
  TENANT_OWNER: "Chủ cửa hàng",
  ADMIN: "Quản trị viên",
  STAFF: "Nhân viên",
};

// Chữ cái đầu của tên gọi (từ cuối của họ tên).
function initialOf(text: string): string {
  const word = text.trim().split(/\s+/).pop() ?? "";
  return (word.charAt(0) || "?").toUpperCase();
}

/** Người thao tác: ảnh, tên ("---" nếu hồ sơ chưa có tên), số điện thoại và chức danh. */
export function ActorCell({ actor, fallbackName, fallbackRole, automated }: ActorCellProps) {
  if (automated) {
    return (
      <div className="flex items-center gap-2.5">
        <Avatar className="size-8">
          <AvatarFallback className="bg-muted text-xs text-muted-foreground">A</AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium">{automated}</span>
      </div>
    );
  }

  const name = actor ? actor.name : fallbackName;
  const title = name || "---";
  const phone = actor?.phone ?? null;
  const role = actor?.roleLabel ?? (fallbackRole ? (ROLE_FALLBACKS[fallbackRole] ?? fallbackRole) : null);

  return (
    <div className="flex items-center gap-2.5">
      <Avatar className="size-8">
        {actor?.avatarUrl && <AvatarImage src={actor.avatarUrl} alt={title} />}
        <AvatarFallback className="bg-muted text-xs font-semibold text-foreground">
          {name ? initialOf(name) : <User className="size-4 text-muted-foreground" />}
        </AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="truncate text-sm font-medium">{title}</span>
          {role && (
            <Badge variant="outline" className="h-5 px-1.5 text-[11px] font-medium">
              {role}
            </Badge>
          )}
        </div>
        {phone && <span className="font-mono text-xs text-muted-foreground">{phone}</span>}
      </div>
    </div>
  );
}
