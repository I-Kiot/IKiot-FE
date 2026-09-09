"use client"

import * as React from "react"
import { useState, useMemo } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { UsersToolbar } from "./users-toolbar"
import { UsersRow } from "./users-row"
import { UsersPagination } from "./users-pagination"
import { listTenants, type Tenant } from "@/lib/api/tenant"
import { toast } from "sonner"

export function UsersTable() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [globalFilter, setGlobalFilter] = useState("")
  const [planFilter, setPlanFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const fetchTenants = React.useCallback(() => {
    setLoading(true)
    listTenants()
      .then((res) => {
        setTenants(res || [])
      })
      .catch((err) => {
        console.error(err)
        toast.error("Không thể tải danh sách tài khoản từ hệ thống!")
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  React.useEffect(() => {
    fetchTenants()
  }, [fetchTenants])

  const hasSelectedPageRef = React.useRef(false)
  React.useEffect(() => {
    if (tenants.length > 0 && !hasSelectedPageRef.current) {
      const searchParams = new URLSearchParams(window.location.search)
      const tenantId = searchParams.get("tenantId") || searchParams.get("id")
      if (tenantId) {
        const index = tenants.findIndex((t) => t.id === tenantId)
        if (index !== -1) {
          const page = Math.floor(index / pageSize) + 1
          setCurrentPage(page)
          hasSelectedPageRef.current = true
        }
      }
    }
  }, [tenants, pageSize])

  // Reset page index when search or filter values change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [globalFilter, planFilter, statusFilter])

  const filteredTenants = useMemo(() => {
    return tenants.filter((tenant) => {
      const ownerName = [tenant.tenantOwnerId?.profile?.lastName, tenant.tenantOwnerId?.profile?.firstName]
        .filter(Boolean)
        .join(" ")
        .trim()
      const searchStr = `${ownerName} ${tenant.tenantOwnerId?.email || ""} ${tenant.name || ""} ${tenant.id}`.toLowerCase()
      if (globalFilter && !searchStr.includes(globalFilter.toLowerCase())) {
        return false
      }
      
      const planCode = tenant.activeSubscription?.planId?.planCode || "TRIAL"
      if (planFilter !== "all" && planCode !== planFilter) {
        return false
      }
      
      if (statusFilter !== "all" && tenant.status !== statusFilter) {
        return false
      }
      return true
    })
  }, [tenants, globalFilter, planFilter, statusFilter])

  const paginatedTenants = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredTenants.slice(startIndex, startIndex + pageSize)
  }, [filteredTenants, currentPage, pageSize])

  const totalPages = Math.ceil(filteredTenants.length / pageSize) || 1

  if (loading) {
    return (
      <div className="flex h-[450px] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Đang tải danh sách người dùng...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <UsersToolbar
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        planFilter={planFilter}
        onPlanFilterChange={setPlanFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      {/* Tenant list table */}
      <div className="rounded-xl border bg-card overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-8" />
              <TableHead className="font-semibold text-sm">Họ tên chủ cửa hàng</TableHead>
              <TableHead className="font-semibold text-sm">Cửa hàng & Tên miền</TableHead>
              <TableHead className="font-semibold text-sm">Gói dịch vụ</TableHead>
              <TableHead className="font-semibold text-sm">Trạng thái</TableHead>
              <TableHead className="font-semibold text-sm">Ngày tham gia</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTenants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground text-sm">
                  Không tìm thấy dữ liệu phù hợp.
                </TableCell>
              </TableRow>
            ) : (
              paginatedTenants.map((tenant) => (
                <UsersRow key={tenant.id} tenant={tenant} onRefresh={fetchTenants} />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <UsersPagination
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        totalPages={totalPages}
      />
    </div>
  )
}
