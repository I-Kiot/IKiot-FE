"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { PageHeader } from "@/components/page-header";
import {
  listAllTickets,
  replyTicket,
  closeTicket,
  type Ticket,
} from "@/lib/api/ticket";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getSocket } from "@/lib/socket";
import { toast } from "sonner";
import {
  LifeBuoy,
  MessageSquare,
  Send,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  // Active ticket selection details modal
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [closingTicket, setClosingTicket] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setReplyMessage(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 120)}px`;
      setIsOverflowing(scrollHeight > 120);
    }
  };

  // Load all support tickets initially
  const fetchTickets = (p = page, l = limit) => {
    setLoading(true);
    listAllTickets({ page: p, limit: l })
      .then((res) => {
        setTickets(res.data || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      })
      .catch((err) => {
        console.error(err);
        toast.error("Không thể tải danh sách yêu cầu hỗ trợ!");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTickets(page, limit);
  }, [page, limit]);

  // Auto-open ticket from URL query parameter (ticketId or id)
  useEffect(() => {
    if (tickets.length > 0) {
      const searchParams = new URLSearchParams(window.location.search);
      const ticketId = searchParams.get("ticketId") || searchParams.get("id");
      if (ticketId) {
        const found = tickets.find(
          (t) => t.id === ticketId || t.ticketId === ticketId,
        );
        if (found) {
          setSelectedTicket(found);
        }
      }
    }
  }, [tickets]);

  // Listen to custom 'open-item' event for instant opening when already on this page
  useEffect(() => {
    const handleOpenItem = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.type === "/admin/tickets" && customEvent.detail?.id) {
        const ticketId = customEvent.detail.id;
        const found = tickets.find(
          (t) => t.id === ticketId || t.ticketId === ticketId,
        );
        if (found) {
          setSelectedTicket(found);
        }
      }
    };

    window.addEventListener("open-item", handleOpenItem);
    return () => window.removeEventListener("open-item", handleOpenItem);
  }, [tickets]);

  // Listen to ticket-update real-time events
  useEffect(() => {
    try {
      const socket = getSocket();

      const handleTicketUpdate = (updatedTicket: Ticket) => {
        // Update list
        setTickets((prev) => {
          const index = prev.findIndex((t) => t.id === updatedTicket.id);
          if (index !== -1) {
            const copy = [...prev];
            copy[index] = updatedTicket;
            return copy;
          } else {
            return [updatedTicket, ...prev];
          }
        });

        // Notify active drawer/dialog
        setSelectedTicket((current) => {
          if (current?.id === updatedTicket.id) {
            return updatedTicket;
          }
          return current;
        });

        toast.info(`Cập nhật Ticket: ${updatedTicket.ticketId}`, {
          description: `Trạng thái: ${updatedTicket.status}`,
        });
      };

      socket.on("ticket-update", handleTicketUpdate);
      return () => {
        socket.off("ticket-update", handleTicketUpdate);
      };
    } catch (err) {
      console.error(err);
    }
  }, []);

  // Scroll to bottom of chat
  useEffect(() => {
    if (selectedTicket) {
      const timer = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedTicket, selectedTicket?.messages]);

  // Reply submit action
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyMessage.trim()) return;

    setSendingReply(true);
    try {
      const res = await replyTicket(selectedTicket.id, replyMessage);
      if (res.success) {
        setReplyMessage("");
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
        }
        setIsOverflowing(false);
        setSelectedTicket(res.data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Gửi phản hồi thất bại!");
    } finally {
      setSendingReply(false);
    }
  };

  // Close ticket action
  const handleCloseTicket = async () => {
    if (!selectedTicket) return;

    setClosingTicket(true);
    try {
      const res = await closeTicket(selectedTicket.id);
      if (res.success) {
        setSelectedTicket(res.data);
        toast.success("Đã đóng yêu cầu hỗ trợ!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Không thể đóng yêu cầu hỗ trợ!");
    } finally {
      setClosingTicket(false);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "bg-rose-500/10 text-rose-500 border-rose-500/30 font-bold";
      case "HIGH":
        return "bg-amber-500/10 text-amber-500 border-amber-500/30";
      case "MEDIUM":
        return "bg-blue-500/10 text-blue-500 border-blue-500/30";
      case "LOW":
        return "bg-zinc-500/10 text-zinc-500 border-zinc-500/30";
      default:
        return "bg-zinc-500/10 text-zinc-500 border-zinc-500/30";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/30";
      case "IN_PROGRESS":
        return "bg-amber-500/10 text-amber-500 border-amber-500/30";
      case "RESOLVED":
        return "bg-teal-500/10 text-teal-500 border-teal-500/30";
      case "CLOSED":
        return "bg-zinc-500/10 text-zinc-500 border-zinc-500/30";
      default:
        return "bg-zinc-500/10 text-zinc-500 border-zinc-500/30";
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("vi-VN");
  };

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <PageHeader
        breadcrumbs={[
          { label: "Trang chủ", href: "/admin/dashboard" },
          { label: "Hỗ trợ kỹ thuật" },
        ]}
        title="Trung tâm hỗ trợ kỹ thuật (Support Center)"
        description="Tiếp nhận, phản hồi và đóng các yêu cầu hỗ trợ (tickets) từ các cửa hàng gửi lên hệ thống."
      />

      {/* Tickets List Table */}
      <div className="rounded-xl border bg-card overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="font-semibold text-sm w-[150px]">
                Mã Ticket
              </TableHead>
              <TableHead className="font-semibold text-sm">Cửa hàng</TableHead>
              <TableHead className="font-semibold text-sm">
                Tiêu đề yêu cầu
              </TableHead>
              <TableHead className="font-semibold text-sm w-[120px]">
                Độ ưu tiên
              </TableHead>
              <TableHead className="font-semibold text-sm w-[130px]">
                Trạng thái
              </TableHead>
              <TableHead className="font-semibold text-sm w-[180px]">
                Cập nhật cuối
              </TableHead>
              <TableHead className="font-semibold text-sm w-[100px] text-right">
                Thao tác
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-20 text-muted-foreground text-sm"
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                    <p className="text-xs">Đang tải danh sách hỗ trợ...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : tickets.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-12 text-muted-foreground text-sm"
                >
                  Chưa có yêu cầu hỗ trợ nào được gửi.
                </TableCell>
              </TableRow>
            ) : (
              tickets.map((ticket) => (
                <TableRow key={ticket.id} className="hover:bg-muted/20">
                  <TableCell className="font-mono text-xs font-semibold">
                    {ticket.ticketId}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-sm">
                      {ticket.tenantName}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      ID: {ticket.tenantId}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div
                      className="font-medium text-sm truncate max-w-[280px]"
                      title={ticket.title}
                    >
                      {ticket.title}
                    </div>
                    <div className="text-xs text-muted-foreground truncate max-w-[280px]">
                      {ticket.description}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={getPriorityBadge(ticket.priority)}
                    >
                      {ticket.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 items-start">
                      <Badge
                        variant="outline"
                        className={getStatusBadge(ticket.status)}
                      >
                        {ticket.status === "OPEN"
                          ? "Đang chờ"
                          : ticket.status === "IN_PROGRESS"
                            ? "Đang xử lý"
                            : ticket.status === "RESOLVED"
                              ? "Đã giải quyết"
                              : "Đã đóng"}
                      </Badge>
                      {ticket.isDeletedByTenant && (
                        <Badge
                          variant="outline"
                          className="bg-rose-500/10 text-rose-500 border-rose-500/30 text-[9px] h-4 font-normal"
                        >
                          Đã xóa bởi user
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(ticket.updatedAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedTicket(ticket)}
                      className="cursor-pointer h-8 text-xs hover:bg-primary/5 hover:text-primary hover:border-primary/30"
                    >
                      <MessageSquare className="h-3.5 w-3.5 mr-1" />
                      Chi tiết
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t bg-muted/20">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Hiển thị:</span>
            <Select
              value={limit.toString()}
              onValueChange={(val) => {
                setLimit(Number(val));
                setPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-[70px] text-xs">
                <SelectValue placeholder={limit.toString()} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <span className="ml-1">
              dòng/trang &bull; Từ {tickets.length > 0 ? (page - 1) * limit + 1 : 0} đến {Math.min(page * limit, pagination.total)} trong tổng số {pagination.total} phiếu
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground mr-2 font-medium">
              Trang {pagination.page} / {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 cursor-pointer"
              disabled={page <= 1 || loading}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 cursor-pointer"
              disabled={page >= pagination.totalPages || loading}
              onClick={() => setPage((prev) => Math.min(pagination.totalPages, prev + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Ticket Dialogue Dialogue / Conversation Modal */}
      <Dialog
        open={!!selectedTicket}
        onOpenChange={() => setSelectedTicket(null)}
      >
        <DialogContent className="sm:max-w-4xl h-[85vh] flex flex-col p-0 overflow-hidden border">
          {selectedTicket && (
            <>
               {/* Header */}
              <DialogHeader className="p-6 pb-4 border-b flex flex-row items-center justify-between space-y-0 shrink-0">
                <div className="space-y-1 pr-6 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold bg-muted px-2 py-0.5 rounded text-muted-foreground">
                      {selectedTicket.ticketId}
                    </span>
                    <Badge
                      variant="outline"
                      className={getPriorityBadge(selectedTicket.priority)}
                    >
                      {selectedTicket.priority}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={getStatusBadge(selectedTicket.status)}
                    >
                      {selectedTicket.status}
                    </Badge>
                  </div>
                  <DialogTitle className="text-lg font-bold mt-2 line-clamp-1">
                    {selectedTicket.title}
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    Cửa hàng: <strong>{selectedTicket.tenantName}</strong>{" "}
                    &bull; Gửi lúc: {formatDate(selectedTicket.createdAt)}
                  </DialogDescription>
                </div>
                {selectedTicket.status !== "CLOSED" && (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={closingTicket}
                    onClick={handleCloseTicket}
                    className="h-9 text-xs cursor-pointer px-3 border shrink-0 mr-8"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-emerald-500" />
                    Đóng Ticket
                  </Button>
                )}
              </DialogHeader>

              {/* Chat Thread */}
              <ScrollArea className="flex-1 min-h-0 bg-background">
                <div className="p-6 pr-10 space-y-4">
                  {selectedTicket.messages.map((msg, index) => {
                    const isAdmin = msg.senderRole === "ADMIN";
                    return (
                      <div
                        key={index}
                        className={`flex flex-col ${isAdmin ? "items-end" : "items-start"}`}
                      >
                        <div className="text-[10px] text-muted-foreground mb-1 px-1">
                          {msg.senderName} (
                          {msg.senderRole === "ADMIN" ? "Admin" : "Store"}
                          )
                        </div>
                        <div
                          className={`p-3 rounded-lg text-sm max-w-[85%] break-words shadow-2xs ${
                            isAdmin
                              ? "bg-primary text-primary-foreground rounded-tr-none"
                              : "bg-card border rounded-tl-none"
                          }`}
                        >
                          {msg.message}
                        </div>
                        <span className="text-[9px] text-muted-foreground mt-1 px-1">
                          {new Date(msg.createdAt).toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Footer controls / Input */}
              <div className="pb-6 pt-1 relative px-6 bg-background flex flex-col gap-3 shrink-0 z-20">
                {/* Top fade gradient overlay */}
                <div className="absolute top-0 left-0 right-0 h-10 -translate-y-full bg-gradient-to-t from-background to-transparent pointer-events-none z-10" />
                {selectedTicket.status !== "CLOSED" ? (
                  <form
                    onSubmit={handleSendReply}
                    className="flex gap-2 items-end"
                  >
                    <Textarea
                      ref={textareaRef}
                      placeholder="Nhập nội dung phản hồi kỹ thuật..."
                      rows={1}
                      value={replyMessage}
                      onChange={handleTextareaChange}
                      className={`resize-none min-h-[44px] max-h-[120px] flex-1 text-sm ${
                        isOverflowing ? "overflow-y-auto" : "overflow-y-hidden"
                      }`}
                    />
                    <Button
                      type="submit"
                      disabled={sendingReply || !replyMessage.trim()}
                      className="h-11 px-4 cursor-pointer text-sm shrink-0"
                    >
                      <Send className="h-3.5 w-3.5 mr-1.5" />
                      Phản hồi
                    </Button>
                  </form>
                ) : (
                  <div className="flex items-center justify-center p-4 bg-muted/30 border border-dashed rounded-lg text-muted-foreground text-xs gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Ticket này đã đóng. Yêu cầu hỗ trợ đã hoàn thành.
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
