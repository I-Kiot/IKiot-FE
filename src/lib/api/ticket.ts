import client from "./client";

export interface TicketMessage {
  senderId: string;
  senderName: string;
  senderRole: string;
  message: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  ticketId: string;
  tenantId: string;
  tenantName: string;
  userId: string;
  title: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  messages: TicketMessage[];
  isDeletedByTenant?: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListAllTicketsResponse {
  success: boolean;
  data: Ticket[];
  pagination: PaginationMeta;
}

// Tenant API
export async function createTicket(payload: { title: string; description: string; priority: string }): Promise<{ success: boolean; data: Ticket }> {
  const response = await client.post("/tickets", payload);
  return response.data;
}

export async function listMyTickets(): Promise<Ticket[]> {
  const response = await client.get("/tickets/my");
  return response.data.data;
}

export async function replyMyTicket(id: string, message: string): Promise<{ success: boolean; data: Ticket }> {
  const response = await client.post(`/tickets/${id}/my-reply`, { message });
  return response.data;
}

// Shared API
export async function getTicketDetail(id: string): Promise<Ticket> {
  const response = await client.get(`/tickets/${id}`);
  return response.data.data;
}

export async function deleteTicket(id: string): Promise<{ success: boolean; message: string }> {
  const response = await client.delete(`/tickets/${id}`);
  return response.data;
}

// Admin API
export async function listAllTickets(params?: { page?: number; limit?: number }): Promise<ListAllTicketsResponse> {
  const response = await client.get("/admin/tickets", { params });
  return response.data;
}

export async function replyTicket(id: string, message: string): Promise<{ success: boolean; data: Ticket }> {
  const response = await client.post(`/admin/tickets/${id}/reply`, { message });
  return response.data;
}

export async function closeTicket(id: string): Promise<{ success: boolean; data: Ticket }> {
  const response = await client.patch(`/admin/tickets/${id}/close`);
  return response.data;
}
