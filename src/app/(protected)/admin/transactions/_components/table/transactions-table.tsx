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
import { Badge } from "@/components/ui/badge"
import { TransactionsToolbar } from "./transactions-toolbar"
import { TransactionsPagination } from "./transactions-pagination"
import { listAllInvoices, type AdminInvoice } from "@/lib/api/subscription"
import { toast } from "sonner"

export function TransactionsTable() {
  const [invoices, setInvoices] = useState<AdminInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [globalFilter, setGlobalFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [planFilter, setPlanFilter] = useState("all")

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const fetchInvoices = React.useCallback(() => {
    setLoading(true)
    listAllInvoices()
      .then((res) => {
        setInvoices(res || [])
      })
      .catch((err) => {
        console.error(err)
        toast.error("Không thể tải danh sách giao dịch từ hệ thống!")
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  React.useEffect(() => {
    fetchInvoices()
  }, [fetchInvoices])

  React.useEffect(() => {
    try {
      const { getSocket } = require("@/lib/socket");
      const socket = getSocket();

      const handleTransactionUpdate = (updatedInvoice: AdminInvoice) => {
        setInvoices((prev) => {
          const exists = prev.some((inv) => inv.id === updatedInvoice.id);
          if (exists) {
            return prev.map((inv) => (inv.id === updatedInvoice.id ? updatedInvoice : inv));
          } else {
            return [updatedInvoice, ...prev];
          }
        });

        toast.info(
          `Cập nhật giao dịch: ${updatedInvoice.tenantId?.name || "Cửa hàng"}`,
          {
            description: `Gói: ${updatedInvoice.planId?.planName || ""} &bull; Trạng thái: ${updatedInvoice.status}`,
          }
        );
      };

      socket.on("transaction-update", handleTransactionUpdate);
      return () => {
        socket.off("transaction-update", handleTransactionUpdate);
      };
    } catch (err) {
      console.error("Socket transaction listener error:", err);
    }
  }, [])

  // Reset page index when search or filter values change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [globalFilter, statusFilter, planFilter])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return (
          <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-xs font-normal" variant="outline">
            Thành công
          </Badge>
        )
      case "PENDING":
        return (
          <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 text-xs font-normal" variant="outline">
            Chờ duyệt
          </Badge>
        )
      case "FAILED":
        return (
          <Badge className="bg-red-500/10 text-red-500 border-red-500/20 text-xs font-normal" variant="outline">
            Thất bại
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPlanBadge = (plan?: string) => {
    switch (plan?.toUpperCase()) {
      case "PRO":
      case "ENTERPRISE":
        return (
          <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20 font-semibold text-2xs animate-pulse" variant="outline">
            Doanh nghiệp (PRO)
          </Badge>
        )
      case "PLUS":
      case "PROFESSIONAL":
        return (
          <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 font-medium text-2xs" variant="outline">
            Chuyên nghiệp (PLUS)
          </Badge>
        )
      case "TRIAL":
      case "BASIC":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-2xs" variant="outline">
            Dùng thử (TRIAL)
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="text-2xs">
            {plan || "Dùng thử"}
          </Badge>
        )
    }
  }

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const storeName = inv.tenantId?.name || ""
      const searchStr = `${inv.id} ${storeName} ${inv.paymentReference || ""} ${inv.tenantId?.phoneNumber || ""}`.toLowerCase()
      if (globalFilter && !searchStr.includes(globalFilter.toLowerCase())) {
        return false
      }

      if (statusFilter !== "all" && inv.status !== statusFilter) {
        return false
      }

      const planCode = inv.planId?.planCode || "TRIAL"
      if (planFilter !== "all" && planCode !== planFilter) {
        return false
      }

      return true
    })
  }, [invoices, globalFilter, statusFilter, planFilter])

  const paginatedInvoices = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredInvoices.slice(startIndex, startIndex + pageSize)
  }, [filteredInvoices, currentPage, pageSize])

  const totalPages = Math.ceil(filteredInvoices.length / pageSize) || 1

  if (loading) {
    return (
      <div className="flex h-[450px] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Đang tải lịch sử giao dịch...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <TransactionsToolbar
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        planFilter={planFilter}
        onPlanFilterChange={setPlanFilter}
      />

      <div className="rounded-xl border bg-card overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="font-semibold text-sm">Mã hóa đơn</TableHead>
              <TableHead className="font-semibold text-sm">Cửa hàng</TableHead>
              <TableHead className="font-semibold text-sm">Số điện thoại</TableHead>
              <TableHead className="font-semibold text-sm">Gói cước</TableHead>
              <TableHead className="font-semibold text-sm">Số tiền</TableHead>
              <TableHead className="font-semibold text-sm">Tham chiếu SePay</TableHead>
              <TableHead className="font-semibold text-sm">Ngày giao dịch</TableHead>
              <TableHead className="font-semibold text-sm">Trạng thái</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground text-sm">
                  Không tìm thấy lịch sử giao dịch nào.
                </TableCell>
              </TableRow>
            ) : (
              paginatedInvoices.map((inv) => (
                <TableRow key={inv.id} className="text-sm hover:bg-muted/30">
                  <TableCell className="font-semibold text-xs font-mono">{inv.id}</TableCell>
                  <TableCell className="font-medium text-foreground">{inv.tenantId?.name || "N/A"}</TableCell>
                  <TableCell className="text-muted-foreground">{inv.tenantId?.phoneNumber || "-"}</TableCell>
                  <TableCell>{getPlanBadge(inv.planId?.planCode)}</TableCell>
                  <TableCell className="font-bold text-primary">{inv.amount.toLocaleString()}đ</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{inv.paymentReference || "-"}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {inv.createdAt ? new Date(inv.createdAt).toLocaleString("vi-VN") : "N/A"}
                  </TableCell>
                  <TableCell>{getStatusBadge(inv.status)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <TransactionsPagination
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        totalPages={totalPages}
      />
    </div>
  )
}
