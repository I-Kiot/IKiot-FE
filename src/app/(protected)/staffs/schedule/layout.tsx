"use client";

import { getSessionRole } from "@/lib/auth";
import { canViewSchedule } from "@/app/(protected)/staffs/shared/schedule-permissions";
import { ScheduleDetailPanel } from "./components/schedule-detail-panel";
import { ScheduleDialogs } from "./components/schedule-dialogs";
import { ScheduleProvider } from "./components/schedule-provider";

export default function ScheduleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const canView = canViewSchedule(getSessionRole());

  return (
    <ScheduleProvider enabled={canView}>
      {children}
      {canView && (
        <>
          <ScheduleDetailPanel />
          <ScheduleDialogs />
        </>
      )}
    </ScheduleProvider>
  );
}
