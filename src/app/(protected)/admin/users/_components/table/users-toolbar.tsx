"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search } from "lucide-react"

interface UsersToolbarProps {
  globalFilter: string
  onGlobalFilterChange: (val: string) => void
  planFilter: string
  onPlanFilterChange: (val: string) => void
  statusFilter: string
  onStatusFilterChange: (val: string) => void
}

export function UsersToolbar({
  globalFilter,
  onGlobalFilterChange,
  planFilter,
  onPlanFilterChange,
  statusFilter,
  onStatusFilterChange,
}: UsersToolbarProps) {
  const hasActiveFilters = globalFilter || planFilter !== "all" || statusFilter !== "all"

  const handleReset = () => {
    onGlobalFilterChange("")
    onPlanFilterChange("all")
    onStatusFilterChange("all")
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Search bar */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Tìm kiếm chủ cửa hàng, tên/mã cửa hàng..."
          value={globalFilter}
          onChange={(e) => onGlobalFilterChange(e.target.value)}
          className="pl-9 h-9 text-sm"
        />
      </div>

      {/* Filtering selectors */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="space-y-1 max-w-[150px]">
          <Select value={planFilter} onValueChange={onPlanFilterChange}>
            <SelectTrigger className="cursor-pointer h-9 text-xs">
              <SelectValue placeholder="Chọn gói cước" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả gói</SelectItem>
              <SelectItem value="TRIAL">Dùng thử</SelectItem>
              <SelectItem value="PLUS">Chuyên nghiệp</SelectItem>
              <SelectItem value="PRO">Doanh nghiệp</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1 max-w-[150px]">
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="cursor-pointer h-9 text-xs">
              <SelectValue placeholder="Chọn trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="ACTIVE">Hoạt động</SelectItem>
              <SelectItem value="INACTIVE">Chưa kích hoạt</SelectItem>
              <SelectItem value="SUSPENDED">Tạm khóa</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-9 px-3 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
          >
            Đặt lại lọc
          </Button>
        )}
      </div>
    </div>
  )
}
