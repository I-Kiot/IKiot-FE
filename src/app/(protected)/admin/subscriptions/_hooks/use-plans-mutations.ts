"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  listAllPlans,
  updatePlan,
  setPlanActive,
  type Plan,
  type UpdatePlanPayload,
} from "@/lib/api/subscription";

function apiErrorMessage(error: unknown, fallback: string): string {
  const message = (error as { response?: { data?: { message?: string } } })
    ?.response?.data?.message;
  return message || fallback;
}

export function usePlansMutations() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPlans = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await listAllPlans();
      setPlans(data);
    } catch (error) {
      toast.error(apiErrorMessage(error, "Lỗi tải danh sách gói dịch vụ"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load. setState only happens in async callbacks, not synchronously
  // in the effect body.
  useEffect(() => {
    let active = true;
    listAllPlans()
      .then((data) => {
        if (active) setPlans(data);
      })
      .catch((error) => {
        if (active)
          toast.error(apiErrorMessage(error, "Lỗi tải danh sách gói dịch vụ"));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const editPlan = useCallback(
    async (id: string, payload: UpdatePlanPayload): Promise<boolean> => {
      try {
        const updated = await updatePlan(id, payload);
        setPlans((prev) => prev.map((p) => (p.id === id ? updated : p)));
        toast.success("Đã cập nhật gói dịch vụ");
        return true;
      } catch (error) {
        toast.error(apiErrorMessage(error, "Không thể cập nhật gói dịch vụ"));
        return false;
      }
    },
    [],
  );

  const toggleActive = useCallback(
    async (id: string, isActive: boolean): Promise<void> => {
      // Optimistic; revert on failure.
      setPlans((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isActive } : p)),
      );
      try {
        const updated = await setPlanActive(id, isActive);
        setPlans((prev) => prev.map((p) => (p.id === id ? updated : p)));
        toast.success(isActive ? "Đã bật gói" : "Đã tắt gói");
      } catch (error) {
        setPlans((prev) =>
          prev.map((p) => (p.id === id ? { ...p, isActive: !isActive } : p)),
        );
        toast.error(apiErrorMessage(error, "Không thể đổi trạng thái gói"));
      }
    },
    [],
  );

  return { plans, isLoading, fetchPlans, editPlan, toggleActive };
}
