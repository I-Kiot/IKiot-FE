"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { categoryLabel, formatNumber, formatVND, fundLabel, paymentMethodLabel } from "@/lib/stats-format"
import { useDashboard } from "./dashboard-provider"
import { Money, ReportTable, sumOf } from "./report-table"

const LOW_STOCK_THRESHOLD_OPTIONS = [5, 10, 20, 50]

const LOCATION_TYPE_LABELS: Record<string, string> = {
  BRANCH: "Chi nhánh",
  WAREHOUSE: "Kho",
}

/** Tiền thực thu theo phương thức thanh toán (theo ngày thu tiền, không phải ngày hoàn thành đơn). */
export function PaymentMethodReport() {
  const { revenueByPaymentMethod, isLoading } = useDashboard()
  const rows = revenueByPaymentMethod?.breakdown ?? []

  return (
    <ReportTable
      title="Tiền thực thu theo phương thức thanh toán"
      description="Tiền khách trả trong kỳ theo từng phương thức, đã trừ hoàn tiền và tiền thối"
      isLoading={isLoading && !revenueByPaymentMethod}
      rows={rows}
      rowKey={(row) => row.paymentMethod}
      columns={[
        { header: "Phương thức", cell: (row) => paymentMethodLabel(row.paymentMethod), footer: "Cộng" },
        { header: "Số đơn", numeric: true, cell: (row) => formatNumber(row.orderCount), footer: "" },
        {
          header: "Đã thu",
          numeric: true,
          cell: (row) => formatVND(row.received ?? 0),
          footer: formatVND(sumOf(rows, (r) => r.received ?? 0)),
        },
        {
          header: "Đã hoàn",
          numeric: true,
          cell: (row) => formatVND(row.refunded ?? 0),
          footer: formatVND(sumOf(rows, (r) => r.refunded ?? 0)),
        },
        {
          header: "Tiền thối",
          numeric: true,
          cell: (row) => formatVND(row.change ?? 0),
          footer: formatVND(sumOf(rows, (r) => r.change ?? 0)),
        },
        {
          header: "Thực thu",
          numeric: true,
          cell: (row) => <Money value={row.revenue} />,
          footer: <Money value={sumOf(rows, (r) => r.revenue)} />,
        },
      ]}
      note="Tính theo ngày thu tiền nên có thể khác doanh thu thuần của cùng kỳ (doanh thu ghi theo ngày đơn hoàn thành)."
    />
  )
}

/** Thu chi của kỳ theo quỹ (két, quỹ chủ, ngân hàng) và khoản mục. */
export function CashflowReport() {
  const { cashflow, isLoading, isWarehouse } = useDashboard()
  const rows = cashflow?.byCategory ?? []

  return (
    <ReportTable
      title="Thu chi theo quỹ"
      description={
        isWarehouse ? "Tiền vào và tiền ra tại kho trong kỳ, theo quỹ và khoản mục" : "Thu chi bán hàng trong kỳ, theo quỹ và khoản mục"
      }
      isLoading={isLoading && !cashflow}
      rows={rows}
      rowKey={(row) => `${row.fund}-${row.category}-${row.flowType}`}
      columns={[
        { header: "Quỹ", cell: (row) => fundLabel(row.fund), footer: "Cộng" },
        { header: "Khoản mục", cell: (row) => categoryLabel(row.category), footer: "" },
        { header: "Số giao dịch", numeric: true, cell: (row) => formatNumber(row.count), footer: "" },
        {
          header: "Thu",
          numeric: true,
          cell: (row) => (row.flowType === "INCOME" ? formatVND(row.total) : "-"),
          footer: formatVND(cashflow?.income ?? 0),
        },
        {
          header: "Chi",
          numeric: true,
          cell: (row) => (row.flowType === "EXPENSE" ? formatVND(row.total) : "-"),
          footer: formatVND(cashflow?.expense ?? 0),
        },
      ]}
      note={
        cashflow ? (
          <>
            Chênh lệch thu chi trong kỳ: <span className="font-semibold text-foreground">{formatVND(cashflow.net)}</span>
            {(cashflow.byFund ?? []).length > 0
              ? ` (${(cashflow.byFund ?? []).map((fund) => `${fundLabel(fund.fund)} ${formatVND(fund.net)}`).join(" · ")})`
              : ""}
          </>
        ) : undefined
      }
    />
  )
}

interface StockRow {
  label: string
  value: string
}

/** Tồn kho tại thời điểm xem (không theo kỳ): tổng quan và danh sách hàng sắp hết. */
export function InventoryReport() {
  const { inventory, isLoading, lowStockThreshold, setLowStockThreshold, branchOptions, warehouseOptions } = useDashboard()

  const locationName = (locationId: string, locationType: string): string => {
    const options = locationType === "WAREHOUSE" ? warehouseOptions : branchOptions
    return options.find((o) => o.value === locationId)?.label ?? LOCATION_TYPE_LABELS[locationType] ?? locationType
  }

  const summary: StockRow[] = inventory
    ? [
        { label: "Giá trị hàng tồn kho (theo giá vốn)", value: formatVND(inventory.stockValue) },
        { label: "Tổng số lượng tồn", value: formatNumber(inventory.totalUnits) },
        { label: "Số mặt hàng (SKU) đang có tồn", value: formatNumber(inventory.skuCount) },
        { label: "Số mặt hàng hết hàng", value: formatNumber(inventory.outOfStock) },
      ]
    : []
  const lowStock = inventory?.lowStock ?? []

  return (
    <div className="space-y-6">
      <ReportTable
        title="Tổng quan tồn kho"
        description="Mức tồn tại thời điểm xem, không theo kỳ báo cáo"
        isLoading={isLoading && !inventory}
        rows={summary}
        rowKey={(row) => row.label}
        columns={[
          { header: "Chỉ tiêu", cell: (row) => row.label },
          { header: "Giá trị", numeric: true, cell: (row) => row.value },
        ]}
      />
      <ReportTable
        title="Hàng sắp hết"
        description={`Mặt hàng có tồn từ ${lowStockThreshold} trở xuống`}
        isLoading={isLoading && !inventory}
        emptyText="Không có mặt hàng sắp hết"
        rows={lowStock}
        rowKey={(row) => `${row.productItemId}-${row.branchId ?? row.warehouseId}`}
        actions={
          <Select value={String(lowStockThreshold)} onValueChange={(value) => setLowStockThreshold(Number(value))}>
            <SelectTrigger className="w-44 cursor-pointer" aria-label="Ngưỡng tồn kho">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LOW_STOCK_THRESHOLD_OPTIONS.map((threshold) => (
                <SelectItem key={threshold} value={String(threshold)} className="cursor-pointer">
                  Ngưỡng tồn kho ≤ {threshold}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        columns={[
          { header: "STT", className: "w-14", cell: (_, index) => index + 1 },
          { header: "Hàng hóa", cell: (row) => row.productName },
          { header: "Mã hàng", cell: (row) => row.sku },
          { header: "Vị trí", cell: (row) => locationName(row.branchId ?? row.warehouseId ?? "", row.locationType) },
          {
            header: "Số lượng tồn",
            numeric: true,
            cell: (row) => <span className={row.stock <= 0 ? "font-medium text-red-600" : ""}>{formatNumber(row.stock)}</span>,
          },
        ]}
      />
    </div>
  )
}
