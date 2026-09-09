"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { listTenants, type Tenant } from "@/lib/api/tenant";
import {
  composeAnnouncement,
  listAnnouncements,
  type NotificationAnnouncement,
} from "@/lib/api/notification";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Bell, Mail, Megaphone, ShieldAlert, Sparkles, Wrench } from "lucide-react";

export default function NotificationsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [announcements, setAnnouncements] = useState<NotificationAnnouncement[]>([]);
  
  const [loadingTenants, setLoadingTenants] = useState(false);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<"Maintenance" | "New feature" | "Promotion" | "Security">("Maintenance");
  const [targetType, setTargetType] = useState<"ALL" | "SELECTION">("ALL");
  const [selectedTenants, setSelectedTenants] = useState<string[]>([]);
  const [sending, setSending] = useState(false);

  // Load initial data
  useEffect(() => {
    // Fetch tenants
    setLoadingTenants(true);
    listTenants()
      .then((data) => setTenants(data || []))
      .catch((err) => console.error("Error loading tenants:", err))
      .finally(() => setLoadingTenants(false));

    // Fetch announcements history
    setLoadingAnnouncements(true);
    listAnnouncements()
      .then((data) => setAnnouncements(data || []))
      .catch((err) => console.error("Error loading announcements:", err))
      .finally(() => setLoadingAnnouncements(false));
  }, []);

  // Send announcement action
  const handleSendAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) {
      toast.error("Vui lòng nhập đầy đủ tiêu đề và nội dung!");
      return;
    }
    if (targetType === "SELECTION" && selectedTenants.length === 0) {
      toast.error("Vui lòng chọn ít nhất một cửa hàng!");
      return;
    }

    setSending(true);
    try {
      const res = await composeAnnouncement({
        title,
        description,
        category,
        targetType,
        targetTenants: targetType === "SELECTION" ? selectedTenants : undefined,
      });

      if (res.success) {
        toast.success("Đã gửi thông báo qua email thành công!");
        setTitle("");
        setDescription("");
        setSelectedTenants([]);
        // Refresh history
        setAnnouncements((prev) => [res.data, ...prev]);
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Gửi thông báo thất bại!");
    } finally {
      setSending(false);
    }
  };

  const getCategoryBadgeColor = (cat: string) => {
    switch (cat) {
      case "Maintenance":
        return "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/30";
      case "New feature":
        return "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/30";
      case "Promotion":
        return "bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border-rose-500/30";
      case "Security":
        return "bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 border-indigo-500/30";
      default:
        return "bg-zinc-500/10 text-zinc-500 border-zinc-500/30";
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "Maintenance":
        return <Wrench className="h-4.5 w-4.5 text-amber-500" />;
      case "New feature":
        return <Sparkles className="h-4.5 w-4.5 text-emerald-500" />;
      case "Promotion":
        return <Megaphone className="h-4.5 w-4.5 text-rose-500" />;
      case "Security":
        return <ShieldAlert className="h-4.5 w-4.5 text-indigo-500" />;
      default:
        return <Bell className="h-4.5 w-4.5 text-zinc-500" />;
    }
  };

  const toggleTenant = (id: string) => {
    setSelectedTenants((prev) =>
      prev.includes(id) ? prev.filter((tId) => tId !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <PageHeader
        breadcrumbs={[
          { label: "Trang chủ", href: "/admin/dashboard" },
          { label: "Gửi thông báo" },
        ]}
        title="Gửi email tuyên bố"
        description="Soạn và gửi thông báo khẩn cấp trực tiếp tới email của các chủ cửa hàng."
      />

      <Tabs defaultValue="announcement" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="announcement">Soạn Email Tuyên Bố</TabsTrigger>
          <TabsTrigger value="history">Lịch Sử Tuyên Bố</TabsTrigger>
        </TabsList>

        {/* Tab 1: Compose Announcement */}
        <TabsContent value="announcement">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border">
              <CardHeader>
                <CardTitle>Tạo thông báo mới</CardTitle>
                <CardDescription>
                  Hệ thống sẽ gửi email trực tiếp tới chủ sở hữu của các cửa hàng được nhắm mục tiêu.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSendAnnouncement} className="space-y-4">
                  <div className="space-y-1">
                    <Label htmlFor="title" className="font-semibold text-sm">Tiêu đề</Label>
                    <Input
                      id="title"
                      placeholder="Nhập tiêu đề thông báo..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="category" className="font-semibold text-sm">Loại thông báo</Label>
                      <Select
                        value={category}
                        onValueChange={(val: any) => setCategory(val)}
                      >
                        <SelectTrigger id="category">
                          <SelectValue placeholder="Chọn loại thông báo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Maintenance">Bảo trì hệ thống (Maintenance)</SelectItem>
                          <SelectItem value="New feature">Tính năng mới (New feature)</SelectItem>
                          <SelectItem value="Promotion">Khuyến mãi (Promotion)</SelectItem>
                          <SelectItem value="Security">Bảo mật (Security)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="target" className="font-semibold text-sm">Đối tượng nhận</Label>
                      <Select
                        value={targetType}
                        onValueChange={(val: any) => setTargetType(val)}
                      >
                        <SelectTrigger id="target">
                          <SelectValue placeholder="Chọn đối tượng" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">Tất cả cửa hàng (ALL)</SelectItem>
                          <SelectItem value="SELECTION">Cửa hàng được chọn (SELECTION)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="description" className="font-semibold text-sm">Nội dung chi tiết</Label>
                    <Textarea
                      id="description"
                      placeholder="Mô tả chi tiết thông báo gửi đến email..."
                      rows={8}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={sending}
                    className="w-full md:w-auto px-6 cursor-pointer"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    {sending ? "Đang gửi..." : "Gửi thông báo ngay"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Target selection side panel */}
            <Card className="border">
              <CardHeader>
                <CardTitle>Chọn cửa hàng nhắm mục tiêu</CardTitle>
                <CardDescription>
                  Chỉ áp dụng khi đối tượng nhận là "SELECTION".
                </CardDescription>
              </CardHeader>
              <CardContent>
                {targetType === "ALL" ? (
                  <div className="flex items-center justify-center py-20 border-2 border-dashed rounded-lg text-muted-foreground text-sm text-center px-4 bg-muted/20">
                    Đang thiết lập gửi cho toàn bộ cửa hàng trên hệ thống. Không cần chọn thủ công.
                  </div>
                ) : loadingTenants ? (
                  <div className="text-center py-10 text-xs text-muted-foreground">Đang tải danh sách cửa hàng...</div>
                ) : tenants.length === 0 ? (
                  <div className="text-center py-10 text-xs text-muted-foreground">Không có cửa hàng nào.</div>
                ) : (
                  <div className="max-h-[350px] overflow-y-auto space-y-2 pr-2">
                    {tenants.map((tenant) => (
                      <div
                        key={tenant.id}
                        onClick={() => toggleTenant(tenant.id)}
                        className={`flex items-center space-x-3 p-2 rounded-lg border cursor-pointer hover:bg-muted/40 transition-colors ${
                          selectedTenants.includes(tenant.id) ? "border-primary bg-primary/5" : ""
                        }`}
                      >
                        <Checkbox
                          checked={selectedTenants.includes(tenant.id)}
                          onCheckedChange={() => toggleTenant(tenant.id)}
                          className="cursor-pointer"
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-medium truncate">{tenant.name}</span>
                          <span className="text-[11px] text-muted-foreground truncate">{tenant.phoneNumber || "Chưa cập nhật SĐT"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 2: Announcements History */}
        <TabsContent value="history">
          <Card className="border">
            <CardHeader>
              <CardTitle>Lịch sử gửi thông báo</CardTitle>
              <CardDescription>
                Danh sách các tuyên bố thông báo đã được gửi qua email cho chủ các cửa hàng.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="font-semibold text-sm">Thời gian</TableHead>
                      <TableHead className="font-semibold text-sm">Loại</TableHead>
                      <TableHead className="font-semibold text-sm">Tiêu đề</TableHead>
                      <TableHead className="font-semibold text-sm">Đối tượng gửi</TableHead>
                      <TableHead className="font-semibold text-sm">Người gửi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingAnnouncements ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10 text-xs text-muted-foreground">
                          Đang tải lịch sử gửi thông báo...
                        </TableCell>
                      </TableRow>
                    ) : announcements.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10 text-sm text-muted-foreground">
                          Chưa có lịch sử gửi thông báo nào.
                        </TableCell>
                      </TableRow>
                    ) : (
                      announcements.map((ann) => (
                        <TableRow key={ann.id}>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(ann.createdAt).toLocaleString("vi-VN")}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`flex items-center gap-1 w-fit text-xs ${getCategoryBadgeColor(ann.category)}`}>
                              {getCategoryIcon(ann.category)}
                              {ann.category}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium text-sm">{ann.title}</span>
                              <span className="text-xs text-muted-foreground line-clamp-1 max-w-[400px]">{ann.description}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">
                            {ann.targetType === "ALL" ? (
                              <Badge variant="secondary">Tất cả cửa hàng</Badge>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {ann.targetTenants?.map((t) => (
                                  <Badge key={t.id} variant="outline" className="text-[10px]">
                                    {t.name}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {ann.createdBy?.email || "Admin"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
