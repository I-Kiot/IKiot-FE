import type { VariantProps } from "class-variance-authority";
import { badgeVariants } from "@/components/ui/badge";
import type { AttendanceStatus } from "@/types/working-schedule";
import { formatVietnamDateTime } from "@/app/(protected)/staffs/shared/vietnam-datetime";

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

export const ATTENDANCE_STATUS_MAP: Record<
  string,
  { label: string; variant: BadgeVariant }
> = {
  NOT_CHECKED_IN: { label: "Chưa chấm công", variant: "secondary" },
  CHECKED_IN: { label: "Đã check-in", variant: "info" },
  CHECKED_OUT: { label: "Đã check-out", variant: "success" },
  LATE: { label: "Đi muộn", variant: "warning" },
  ABSENT: { label: "Vắng mặt", variant: "destructive" },
};

export function getAttendanceStatusDisplay(status?: string) {
  if (!status) {
    return { label: "-", variant: "secondary" as BadgeVariant };
  }
  return (
    ATTENDANCE_STATUS_MAP[status] ?? {
      label: status.replace(/_/g, " "),
      variant: "outline" as BadgeVariant,
    }
  );
}

export function formatWorkedMinutes(minutes?: number | null): string {
  if (minutes == null || Number.isNaN(minutes)) return "-";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} phút`;
  if (m === 0) return `${h} giờ`;
  return `${h} giờ ${m} phút`;
}

export function formatAttendanceDateTime(iso?: string | null): string {
  return formatVietnamDateTime(iso);
}

export function formatVerificationStatus(status?: string): string {
  if (!status) return "";
  const map: Record<string, string> = {
    VERIFIED: "Đã xác minh vị trí",
    UNVERIFIED: "Chưa xác minh",
    OUT_OF_RANGE: "Ngoài phạm vi cho phép",
  };
  return map[status] ?? status.replace(/_/g, " ");
}

export function hasAttendanceLocation(
  location?: {
    latitude?: number;
    longitude?: number;
    verificationStatus?: string;
  } | null,
): boolean {
  if (!location) return false;
  return (
    location.latitude != null ||
    location.longitude != null ||
    Boolean(location.verificationStatus)
  );
}

export function formatAttendanceLocation(
  location?: {
    latitude?: number;
    longitude?: number;
    accuracy?: number;
    distance?: number;
    verificationStatus?: string;
  } | null,
): string {
  if (!location) return "-";

  const parts: string[] = [];

  if (location.latitude != null && location.longitude != null) {
    parts.push(
      `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`,
    );
  }
  if (location.accuracy != null) {
    parts.push(`Sai số ±${Math.round(location.accuracy)}m`);
  }
  if (location.distance != null) {
    parts.push(`Cách điểm ca ${location.distance.toFixed(1)}m`);
  }
  if (location.verificationStatus) {
    parts.push(formatVerificationStatus(location.verificationStatus));
  }

  return parts.length > 0 ? parts.join(" · ") : "-";
}
