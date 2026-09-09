"use client";

import { Clock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSessionRole } from "@/lib/auth";
import {
  canCreateSchedule,
  canManageShiftTemplates,
} from "@/app/(protected)/staffs/shared/schedule-permissions";
import { useSchedule } from "./schedule-provider";

export function ScheduleButtonGroup() {
  const { setOpen } = useSchedule();
  const userRole = getSessionRole();
  const canCreate = canCreateSchedule(userRole);
  const canManageTemplates = canManageShiftTemplates(userRole);

  if (!canCreate && !canManageTemplates) return null;

  return (
    <div className="flex items-center gap-2">
      {canManageTemplates && (
        <Button
          size="sm"
          variant="outline"
          className="cursor-pointer"
          onClick={() => setOpen("shiftTemplate")}
        >
          <Clock className="mr-2 size-4" />
          Ca mẫu
        </Button>
      )}
      {canCreate && (
        <Button
          size="sm"
          className="cursor-pointer"
          onClick={() => setOpen("add")}
        >
          <Plus className="mr-2 size-4" />
          Phân ca mới
        </Button>
      )}
    </div>
  );
}
