import client from "./client";
import type { OrderEvent } from "@/types/order-event";

export interface AuditActor {
  id: string;
  name: string | null;
  phone: string;
  avatarUrl: string | null;
  systemRole: string;
  roleLabel: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  userRole?: string;
  action: string;
  resource: string;
  details?: string;
  tenantId?: string;
  tenantName?: string;
  ipAddress?: string;
  createdAt: string;
  actor?: AuditActor | null;
}

export interface AuditLogResponse {
  success: boolean;
  data: AuditLog[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AuditLogsParams {
  user?: string;
  action?: string;
  resource?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export async function listAuditLogs(params?: AuditLogsParams): Promise<AuditLogResponse> {
  const response = await client.get("/admin/audit-logs", { params });
  return response.data;
}

export async function listTenantAuditLogs(params?: AuditLogsParams): Promise<AuditLogResponse> {
  const response = await client.get("/audit-logs", { params });
  return response.data;
}

export interface OrderActivity extends OrderEvent {
  orderId: string;
  orderCode: string;
  actor?: AuditActor | null;
}

export interface OrderActivityResponse {
  success: boolean;
  data: OrderActivity[];
  pagination: AuditLogResponse["pagination"];
}

export interface OrderActivityParams {
  actor?: string;
  type?: string;
  orderCode?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export async function listOrderActivity(params?: OrderActivityParams): Promise<OrderActivityResponse> {
  const response = await client.get("/audit-logs/order-events", { params });
  return response.data;
}
