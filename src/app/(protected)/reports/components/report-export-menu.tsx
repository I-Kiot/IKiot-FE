"use client"

import { useState } from "react"
import { ChevronDown, FileSpreadsheet, Files, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { statsApi } from "@/lib/api/stats"
import { saveBlob } from "@/lib/download-file"
import { useDashboard } from "./dashboard-provider"

/** Các tab của trang Tổng hợp: tên báo cáo và tên file (cùng tên server đặt). */
export const EXPORTABLE_TABS: Record<string, { label: string; slug: string }> = {
  result: { label: "Kết quả bán hàng", slug: "ket-qua-ban-hang" },
  time: { label: "Doanh thu theo thời gian", slug: "doanh-thu-theo-thoi-gian" },
  product: { label: "Doanh thu theo hàng hóa", slug: "doanh-thu-theo-hang-hoa" },
  branch: { label: "Doanh thu theo điểm bán", slug: "doanh-thu-theo-diem-ban" },
  customer: { label: "Doanh thu theo khách hàng", slug: "doanh-thu-theo-khach-hang" },
  orders: { label: "Đơn hàng theo trạng thái", slug: "don-hang-theo-trang-thai" },
  cash: { label: "Thu chi", slug: "thu-chi" },
  inventory: { label: "Tồn kho", slug: "ton-kho" },
}

/** Nút xuất Excel của trang Tổng hợp: xuất riêng báo cáo đang xem, hoặc mọi tab trong một file nhiều sheet. */
export function ReportExportMenu() {
  const { revenueDateRange, activeTab, lowStockThreshold, location } = useDashboard()
  const { branchId, warehouseId } = location
  const [exporting, setExporting] = useState(false)

  if (!revenueDateRange) return null
  // Tab "Theo điểm bán" ẩn khi đang xem một nơi: lưới về tab đầu, nút xuất cũng vậy.
  const tab = activeTab === "branch" && !location.isAll ? "result" : activeTab
  const current = EXPORTABLE_TABS[tab]
  const { fromDate, toDate, groupBy } = revenueDateRange

  const exportFile = async (section?: string) => {
    setExporting(true)
    try {
      const blob = await statsApi.exportReport({
        fromDate,
        toDate,
        branchId,
        warehouseId,
        groupBy,
        section,
        lowStockThreshold,
      })
      const slug = section ? EXPORTABLE_TABS[section].slug : "bao-cao-tong-hop"
      saveBlob(blob, `${slug}_${fromDate}_${toDate}.xlsx`)
    } catch {
      toast.error("Xuất file thất bại. Vui lòng thử lại.")
    } finally {
      setExporting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={exporting}>
          {exporting ? <Loader2 className="size-4 animate-spin" /> : <FileSpreadsheet className="size-4" />}
          Xuất Excel
          <ChevronDown className="size-4 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        {current ? (
          <DropdownMenuItem className="cursor-pointer items-start" onSelect={() => exportFile(tab)}>
            <FileSpreadsheet className="mt-0.5 size-4" />
            <div>
              <p className="font-medium">Báo cáo đang xem</p>
              <p className="text-xs text-muted-foreground">{current.label}</p>
            </div>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem className="cursor-pointer items-start" onSelect={() => exportFile()}>
          <Files className="mt-0.5 size-4" />
          <div>
            <p className="font-medium">Tất cả báo cáo</p>
            <p className="text-xs text-muted-foreground">Một file, mỗi báo cáo một sheet</p>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
