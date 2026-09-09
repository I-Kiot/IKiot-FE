"use client"

import { Package } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useDashboard } from "./dashboard-provider"
import type { TopProductsSortBy } from "../hooks/use-dashboard-stats"
import { formatVND, formatNumber } from "../shared/format"

export function TopProducts() {
  const { topProducts, isLoading, topProductsSortBy, setTopProductsSortBy } = useDashboard()
  const products = topProducts?.products ?? []

  return (
    <Card className="cursor-pointer">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle>Sản phẩm bán chạy</CardTitle>
          <CardDescription>
            Xếp hạng theo {topProductsSortBy === "revenue" ? "doanh thu" : "số lượng"} trong kỳ
          </CardDescription>
        </div>
        <Select
          value={topProductsSortBy}
          onValueChange={(value) => setTopProductsSortBy(value as TopProductsSortBy)}
        >
          <SelectTrigger className="w-32 cursor-pointer" onClick={(e) => e.stopPropagation()}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="revenue" className="cursor-pointer">Doanh thu</SelectItem>
            <SelectItem value="quantity" className="cursor-pointer">Số lượng</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && !topProducts ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Package className="h-8 w-8" />
            Chưa có sản phẩm bán ra trong khoảng thời gian này
          </div>
        ) : (
          products.map((product, index) => (
            <div key={product.productItemId} className="flex items-center p-3 rounded-lg border gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                #{index + 1}
              </div>
              <div className="flex gap-2 items-center justify-between space-x-3 flex-1 flex-wrap">
                <div>
                  <p className="text-sm font-medium truncate">{product.productName}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {topProductsSortBy === "revenue"
                      ? `${formatNumber(product.quantity)} sản phẩm đã bán`
                      : formatVND(product.revenue)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {topProductsSortBy === "revenue"
                      ? formatVND(product.revenue)
                      : `${formatNumber(product.quantity)} sản phẩm`}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
