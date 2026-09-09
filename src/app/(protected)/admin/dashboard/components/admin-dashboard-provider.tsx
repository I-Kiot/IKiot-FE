// [Context – Admin (platform) Dashboard]
"use client";

import * as React from "react";
import { toast } from "sonner";
import { statsApi, type AdminOverview } from "@/lib/api/stats";

export type AdminRange = "7d" | "30d" | "90d" | "12m";

const RANGE_DAYS: Record<AdminRange, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "12m": 365,
};

function toDateOnly(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
}

type AdminDashboardContextType = {
  data: AdminOverview | null;
  isLoading: boolean;
  range: AdminRange;
  setRange: (r: AdminRange) => void;
  refetch: () => void;
};

const AdminDashboardContext =
  React.createContext<AdminDashboardContextType | null>(null);

export function AdminDashboardProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [range, setRange] = React.useState<AdminRange>("30d");
  const [data, setData] = React.useState<AdminOverview | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const toDate = new Date();
      const fromDate = new Date(
        toDate.getTime() - RANGE_DAYS[range] * 24 * 60 * 60 * 1000,
      );
      const groupBy = range === "12m" ? "month" : "day";
      const res = await statsApi.getAdminOverview({
        fromDate: toDateOnly(fromDate),
        toDate: toDateOnly(toDate),
        groupBy,
      });
      setData(res);
    } catch (err) {
      console.error(err);
      toast.error("Tải dữ liệu tổng quan thất bại");
    } finally {
      setIsLoading(false);
    }
  }, [range]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <AdminDashboardContext.Provider
      value={{ data, isLoading, range, setRange, refetch: fetchData }}
    >
      {children}
    </AdminDashboardContext.Provider>
  );
}

export function useAdminDashboard() {
  const ctx = React.useContext(AdminDashboardContext);
  if (!ctx)
    throw new Error(
      "useAdminDashboard must be used within <AdminDashboardProvider>",
    );
  return ctx;
}
