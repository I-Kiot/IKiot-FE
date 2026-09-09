"use client";

import { Plus, UserRoundPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  canCreateEmergencyLeave,
  canCreatePersonalLeave,
} from "@/components/sidebar/constants/role-permissions";
import { useAuth } from "@/hooks/use-auth";
import { useLeaveRequests } from "./leave-requests-provider";

export function LeaveRequestsButtonGroup() {
  const { user } = useAuth();
  const { setOpen, balance } = useLeaveRequests();
  const canPersonal = canCreatePersonalLeave(user?.role);
  const canEmergency = canCreateEmergencyLeave(user?.role);

  if (!canPersonal && !canEmergency) {
    return null;
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {balance && canPersonal && (
        <p className="text-xs text-muted-foreground">
          Phép còn lại:{" "}
          <span className="font-medium text-foreground">
            {balance.remainingDays}/{balance.annualLeaveDays}
          </span>
        </p>
      )}
      <div className="flex flex-wrap justify-end gap-2">
        {canPersonal && (
          <Button
            size="sm"
            variant="outline"
            className="cursor-pointer"
            onClick={() => setOpen("personal")}
          >
            <Plus className="mr-2 size-4" />
            Xin nghỉ phép
          </Button>
        )}
        {canEmergency && (
          <Button
            size="sm"
            className="cursor-pointer"
            onClick={() => setOpen("emergency")}
          >
            <UserRoundPlus className="mr-2 size-4" />
            Tạo đơn khẩn
          </Button>
        )}
      </div>
    </div>
  );
}
