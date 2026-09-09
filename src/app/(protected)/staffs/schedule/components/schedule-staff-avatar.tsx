"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getStaffInitials } from "@/app/(protected)/staffs/shared/staff-format";
import { cn } from "@/lib/utils";

type ScheduleStaffAvatarProps = {
  name: string;
  avatarUrl?: string | null;
  className?: string;
  fallbackClassName?: string;
};

export function ScheduleStaffAvatar({
  name,
  avatarUrl,
  className,
  fallbackClassName,
}: ScheduleStaffAvatarProps) {
  return (
    <Avatar className={cn("shrink-0", className)}>
      {avatarUrl ? (
        <AvatarImage src={avatarUrl} alt={name} className="object-cover" />
      ) : null}
      <AvatarFallback className={fallbackClassName}>
        {getStaffInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
