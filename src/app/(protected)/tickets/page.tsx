"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PageHeader } from "@/components/page-header";
import {
  createTicket,
  listMyTickets,
  replyMyTicket,
  deleteTicket,
  type Ticket,
} from "@/lib/api/ticket";
import { getSocket } from "@/lib/socket";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageSquarePlus,
  Send,
  CheckCircle2,
  Clock,
  AlertTriangle,
  LifeBuoy,
  Trash2,
} from "lucide-react";

// ─── Validation Schema ───────────────────────────────────────────────────────
const ticketSchema = z.object({
  title: z.string().min(5, "Tiêu đề phải có ít nhất 5 ký tự"),
  description: z.string().min(10, "Mô tả phải có ít nhất 10 ký tự"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
});
type TicketFormValues = z.infer<typeof ticketSchema>;

// ─── Helper Functions ─────────────────────────────────────────────────────────
const getPriorityLabel = (p: string) => {
  const map: Record<string, string> = {
    LOW: "Thấp",
    MEDIUM: "Trung bình",
    HIGH: "Cao",
    URGENT: "Khẩn cấp",
  };
  return map[p] ?? p;
};

const getPriorityClass = (p: string) => {
  switch (p) {
    case "URGENT":
      return "bg-rose-500/10 text-rose-500 border-rose-500/30 font-bold";
    case "HIGH":
      return "bg-amber-500/10 text-amber-500 border-amber-500/30";
    case "MEDIUM":
      return "bg-blue-500/10 text-blue-500 border-blue-500/30";
    default:
      return "bg-zinc-500/10 text-zinc-500 border-zinc-500/30";
  }
};

const getStatusLabel = (s: string) => {
  const map: Record<string, string> = {
    OPEN: "Đang chờ",
    IN_PROGRESS: "Đang xử lý",
    RESOLVED: "Đã giải quyết",
    CLOSED: "Đã đóng",
  };
  return map[s] ?? s;
};

const getStatusClass = (s: string) => {
  switch (s) {
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

const formatDate = (d: string) =>
  new Date(d).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TenantTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const [ticketToDelete, setTicketToDelete] = useState<Ticket | null>(null);
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!ticketToDelete) return;
    setDeleting(true);
    try {
      await deleteTicket(ticketToDelete.id);
      toast.success("Đã xóa phiếu phản ánh thành công!");
      setTickets((prev) => prev.filter((t) => t.id !== ticketToDelete.id));
      if (selectedTicket?.id === ticketToDelete.id) {
        setSelectedTicket(null);
      }
      setTicketToDelete(null);
    } catch (err) {
      console.error(err);
      toast.error("Xóa phiếu phản ánh thất bại!");
    } finally {
      setDeleting(false);
    }
  };

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

  const form = useForm<TicketFormValues>({
    resolver: zodResolver(ticketSchema),
    defaultValues: { title: "", description: "", priority: "MEDIUM" },
  });

  // ── Fetch my tickets
  const fetchTickets = () => {
    setLoading(true);
    listMyTickets()
      .then((data) => setTickets(data || []))
      .catch((err) => {
        console.error(err);
        toast.error("Không thể tải danh sách phản ánh!");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  // ── Auto-open ticket from URL query parameter (ticketId or id)
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

  // ── Listen to custom 'open-item' event for instant opening when already on the same page
  useEffect(() => {
    const handleOpenItem = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.type === "/tickets" && customEvent.detail?.id) {
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

  // ── Real-time ticket updates
  useEffect(() => {
    try {
      const socket = getSocket();
      const handleUpdate = (updated: Ticket) => {
        setTickets((prev) => {
          const idx = prev.findIndex((t) => t.id === updated.id);
          if (idx !== -1) {
            const copy = [...prev];
            copy[idx] = updated;
            return copy;
          }
          return [updated, ...prev];
        });
        setSelectedTicket((cur) => (cur?.id === updated.id ? updated : cur));
      };

      const handleDelete = (payload: { id: string }) => {
        setTickets((prev) => prev.filter((t) => t.id !== payload.id));
        setSelectedTicket((cur) => (cur?.id === payload.id ? null : cur));
      };

      socket.on("ticket-update", handleUpdate);
      socket.on("ticket-delete", handleDelete);
      return () => {
        socket.off("ticket-update", handleUpdate);
        socket.off("ticket-delete", handleDelete);
      };
    } catch (e) {
      console.error(e);
    }
  }, []);

  // ── Auto-scroll chat
  useEffect(() => {
    if (selectedTicket) {
      const timer = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedTicket, selectedTicket?.messages]);

  // ── Submit new ticket
  const onSubmit = async (values: TicketFormValues) => {
    setSubmitting(true);
    try {
      const res = await createTicket(values);
      if (res.success) {
        toast.success(
          "Gửi phản ánh thành công! Chúng tôi sẽ phản hồi sớm nhất.",
        );
        form.reset();
        setTickets((prev) => [res.data, ...prev]);
      }
    } catch (err) {
      console.error(err);
      toast.error("Gửi phản ánh thất bại. Vui lòng thử lại!");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Send reply in thread
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyMessage.trim()) return;

    setSendingReply(true);
    try {
      const res = await replyMyTicket(selectedTicket.id, replyMessage);
      if (res.success) {
        setReplyMessage("");
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
        }
        setIsOverflowing(false);
        setSelectedTicket(res.data);
        setTickets((prev) =>
          prev.map((t) => (t.id === res.data.id ? res.data : t)),
        );
        toast.success("Phản hồi đã được gửi!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Gửi phản hồi thất bại!");
    } finally {
      setSendingReply(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <PageHeader
        breadcrumbs={[
          { label: "Trang chủ", href: "/dashboard" },
          { label: "CSKH" },
          { label: "Phản ánh" },
        ]}
        title="Phản ánh & Hỗ trợ"
        description="Gửi yêu cầu hỗ trợ kỹ thuật hoặc phản ánh vấn đề đến đội ngũ quản trị hệ thống."
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* ── Create New Ticket Form ── */}
        <Card className="lg:col-span-2 shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <MessageSquarePlus className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Gửi phản ánh mới</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Điền đầy đủ thông tin để chúng tôi hỗ trợ bạn nhanh nhất
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col gap-4"
              >
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">
                        Tiêu đề vấn đề <span className="text-rose-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Ví dụ: Không thể đồng bộ sản phẩm..."
                          className="h-9"
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">
                        Mức độ ưu tiên <span className="text-rose-500">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Chọn mức độ" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="LOW">
                            Thấp - Không ảnh hưởng nghiêm trọng
                          </SelectItem>
                          <SelectItem value="MEDIUM">
                            Trung bình - Cần giải quyết sớm
                          </SelectItem>
                          <SelectItem value="HIGH">
                            Cao - Ảnh hưởng hoạt động kinh doanh
                          </SelectItem>
                          <SelectItem value="URGENT">
                            Khẩn cấp - Hệ thống ngừng hoạt động
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">
                        Mô tả chi tiết <span className="text-rose-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Mô tả rõ vấn đề bạn gặp phải, các bước tái hiện lỗi (nếu có)..."
                          rows={5}
                          className="resize-none text-sm"
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-9 text-sm cursor-pointer"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {submitting ? "Đang gửi..." : "Gửi phản ánh"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* ── Ticket History List ── */}
        <div className="lg:col-span-3 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              Lịch sử phản ánh
              {tickets.length > 0 && (
                <span className="ml-2 text-xs text-muted-foreground font-normal">
                  ({tickets.length} phiếu)
                </span>
              )}
            </h2>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="text-xs">Đang tải danh sách phản ánh...</span>
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground border rounded-xl border-dashed">
              <LifeBuoy className="h-10 w-10 opacity-30" />
              <div className="text-center">
                <p className="text-sm font-medium">Chưa có phản ánh nào</p>
                <p className="text-xs mt-1 opacity-70">
                  Sử dụng form bên trái để gửi yêu cầu hỗ trợ đầu tiên
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="relative group w-full">
                  <button
                    onClick={() => setSelectedTicket(ticket)}
                    className="w-full text-left rounded-xl border bg-card p-4 hover:border-primary/40 hover:bg-primary/5 transition-all shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-3 pr-6">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-[10px] font-semibold bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                            {ticket.ticketId}
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-[10px] h-5 ${getPriorityClass(ticket.priority)}`}
                          >
                            {getPriorityLabel(ticket.priority)}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`text-[10px] h-5 ${getStatusClass(ticket.status)}`}
                          >
                            {getStatusLabel(ticket.status)}
                          </Badge>
                        </div>
                        <p className="font-medium text-sm mt-1.5 truncate group-hover:text-primary transition-colors">
                          {ticket.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {ticket.description}
                        </p>
                      </div>
                      <div className="flex flex-col items-end shrink-0 gap-1">
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDate(ticket.updatedAt)}
                        </div>
                        {ticket.messages.length > 0 && (
                          <span className="text-[10px] text-muted-foreground">
                            {ticket.messages.length} tin nhắn
                          </span>
                        )}
                      </div>
                    </div>
                  </button>

                  {ticket.status === "CLOSED" && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTicketToDelete(ticket);
                      }}
                      title="Xóa phiếu phản ánh"
                      className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 cursor-pointer z-10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Ticket Thread Dialog ── */}
      <Dialog
        open={!!selectedTicket}
        onOpenChange={() => setSelectedTicket(null)}
      >
        <DialogContent className="sm:max-w-4xl h-[85vh] flex flex-col p-0 overflow-hidden border">
          {selectedTicket && (
            <>
              {/* Dialog Header */}
              <DialogHeader className="p-6 pb-4 border-b flex flex-row items-start justify-between space-y-0 shrink-0">
                <div className="space-y-1 pr-6">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-semibold bg-muted px-2 py-0.5 rounded text-muted-foreground">
                      {selectedTicket.ticketId}
                    </span>
                    <Badge
                      variant="outline"
                      className={getPriorityClass(selectedTicket.priority)}
                    >
                      {getPriorityLabel(selectedTicket.priority)}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={getStatusClass(selectedTicket.status)}
                    >
                      {getStatusLabel(selectedTicket.status)}
                    </Badge>
                  </div>
                  <DialogTitle className="text-lg font-bold mt-2 line-clamp-1">
                    {selectedTicket.title}
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    Gửi lúc: {formatDate(selectedTicket.createdAt)}
                  </DialogDescription>
                </div>
              </DialogHeader>

              {/* Chat Thread */}
              <ScrollArea className="flex-1 min-h-0 bg-background">
                <div className="p-6 pr-10 space-y-4">
                  {selectedTicket.messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground py-10">
                      <AlertTriangle className="h-6 w-6 opacity-40" />
                      <p className="text-xs">
                        Chưa có tin nhắn nào. Đang chờ phản hồi từ admin.
                      </p>
                    </div>
                  ) : (
                    selectedTicket.messages.map((msg, idx) => {
                      const isAdmin = msg.senderRole === "ADMIN";
                      return (
                        <div
                          key={idx}
                          className={`flex flex-col ${isAdmin ? "items-start" : "items-end"}`}
                        >
                          <div className="text-[10px] text-muted-foreground mb-1 px-1">
                            {isAdmin ? "Hỗ trợ kỹ thuật" : "Bạn"}
                          </div>
                          <div
                            className={`p-3 rounded-lg text-sm max-w-[85%] break-words shadow-2xs ${
                              isAdmin
                                ? "bg-card border rounded-tl-none"
                                : "bg-primary text-primary-foreground rounded-tr-none"
                            }`}
                          >
                            {msg.message}
                          </div>
                          <span className="text-[9px] text-muted-foreground mt-1 px-1">
                            {new Date(msg.createdAt).toLocaleTimeString(
                              "vi-VN",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </span>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Reply Input Footer */}
              <div className="pb-6 pt-1 relative px-6 bg-background shrink-0 z-20">
                {/* Top fade gradient overlay */}
                <div className="absolute top-0 left-0 right-0 h-10 -translate-y-full bg-gradient-to-t from-background to-transparent pointer-events-none z-10" />
                {selectedTicket.status === "CLOSED" ? (
                  <div className="flex items-center justify-center p-3 bg-muted/30 border border-dashed rounded-lg text-muted-foreground text-xs gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Yêu cầu hỗ trợ này đã được đóng.
                  </div>
                ) : (
                  <form
                    onSubmit={handleSendReply}
                    className="flex gap-2 items-end"
                  >
                    <Textarea
                      ref={textareaRef}
                      placeholder="Nhập thêm thông tin hoặc câu hỏi của bạn..."
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
                      Gửi
                    </Button>
                  </form>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Confirm Delete Dialog ── */}
      <Dialog open={!!ticketToDelete} onOpenChange={() => setTicketToDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-rose-600 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Xác nhận xóa phản ánh
            </DialogTitle>
            <DialogDescription className="text-xs mt-1">
              Bạn có chắc chắn muốn xóa phiếu phản ánh &quot;{ticketToDelete?.title}&quot; (mã {ticketToDelete?.ticketId})? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              disabled={deleting}
              onClick={() => setTicketToDelete(null)}
              className="cursor-pointer"
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={deleting}
              onClick={confirmDelete}
              className="cursor-pointer"
            >
              {deleting ? "Đang xóa..." : "Xóa vĩnh viễn"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
