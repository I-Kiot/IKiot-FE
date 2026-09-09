"use client";

import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { holidayApi } from "@/lib/api/holiday";
import { getApiErrorMessage } from "@/lib/api/staff-mapper";
import { getVietnamDateString } from "@/app/(protected)/staffs/shared/vietnam-datetime";
import type {
  CreateHolidayPayload,
  Holiday,
  UpdateHolidayPayload,
} from "@/types/holiday";

type HolidaysDialogType = "add" | "edit";

type HolidayListQuery = {
  page: number;
  limit: number;
  year: number;
  isActive: "all" | "active" | "inactive";
  name: string;
};

type HolidaysContextType = {
  holidays: Holiday[];
  isInitialLoading: boolean;
  isFetching: boolean;
  isSyncing: boolean;
  total: number;
  totalPages: number;
  listQuery: HolidayListQuery;
  nameInput: string;
  setNameInput: (value: string) => void;
  open: HolidaysDialogType | null;
  setOpen: (value: HolidaysDialogType | null) => void;
  currentRow: Holiday | null;
  setCurrentRow: React.Dispatch<React.SetStateAction<Holiday | null>>;
  updateYear: (year: number) => void;
  updateStatusFilter: (status: HolidayListQuery["isActive"]) => void;
  updatePage: (page: number) => void;
  updatePageSize: (limit: number) => void;
  handleAdd: (payload: CreateHolidayPayload) => Promise<void>;
  handleEdit: (id: string, payload: UpdateHolidayPayload) => Promise<void>;
  handleStatusChange: (holiday: Holiday) => Promise<void>;
  handleSyncVietnam: () => Promise<void>;
};

const currentYear = Number(getVietnamDateString().slice(0, 4));

const DEFAULT_QUERY: HolidayListQuery = {
  page: 1,
  limit: 10,
  year: currentYear,
  isActive: "all",
  name: "",
};

const HolidaysContext = React.createContext<HolidaysContextType | null>(null);

export function HolidaysProvider({
  children,
  enabled = true,
}: {
  children: React.ReactNode;
  enabled?: boolean;
}) {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(enabled);
  const [isFetching, setIsFetching] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [listQuery, setListQuery] = useState(DEFAULT_QUERY);
  const [nameInput, setNameInput] = useState("");
  const [open, setOpen] = useState<HolidaysDialogType | null>(null);
  const [currentRow, setCurrentRow] = useState<Holiday | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const timer = setTimeout(() => {
      setListQuery((previous) =>
        previous.name === nameInput
          ? previous
          : { ...previous, name: nameInput.trim(), page: 1 },
      );
    }, 400);
    return () => clearTimeout(timer);
  }, [enabled, nameInput]);

  const fetchHolidays = useCallback(async () => {
    if (!enabled) return;
    setIsFetching(true);
    try {
      const response = await holidayApi.getList({
        page: listQuery.page,
        limit: listQuery.limit,
        year: listQuery.year,
        isActive:
          listQuery.isActive === "all"
            ? undefined
            : listQuery.isActive === "active",
        name: listQuery.name || undefined,
      });
      const rows = response.data ?? [];
      const pagination = response.pagination;
      const responseTotal = pagination?.total ?? rows.length;
      setHolidays(rows);
      setTotal(responseTotal);
      setTotalPages(
        pagination?.totalPages ??
          Math.max(1, Math.ceil(responseTotal / listQuery.limit)),
      );
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      setHolidays([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setIsFetching(false);
      setIsInitialLoading(false);
    }
  }, [enabled, listQuery]);

  useEffect(() => {
    const timer = setTimeout(() => void fetchHolidays(), 0);
    return () => clearTimeout(timer);
  }, [fetchHolidays]);

  async function handleAdd(payload: CreateHolidayPayload) {
    try {
      await holidayApi.create(payload);
      toast.success("Đã thêm ngày lễ");
      await fetchHolidays();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      throw error;
    }
  }

  async function handleEdit(id: string, payload: UpdateHolidayPayload) {
    try {
      await holidayApi.update(id, payload);
      toast.success("Đã cập nhật ngày lễ");
      await fetchHolidays();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      throw error;
    }
  }

  async function handleStatusChange(holiday: Holiday) {
    try {
      await holidayApi.updateStatus(holiday.id, !holiday.isActive);
      toast.success(holiday.isActive ? "Đã tắt ngày lễ" : "Đã bật ngày lễ");
      await fetchHolidays();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      throw error;
    }
  }

  async function handleSyncVietnam() {
    setIsSyncing(true);
    try {
      await holidayApi.syncVietnam(currentYear);
      toast.success(`Đã đồng bộ ngày lễ Việt Nam năm ${currentYear}`);
      if (listQuery.year !== currentYear) {
        setListQuery((previous) => ({
          ...previous,
          year: currentYear,
          page: 1,
        }));
      } else {
        await fetchHolidays();
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <HolidaysContext.Provider
      value={{
        holidays,
        isInitialLoading,
        isFetching,
        isSyncing,
        total,
        totalPages,
        listQuery,
        nameInput,
        setNameInput,
        open,
        setOpen,
        currentRow,
        setCurrentRow,
        updateYear: (year) =>
          setListQuery((previous) => ({ ...previous, year, page: 1 })),
        updateStatusFilter: (isActive) =>
          setListQuery((previous) => ({ ...previous, isActive, page: 1 })),
        updatePage: (page) =>
          setListQuery((previous) => ({ ...previous, page })),
        updatePageSize: (limit) =>
          setListQuery((previous) => ({ ...previous, limit, page: 1 })),
        handleAdd,
        handleEdit,
        handleStatusChange,
        handleSyncVietnam,
      }}
    >
      {children}
    </HolidaysContext.Provider>
  );
}

export function useHolidays() {
  const context = React.useContext(HolidaysContext);
  if (!context) {
    throw new Error("useHolidays must be used within <HolidaysProvider>");
  }
  return context;
}
