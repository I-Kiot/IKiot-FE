import client from "./client";

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
