"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface UsersPaginationProps {
  currentPage: number
  onPageChange: (page: number) => void
  pageSize: number
  onPageSizeChange: (size: number) => void
  totalPages: number
}

export function UsersPagination({
  currentPage,
  onPageChange,
  pageSize,
  onPageSizeChange,
  totalPages,
}: UsersPaginationProps) {
  return (
    <div className="flex items-center justify-between space-x-2 py-4">
      <div className="flex items-center space-x-2">
        <Label htmlFor="page-size" className="text-sm font-medium">
          Hiển thị
        </Label>
        <Select
          value={`${pageSize}`}
          onValueChange={(value) => {
            onPageSizeChange(Number(value))
            onPageChange(1)
          }}
        >
          <SelectTrigger className="w-20 cursor-pointer h-8 text-xs" id="page-size">
            <SelectValue placeholder={pageSize} />
          </SelectTrigger>
          <SelectContent side="top">
            {[5, 10, 20, 30, 50].map((size) => (
              <SelectItem key={size} value={`${size}`}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2 text-sm">
          <p className="font-medium text-xs text-muted-foreground">Trang</p>
          <strong className="text-xs">
            {currentPage} / {totalPages}
          </strong>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
            disabled={currentPage === 1}
            className="cursor-pointer h-8 text-xs"
          >
            Trước
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="cursor-pointer h-8 text-xs"
          >
            Sau
          </Button>
        </div>
      </div>
    </div>
  )
}
