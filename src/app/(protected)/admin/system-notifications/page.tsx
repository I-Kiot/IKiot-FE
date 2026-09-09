"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import {
  listSystemNotifications,
  markSystemNotificationAsRead,
  markAllSystemNotificationsAsRead,
  deleteSystemNotification,
  deleteAllSystemNotifications,
  type SystemNotification,
} from "@/lib/api/notification";
import { useNotificationStore } from "@/store/notification-store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getSocket } from "@/lib/socket";
import { toast } from "sonner";
import { Bell, CreditCard, UserPlus, LifeBuoy, X, Trash2, Landmark } from "lucide-react";

export default function SystemNotificationsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [systemNotifications, setSystemNotifications] = useState<
    SystemNotification[]
  >([]);
  const [loading, setLoading] = useState(true);
  const decrementUnreadCount = useNotificationStore(
    (state) => state.decrementUnreadCount,
  );
  const setUnreadCount = useNotificationStore((state) => state.setUnreadCount);

  // Fetch initial notifications
  useEffect(() => {
    setLoading(true);
    listSystemNotifications()
      .then((data) => setSystemNotifications(data || []))
      .catch((err) => {
        console.error(err);
        toast.error("Không thể tải danh sách thông báo hệ thống!");
      })
      .finally(() => setLoading(false));
  }, []);

  // Listen to socket system-notification events in real-time
  useEffect(() => {
    try {
      const socket = getSocket();

      const handleNewNotification = (notification: SystemNotification) => {
        setSystemNotifications((prev) => [notification, ...prev]);
        toast.info(`Thông báo hệ thống mới: ${notification.title}`, {
          description: notification.description,
        });
      };

      socket.on("system-notification", handleNewNotification);
      return () => {
        socket.off("system-notification", handleNewNotification);
      };
    } catch (err) {
      console.error("Socket error on system notifications:", err);
    }
  }, []);

  // Mark single system notification as read
  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await markSystemNotificationAsRead(id);
      if (res.success) {
        setSystemNotifications((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, isRead: true } : item,
          ),
        );
        decrementUnreadCount();
        toast.success("Đã đọc thông báo");
      }
    } catch (err) {
      console.error(err);
      toast.error("Không thể cập nhật trạng thái!");
    }
  };

  const handleNotificationClick = async (notif: SystemNotification) => {
    if (!notif.isRead) {
      await handleMarkAsRead(notif.id);
    }
    if (notif.type === "SYSTEM_TICKET_CREATED" && notif.referenceId) {
      if (pathname === "/admin/tickets") {
        window.dispatchEvent(
          new CustomEvent("open-item", {
            detail: { type: "/admin/tickets", id: notif.referenceId },
          }),
        );
      }
      router.push(`/admin/tickets?ticketId=${notif.referenceId}`);
    } else if (notif.type === "SYSTEM_TENANT_CREATED" && notif.referenceId) {
      router.push(`/admin/users?tenantId=${notif.referenceId}`);
    } else if (notif.type === "SYSTEM_TRANSACTION") {
      router.push(`/admin/transactions`);
    } else if (notif.type === "SYSTEM_TENANT_BANK_UPDATED") {
      router.push(`/admin/sepay`);
    }
  };

  // Mark all system notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      const res = await markAllSystemNotificationsAsRead();
      if (res.success) {
        setSystemNotifications((prev) =>
          prev.map((item) => ({ ...item, isRead: true })),
        );
        setUnreadCount(0);
        toast.success("Đã đánh dấu đọc tất cả!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Không thể cập nhật trạng thái!");
    }
  };

  // Delete a single notification
  const handleDeleteOne = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const target = systemNotifications.find((n) => n.id === id);
    const wasUnread = target && !target.isRead;
    // Optimistic
    setSystemNotifications((prev) => prev.filter((n) => n.id !== id));
    if (wasUnread) decrementUnreadCount();
    try {
      await deleteSystemNotification(id);
    } catch {
      toast.error("Không thể xóa thông báo!");
      listSystemNotifications().then((data) =>
        setSystemNotifications(data || []),
      );
    }
  };

  // Delete all notifications
  const handleDeleteAll = async () => {
    const prevList = systemNotifications;
    setSystemNotifications([]);
    setUnreadCount(0);
    try {
      await deleteAllSystemNotifications();
      toast.success("Đã xóa tất cả thông báo!");
    } catch {
      toast.error("Không thể xóa thông báo!");
      setSystemNotifications(prevList);
    }
  };

  const getSysNotifIcon = (type: string) => {
    switch (type) {
      case "SYSTEM_TRANSACTION":
        return (
          <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500 shrink-0">
            <CreditCard className="h-5 w-5" />
          </div>
        );
      case "SYSTEM_TENANT_CREATED":
        return (
          <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500 shrink-0">
            <UserPlus className="h-5 w-5" />
          </div>
        );
      case "SYSTEM_TICKET_CREATED":
        return (
          <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500 shrink-0">
            <LifeBuoy className="h-5 w-5" />
          </div>
        );
      case "SYSTEM_TENANT_BANK_UPDATED":
        return (
          <div className="p-2 bg-violet-500/10 rounded-lg text-violet-500 shrink-0">
            <Landmark className="h-5 w-5" />
          </div>
        );
      default:
        return (
          <div className="p-2 bg-zinc-500/10 rounded-lg text-zinc-500 shrink-0">
            <Bell className="h-5 w-5" />
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <PageHeader
        breadcrumbs={[
          { label: "Trang chủ", href: "/admin/dashboard" },
          { label: "Thông báo" },
        ]}
        title="Thông báo hệ thống"
        description="Theo dõi hoạt động giao dịch, đăng ký cửa hàng mới và yêu cầu hỗ trợ thời gian thực."
        actions={
          <div className="flex items-center gap-2">
            {systemNotifications.some((s) => !s.isRead) && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleMarkAllAsRead}
                className="text-xs cursor-pointer"
              >
                Đánh dấu đọc tất cả
              </Button>
            )}
            {systemNotifications.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleDeleteAll}
                className="text-xs cursor-pointer text-destructive border-destructive/30 hover:bg-destructive/5"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Xóa tất cả
              </Button>
            )}
          </div>
        }
      />

      <div>
        {loading ? (
          <div className="text-center py-20 text-sm text-muted-foreground">
            <div className="flex flex-col items-center gap-2">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              <p className="text-xs">Đang tải thông báo hệ thống...</p>
            </div>
          </div>
        ) : systemNotifications.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
            Không có thông báo hệ thống nào gần đây.
          </div>
        ) : (
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
            {systemNotifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`group relative flex items-center justify-between p-4 rounded-lg border transition-all cursor-pointer hover:bg-muted/30 ${
                  notif.isRead
                    ? "bg-muted/10 opacity-75"
                    : "bg-card border-l-4 border-l-primary shadow-xs"
                }`}
              >
                <div className="flex items-center gap-4">
                  {getSysNotifIcon(notif.type)}
                  <div className="space-y-1">
                    <h4
                      className={`text-sm font-semibold ${notif.isRead ? "text-muted-foreground" : "text-foreground"}`}
                    >
                      {notif.title}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {notif.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <span className="text-[10px] text-muted-foreground font-mono whitespace-nowrap">
                    {new Date(notif.createdAt).toLocaleString("vi-VN")}
                  </span>
                  {/* Delete button - visible on hover */}
                  <button
                    onClick={(e) => handleDeleteOne(e, notif.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity rounded p-1 hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                    title="Xóa thông báo này"
                  >
                    <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
