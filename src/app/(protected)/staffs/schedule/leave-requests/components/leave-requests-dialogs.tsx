"use client";

import { LeaveRequestsEmergencyDialog } from "./leave-requests-create-dialog";
import { LeaveRequestsPersonalDialog } from "./leave-requests-personal-dialog";
import { useLeaveRequests } from "./leave-requests-provider";

export function LeaveRequestsDialogs() {
  const { open, setOpen } = useLeaveRequests();

  return (
    <>
      <LeaveRequestsPersonalDialog
        open={open === "personal"}
        onOpenChange={(value) => {
          if (!value) setOpen(null);
        }}
      />
      <LeaveRequestsEmergencyDialog
        open={open === "emergency"}
        onOpenChange={(value) => {
          if (!value) setOpen(null);
        }}
      />
    </>
  );
}
