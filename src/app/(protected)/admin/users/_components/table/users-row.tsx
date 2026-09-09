"use client"

import * as React from "react"
import { useState } from "react"
import { TableCell, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ChevronRight } from "lucide-react"
import { UsersExpandedPanel } from "./users-expanded-panel"
import { type Tenant } from "@/lib/api/tenant"

interface UsersRowProps {
  tenant: Tenant
  onRefresh: () => void
}

export function UsersRow({ tenant, onRefresh }: UsersRowProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search)
      const tenantId = searchParams.get("tenantId") || searchParams.get("id")
      if (tenantId === tenant.id) {
        setIsExpanded(true)
      }
    }
  }, [tenant.id])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-xs font-normal" variant="outline">Hoạt động</Badge>
      case "INACTIVE":
        return <Badge className="bg-gray-500/10 text-gray-500 border-gray-500/20 text-xs font-normal" variant="outline">Chưa kích hoạt</Badge>
      case "SUSPENDED":
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20 text-xs font-normal" variant="outline">Bị tạm khóa</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPlanBadge = (plan?: string) => {
    switch (plan?.toUpperCase()) {
      case "PRO":
      case "ENTERPRISE":
        return <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20 font-semibold text-2xs" variant="outline">Doanh nghiệp (PRO)</Badge>
      case "PLUS":
      case "PROFESSIONAL":
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 font-medium text-2xs" variant="outline">Chuyên nghiệp (PLUS)</Badge>
      case "TRIAL":
      case "BASIC":
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-2xs" variant="outline">Dùng thử (TRIAL)</Badge>
      default:
        return <Badge variant="outline" className="text-2xs">{plan || "Dùng thử"}</Badge>
    }
  }

  const ownerName = [tenant.tenantOwnerId?.profile?.lastName, tenant.tenantOwnerId?.profile?.firstName]
    .filter(Boolean)
    .join(" ")
    .trim() || "Chưa thiết lập"

  return (
    <>
      <TableRow
        onClick={() => setIsExpanded(!isExpanded)}
        className={`cursor-pointer transition-colors duration-200 ${isExpanded ? "bg-primary/5 hover:bg-primary/10 shadow-[inset_0_1px_0_hsl(var(--primary)/0.2)]" : ""}`}
      >
        <TableCell className="w-8 pr-0">
          <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? "rotate-90 text-primary" : ""}`} />
        </TableCell>
        <TableCell className="font-semibold">
          <div className="flex flex-col">
            <span>{ownerName}</span>
            <span className="text-xs text-muted-foreground font-normal">{tenant.tenantOwnerId?.email || "N/A"}</span>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex flex-col">
            <span className="font-medium text-sm">{tenant.name || "N/A"}</span>
            <span className="text-2xs text-muted-foreground font-normal">{tenant.id}</span>
          </div>
        </TableCell>
        <TableCell>{getPlanBadge(tenant.activeSubscription?.planId?.planCode)}</TableCell>
        <TableCell>{getStatusBadge(tenant.status)}</TableCell>
        <TableCell className="text-muted-foreground text-sm">
          {tenant.createdAt ? new Date(tenant.createdAt).toLocaleDateString("vi-VN") : "N/A"}
        </TableCell>
      </TableRow>

      <TableRow className={`hover:bg-transparent border-transparent ${isExpanded ? "border-b border-primary/20" : ""}`}>
        <TableCell colSpan={6} className="p-0">
          <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
            <div className="overflow-hidden">
              <UsersExpandedPanel
                tenant={tenant}
                onRefresh={onRefresh}
                getStatusBadge={getStatusBadge}
                getPlanBadge={getPlanBadge}
              />
            </div>
          </div>
        </TableCell>
      </TableRow>
    </>
  )
}
