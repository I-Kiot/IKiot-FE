"use client"

import { useState } from "react"
import { ArrowDownIcon, ArrowUpIcon, Boxes, PackageX, Wallet } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useDashboard } from "./dashboard-provider"
import { formatVND, formatNumber } from "../shared/format"

const LOW_STOCK_THRESHOLD_OPTIONS = [5, 10, 20, 50]

const LOCATION_TYPE_LABELS: Record<string, string> = {
  branch: "Chi nhánh",
  warehouse: "Kho",
}

export function CashflowInventory() {
  const [activeTab, setActiveTab] = useState("cashflow")
  const {
    cashflow,
    inventory,
    isLoading,
    isWarehouse,
    lowStockThreshold,
    setLowStockThreshold,
    branchOptions,
    warehouseOptions,
  } = useDashboard()

  const getLocationName = (locationId: string, locationType: string): string => {
    const options = locationType === 'warehouse' ? warehouseOptions : branchOptions
    return (
      options.find((o) => o.value === locationId)?.label ??
      LOCATION_TYPE_LABELS[locationType] ??
      locationType
    )
  }

  const incomeCount = cashflow?.byType.find((t) => t.flowType === "INCOME")?.count ?? 0
  const expenseCount = cashflow?.byType.find((t) => t.flowType === "EXPENSE")?.count ?? 0

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle>Dòng tiền &amp; Tồn kho</CardTitle>
        <CardDescription>
          {isWarehouse
            ? "Dòng tiền nhập hàng và tình trạng tồn kho của kho"
            : "Thu chi bán hàng và tình trạng tồn kho hiện tại"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1 rounded-lg h-12">
            <TabsTrigger
              value="cashflow"
              className="cursor-pointer flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground"
            >
              <Wallet className="h-4 w-4" />
              <span>Dòng tiền</span>
            </TabsTrigger>
            <TabsTrigger
              value="inventory"
              className="cursor-pointer flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground"
            >
              <Boxes className="h-4 w-4" />
              <span>Tồn kho</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cashflow" className="mt-8 space-y-6">
            {isLoading && !cashflow ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="p-4 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <ArrowUpIcon className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">{isWarehouse ? "Tiền vào" : "Thu (bán hàng)"}</span>
                  </div>
                  <div className="text-2xl font-bold">{formatVND(cashflow?.income ?? 0)}</div>
                  <div className="text-xs text-muted-foreground mt-1">{formatNumber(incomeCount)} giao dịch</div>
                </div>
                <div className="p-4 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <ArrowDownIcon className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium">{isWarehouse ? "Chi (nhập hàng)" : "Chi (hoàn trả)"}</span>
                  </div>
                  <div className="text-2xl font-bold">{formatVND(cashflow?.expense ?? 0)}</div>
                  <div className="text-xs text-muted-foreground mt-1">{formatNumber(expenseCount)} giao dịch</div>
                </div>
                <div className="p-4 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Dòng tiền ròng</span>
                  </div>
                  <div className="text-2xl font-bold">{formatVND(cashflow?.net ?? 0)}</div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="inventory" className="mt-8 space-y-6">
            {isLoading && !inventory ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
                  <div className="p-4 rounded-lg border">
                    <div className="text-sm font-medium text-muted-foreground mb-1">Giá trị tồn kho</div>
                    <div className="text-xl font-bold">{formatVND(inventory?.stockValue ?? 0)}</div>
                  </div>
                  <div className="p-4 rounded-lg border">
                    <div className="text-sm font-medium text-muted-foreground mb-1">Tổng số lượng</div>
                    <div className="text-xl font-bold">{formatNumber(inventory?.totalUnits ?? 0)}</div>
                  </div>
                  <div className="p-4 rounded-lg border">
                    <div className="text-sm font-medium text-muted-foreground mb-1">Số SKU</div>
                    <div className="text-xl font-bold">{formatNumber(inventory?.skuCount ?? 0)}</div>
                  </div>
                  <div className="p-4 rounded-lg border">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                      <PackageX className="h-4 w-4" />
                      Hết hàng
                    </div>
                    <div className="text-xl font-bold text-red-600">{formatNumber(inventory?.outOfStock ?? 0)}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Sản phẩm sắp hết hàng</span>
                  <Select
                    value={String(lowStockThreshold)}
                    onValueChange={(value) => setLowStockThreshold(Number(value))}
                  >
                    <SelectTrigger className="w-44 cursor-pointer">
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
                </div>

                <div className="rounded-lg border bg-card">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b">
                        <TableHead className="py-4 px-6 font-semibold">Sản phẩm</TableHead>
                        <TableHead className="py-4 px-6 font-semibold">SKU</TableHead>
                        <TableHead className="py-4 px-6 font-semibold">Vị trí</TableHead>
                        <TableHead className="text-right py-4 px-6 font-semibold">Tồn kho</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(inventory?.lowStock ?? []).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-sm text-muted-foreground">
                            Không có sản phẩm sắp hết hàng
                          </TableCell>
                        </TableRow>
                      ) : (
                        inventory!.lowStock.slice(0, 10).map((item) => (
                          <TableRow key={`${item.productItemId}-${item.locationId}`} className="hover:bg-muted/30 transition-colors">
                            <TableCell className="font-medium py-4 px-6">{item.productName}</TableCell>
                            <TableCell className="py-4 px-6 text-muted-foreground">{item.sku}</TableCell>
                            <TableCell className="py-4 px-6">
                              <Badge variant="outline">
                                {getLocationName(item.locationId, item.locationType)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right py-4 px-6">
                              <span className={item.stock <= 0 ? "text-red-600 font-medium" : ""}>
                                {formatNumber(item.stock)}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
