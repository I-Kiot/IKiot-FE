"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Power } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatVietnamWorkDate } from "@/app/(protected)/staffs/shared/vietnam-datetime";
import type { Holiday } from "@/types/holiday";
import { useHolidays } from "./holidays-provider";

function HolidayActions({ holiday }: { holiday: Holiday }) {
  const { setCurrentRow, setOpen, handleStatusChange, isFetching } =
    useHolidays();

  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="cursor-pointer"
        onClick={() => {
          setCurrentRow(holiday);
          setOpen("edit");
        }}
      >
        <Pencil className="mr-1 size-4" />
        Sửa
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="cursor-pointer"
        disabled={isFetching}
        onClick={() => void handleStatusChange(holiday)}
      >
        <Power className="mr-1 size-4" />
        {holiday.isActive ? "Tắt" : "Bật"}
      </Button>
    </div>
  );
}

export const holidaysColumns: ColumnDef<Holiday>[] = [
  {
    accessorKey: "date",
    header: "Ngày",
    cell: ({ row }) => (
      <span className="whitespace-nowrap font-medium">
        {formatVietnamWorkDate(row.original.date)}
      </span>
    ),
  },
  {
    accessorKey: "name",
    header: "Tên",
    cell: ({ row }) => <span>{row.original.name}</span>,
  },
  {
    accessorKey: "source",
    header: "Nguồn",
    cell: ({ row }) => (
      <Badge variant="outline">
        {row.original.source === "MANUAL" ? "Thủ công" : "Google Calendar"}
      </Badge>
    ),
  },
  {
    accessorKey: "isActive",
    header: "Trạng thái",
    cell: ({ row }) => (
      <Badge variant={row.original.isActive ? "default" : "secondary"}>
        {row.original.isActive ? "Đang áp dụng" : "Đã tắt"}
      </Badge>
    ),
  },
  {
    id: "actions",
    header: () => <div className="text-right">Thao tác</div>,
    cell: ({ row }) => <HolidayActions holiday={row.original} />,
    enableHiding: false,
  },
];
