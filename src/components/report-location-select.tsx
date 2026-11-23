"use client"

// [Bộ lọc – nơi xem báo cáo] Dropdown Toàn cửa hàng / từng chi nhánh / từng kho, đặt cạnh bộ lọc ngày ở mọi trang báo cáo.
// Nhân viên chỉ thấy nơi được gán (khoá, không mở được).

import { MapPin } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { ALL_LOCATIONS, type ReportLocation } from "@/hooks/use-report-location"

interface ReportLocationSelectProps {
  location: ReportLocation
  className?: string
}

export function ReportLocationSelect({ location, className }: ReportLocationSelectProps) {
  const { locationKey, setLocationKey, canChoose, locationName, branches, warehouses } = location

  return (
    <Select value={locationKey} onValueChange={setLocationKey} disabled={!canChoose}>
      <SelectTrigger className={cn("w-52 cursor-pointer", className)} aria-label="Nơi xem báo cáo">
        <MapPin className="size-4 text-muted-foreground" aria-hidden />
        {/* Danh sách chưa tải xong vẫn hiện đúng tên nơi đang xem (nhân viên không có danh sách). */}
        <SelectValue placeholder={locationName}>{locationName}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_LOCATIONS} className="cursor-pointer">
          Toàn cửa hàng
        </SelectItem>
        {branches.length > 0 && (
          <>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>Chi nhánh</SelectLabel>
              {branches.map((option) => (
                <SelectItem key={option.key} value={option.key} className="cursor-pointer">
                  {option.name}
                  {option.inactive ? <span className="text-muted-foreground"> (ngừng hoạt động)</span> : null}
                </SelectItem>
              ))}
            </SelectGroup>
          </>
        )}
        {warehouses.length > 0 && (
          <>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>Kho</SelectLabel>
              {warehouses.map((option) => (
                <SelectItem key={option.key} value={option.key} className="cursor-pointer">
                  {option.name}
                  {option.inactive ? <span className="text-muted-foreground"> (ngừng hoạt động)</span> : null}
                </SelectItem>
              ))}
            </SelectGroup>
          </>
        )}
      </SelectContent>
    </Select>
  )
}
