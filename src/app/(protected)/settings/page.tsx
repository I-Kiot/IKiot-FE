"use client";

import * as React from "react";
import { Fragment } from "react";
import {
  Store,
  GitBranch,
  Warehouse,
  Lock,
  Palette,
  Layout,
  RotateCcw,
  Save,
  Plus,
  Upload,
  Computer,
  Smartphone,
  ShieldAlert,
  Eye,
  EyeOff,
  MapPin,
  Phone,
  Settings,
  ChevronRight,
  Users,
  Info,
  Pencil,
  Trash2,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ThemeTab } from "@/components/theme-customizer/theme-tab";
import { LayoutTab } from "@/components/theme-customizer/layout-tab";
import { useThemeManager } from "@/hooks/use-theme-manager";
import { useSidebarConfig } from "@/hooks/use-sidebar-config";
import { getMe } from "@/lib/api/auth";
import { getMyTenant } from "@/lib/api/tenant";
import { branchApi } from "@/lib/api/branch";
import { warehouseApi } from "@/lib/api/warehouse";
import { staffApi } from "@/lib/api/staff";
import client from "@/lib/api/client";
import type { Staff } from "@/types/staff";
import { PageHeader } from "@/components/page-header";

type TabType =
  | "store-info"
  | "branches"
  | "warehouses"
  | "security"
  | "theme"
  | "layout";

interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  isDefault: boolean;
  status: string;
}

interface WarehouseItem {
  id: string;
  name: string;
  address: string;
  status: string;
}

interface ActiveSession {
  id: string;
  device: string;
  ip: string;
  location: string;
  current: boolean;
  lastActive: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Branch Expandable Row
// ─────────────────────────────────────────────────────────────────────────────
function BranchExpandableRow({
  branch,
  onDelete,
  onUpdate,
}: {
  branch: Branch;
  onDelete: (id: string) => Promise<void>;
  onUpdate: (updated: Branch) => void;
}) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [staff, setStaff] = React.useState<Staff[]>([]);
  const [loadingStaff, setLoadingStaff] = React.useState(false);
  const loadedRef = React.useRef(false);

  // Edit state
  const [isEditing, setIsEditing] = React.useState(false);
  const [editForm, setEditForm] = React.useState({
    name: branch.name,
    phone: branch.phone,
    address: branch.address,
  });
  const [isSaving, setIsSaving] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  React.useEffect(() => {
    setEditForm({
      name: branch.name,
      phone: branch.phone,
      address: branch.address,
    });
  }, [branch.name, branch.phone, branch.address]);

  React.useEffect(() => {
    if (isExpanded && !loadedRef.current) {
      loadedRef.current = true;
      setLoadingStaff(true);
      staffApi
        .getList({ branchId: branch.id, limit: 50 })
        .then((res) => setStaff(res.data))
        .catch(() => setStaff([]))
        .finally(() => setLoadingStaff(false));
    }
    if (!isExpanded) {
      loadedRef.current = false;
    }
  }, [isExpanded, branch.id]);

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.name.trim()) {
      toast.error("Tên chi nhánh không được để trống!");
      return;
    }
    setIsSaving(true);
    try {
      const updated = await branchApi.update(branch.id, {
        name: editForm.name.trim(),
        phoneNumber: editForm.phone ? [editForm.phone] : undefined,
        address: editForm.address || undefined,
      });
      onUpdate({
        ...branch,
        name: updated.name,
        phone: updated.phoneNumber?.[0] || "",
        address: updated.address || "",
      });
      setIsEditing(false);
      toast.success(`Đã cập nhật chi nhánh "${updated.name}" thành công!`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lỗi khi cập nhật chi nhánh!");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (branch.isDefault) {
      toast.error("Không thể xóa chi nhánh mặc định!");
      return;
    }
    setIsDeleting(true);
    try {
      await onDelete(branch.id);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Fragment>
      <TableRow
        onClick={() => setIsExpanded((v) => !v)}
        className={cn(
          "cursor-pointer transition-colors duration-200",
          isExpanded &&
            "bg-primary/5 hover:bg-primary/10 shadow-[inset_0_1px_0_hsl(var(--primary)/0.2),inset_1px_0_0_hsl(var(--primary)/0.2),inset_-1px_0_0_hsl(var(--primary)/0.2)]",
        )}
      >
        <TableCell className="w-8 pr-0">
          <ChevronRight
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-200",
              isExpanded && "rotate-90 text-primary",
            )}
          />
        </TableCell>
        <TableCell className="font-medium">
          <div className="flex items-center gap-2">
            <span>{branch.name}</span>
            {branch.isDefault && (
              <Badge
                className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20"
                variant="outline"
              >
                Mặc định
              </Badge>
            )}
          </div>
        </TableCell>
        <TableCell>{branch.phone || "N/A"}</TableCell>
        <TableCell className="max-w-[200px] truncate" title={branch.address}>
          {branch.address || "N/A"}
        </TableCell>
        <TableCell>
          <Badge
            className="text-[10px] px-1.5 py-0 bg-green-500/10 text-green-500 border-green-500/20"
            variant="outline"
          >
            Hoạt động
          </Badge>
        </TableCell>
      </TableRow>

      {/* Expansion Panel Row */}
      <TableRow
        className={cn(
          "hover:bg-transparent transition-colors border-transparent",
          isExpanded &&
            "shadow-[inset_0_-1px_0_hsl(var(--primary)/0.2),inset_1px_0_0_hsl(var(--primary)/0.2),inset_-1px_0_0_hsl(var(--primary)/0.2)]",
        )}
      >
        <TableCell colSpan={5} className="p-0 border-t-0">
          <div
            className={cn(
              "grid transition-[grid-template-rows] duration-300 ease-in-out",
              isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
            )}
          >
            <div className="overflow-hidden">
              <div className="bg-muted/20 px-6 pb-6 pt-3 space-y-4 animate-in fade-in-0 duration-200">
                <Tabs defaultValue="info" className="w-full">
                  <TabsList>
                    <TabsTrigger value="info" className="gap-1.5">
                      <Info className="h-3.5 w-3.5" />
                      Thông tin
                    </TabsTrigger>
                    <TabsTrigger value="staff" className="gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      Nhân viên
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="info" className="outline-none mt-4">
                    {isEditing ? (
                      <form onSubmit={handleSaveEdit} className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Tên chi nhánh *</Label>
                            <Input
                              value={editForm.name}
                              onChange={(e) =>
                                setEditForm((p) => ({
                                  ...p,
                                  name: e.target.value,
                                }))
                              }
                              className="h-8 text-sm"
                              required
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Số điện thoại</Label>
                            <Input
                              value={editForm.phone}
                              onChange={(e) =>
                                setEditForm((p) => ({
                                  ...p,
                                  phone: e.target.value,
                                }))
                              }
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="space-y-1.5 sm:col-span-2">
                            <Label className="text-xs">Địa chỉ</Label>
                            <Input
                              value={editForm.address}
                              onChange={(e) =>
                                setEditForm((p) => ({
                                  ...p,
                                  address: e.target.value,
                                }))
                              }
                              className="h-8 text-sm"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <Button
                            type="submit"
                            size="sm"
                            className="h-7 text-xs cursor-pointer"
                            disabled={isSaving}
                          >
                            {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs cursor-pointer"
                            onClick={() => {
                              setIsEditing(false);
                              setEditForm({
                                name: branch.name,
                                phone: branch.phone,
                                address: branch.address,
                              });
                            }}
                          >
                            Hủy
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          <div className="space-y-3">
                            <div className="flex items-start gap-2">
                              <Store className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                              <div>
                                <p className="text-xs text-muted-foreground">
                                  Tên chi nhánh
                                </p>
                                <p className="font-medium">{branch.name}</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <Phone className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                              <div>
                                <p className="text-xs text-muted-foreground">
                                  Số điện thoại
                                </p>
                                <p className="font-medium">
                                  {branch.phone || "Chưa cập nhật"}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-start gap-2">
                              <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                              <div>
                                <p className="text-xs text-muted-foreground">
                                  Địa chỉ
                                </p>
                                <p className="font-medium">
                                  {branch.address || "Chưa cập nhật"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <Settings className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                              <div>
                                <p className="text-xs text-muted-foreground">
                                  Trạng thái
                                </p>
                                <Badge
                                  className="text-[10px] px-1.5 py-0 bg-green-500/10 text-green-500 border-green-500/20 mt-0.5"
                                  variant="outline"
                                >
                                  Hoạt động
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 pt-3 border-t mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1.5 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsEditing(true);
                            }}
                          >
                            <Pencil className="h-3 w-3" />
                            Chỉnh sửa
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1.5 cursor-pointer text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete();
                            }}
                            disabled={isDeleting || branch.isDefault}
                          >
                            <Trash2 className="h-3 w-3" />
                            {isDeleting ? "Đang xóa..." : "Xóa chi nhánh"}
                          </Button>
                        </div>
                      </>
                    )}
                  </TabsContent>

                  <TabsContent value="staff" className="outline-none mt-4">
                    {loadingStaff ? (
                      <div className="space-y-2">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <Skeleton key={i} className="h-9 w-full" />
                        ))}
                      </div>
                    ) : staff.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">
                        Chi nhánh chưa có nhân viên nào.
                      </p>
                    ) : (
                      <div className="rounded-md border bg-card overflow-hidden">
                        <Table>
                          <TableHeader className="bg-muted/50">
                            <TableRow>
                              <TableHead className="text-xs">Họ tên</TableHead>
                              <TableHead className="text-xs">Email</TableHead>
                              <TableHead className="text-xs">Vai trò</TableHead>
                              <TableHead className="text-xs">
                                Trạng thái
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {staff.map((s) => (
                              <TableRow key={s.id} className="text-xs">
                                <TableCell className="font-medium">
                                  {s.firstName} {s.lastName}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {s.email || "-"}
                                </TableCell>
                                <TableCell>{s.roleName}</TableCell>
                                <TableCell>
                                  <Badge
                                    className={cn(
                                      "text-[10px] px-1.5 py-0",
                                      s.status === "ACTIVE"
                                        ? "bg-green-500/10 text-green-500 border-green-500/20"
                                        : "bg-red-500/10 text-red-500 border-red-500/20",
                                    )}
                                    variant="outline"
                                  >
                                    {s.status === "ACTIVE"
                                      ? "Hoạt động"
                                      : "Vô hiệu"}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </TableCell>
      </TableRow>
    </Fragment>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Warehouse Expandable Row
// ─────────────────────────────────────────────────────────────────────────────
function WarehouseExpandableRow({
  warehouse,
  onDelete,
  onUpdate,
}: {
  warehouse: WarehouseItem;
  onDelete: (id: string) => Promise<void>;
  onUpdate: (updated: WarehouseItem) => void;
}) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [staff, setStaff] = React.useState<Staff[]>([]);
  const [loadingStaff, setLoadingStaff] = React.useState(false);
  const loadedRef = React.useRef(false);

  // Edit state
  const [isEditing, setIsEditing] = React.useState(false);
  const [editForm, setEditForm] = React.useState({
    name: warehouse.name,
    address: warehouse.address,
  });
  const [isSaving, setIsSaving] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  React.useEffect(() => {
    setEditForm({ name: warehouse.name, address: warehouse.address });
  }, [warehouse.name, warehouse.address]);

  React.useEffect(() => {
    if (isExpanded && !loadedRef.current) {
      loadedRef.current = true;
      setLoadingStaff(true);
      staffApi
        .getList({ warehouseId: warehouse.id, limit: 50 })
        .then((res) => setStaff(res.data))
        .catch(() => setStaff([]))
        .finally(() => setLoadingStaff(false));
    }
    if (!isExpanded) {
      loadedRef.current = false;
    }
  }, [isExpanded, warehouse.id]);

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.name.trim()) {
      toast.error("Tên kho tổng không được để trống!");
      return;
    }
    setIsSaving(true);
    try {
      const updated = await warehouseApi.update(warehouse.id, {
        name: editForm.name.trim(),
        address: editForm.address || undefined,
      });
      onUpdate({
        ...warehouse,
        name: updated.name,
        address: updated.address || "",
      });
      setIsEditing(false);
      toast.success(`Đã cập nhật kho tổng "${updated.name}" thành công!`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lỗi khi cập nhật kho tổng!");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(warehouse.id);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Fragment>
      <TableRow
        onClick={() => setIsExpanded((v) => !v)}
        className={cn(
          "cursor-pointer transition-colors duration-200",
          isExpanded &&
            "bg-primary/5 hover:bg-primary/10 shadow-[inset_0_1px_0_hsl(var(--primary)/0.2),inset_1px_0_0_hsl(var(--primary)/0.2),inset_-1px_0_0_hsl(var(--primary)/0.2)]",
        )}
      >
        <TableCell className="w-8 pr-0">
          <ChevronRight
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-200",
              isExpanded && "rotate-90 text-primary",
            )}
          />
        </TableCell>
        <TableCell className="font-medium">{warehouse.name}</TableCell>
        <TableCell className="max-w-[250px] truncate" title={warehouse.address}>
          {warehouse.address || "N/A"}
        </TableCell>
        <TableCell>
          <Badge
            className="text-[10px] px-1.5 py-0 bg-green-500/10 text-green-500 border-green-500/20"
            variant="outline"
          >
            Hoạt động
          </Badge>
        </TableCell>
      </TableRow>

      {/* Expansion Panel Row */}
      <TableRow
        className={cn(
          "hover:bg-transparent transition-colors border-transparent",
          isExpanded &&
            "shadow-[inset_0_-1px_0_hsl(var(--primary)/0.2),inset_1px_0_0_hsl(var(--primary)/0.2),inset_-1px_0_0_hsl(var(--primary)/0.2)]",
        )}
      >
        <TableCell colSpan={4} className="p-0 border-t-0">
          <div
            className={cn(
              "grid transition-[grid-template-rows] duration-300 ease-in-out",
              isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
            )}
          >
            <div className="overflow-hidden">
              <div className="bg-muted/20 px-6 pb-6 pt-3 space-y-4 animate-in fade-in-0 duration-200">
                <Tabs defaultValue="info" className="w-full">
                  <TabsList>
                    <TabsTrigger value="info" className="gap-1.5">
                      <Info className="h-3.5 w-3.5" />
                      Thông tin
                    </TabsTrigger>
                    <TabsTrigger value="staff" className="gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      Nhân viên
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="info" className="outline-none mt-4">
                    {isEditing ? (
                      <form onSubmit={handleSaveEdit} className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Tên kho tổng *</Label>
                            <Input
                              value={editForm.name}
                              onChange={(e) =>
                                setEditForm((p) => ({
                                  ...p,
                                  name: e.target.value,
                                }))
                              }
                              className="h-8 text-sm"
                              required
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Địa chỉ</Label>
                            <Input
                              value={editForm.address}
                              onChange={(e) =>
                                setEditForm((p) => ({
                                  ...p,
                                  address: e.target.value,
                                }))
                              }
                              className="h-8 text-sm"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <Button
                            type="submit"
                            size="sm"
                            className="h-7 text-xs cursor-pointer"
                            disabled={isSaving}
                          >
                            {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs cursor-pointer"
                            onClick={() => {
                              setIsEditing(false);
                              setEditForm({
                                name: warehouse.name,
                                address: warehouse.address,
                              });
                            }}
                          >
                            Hủy
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          <div className="space-y-3">
                            <div className="flex items-start gap-2">
                              <Warehouse className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                              <div>
                                <p className="text-xs text-muted-foreground">
                                  Tên kho tổng
                                </p>
                                <p className="font-medium">{warehouse.name}</p>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-start gap-2">
                              <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                              <div>
                                <p className="text-xs text-muted-foreground">
                                  Địa chỉ
                                </p>
                                <p className="font-medium">
                                  {warehouse.address || "Chưa cập nhật"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <Settings className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                              <div>
                                <p className="text-xs text-muted-foreground">
                                  Trạng thái
                                </p>
                                <Badge
                                  className="text-[10px] px-1.5 py-0 bg-green-500/10 text-green-500 border-green-500/20 mt-0.5"
                                  variant="outline"
                                >
                                  Hoạt động
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 pt-3 border-t mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1.5 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsEditing(true);
                            }}
                          >
                            <Pencil className="h-3 w-3" />
                            Chỉnh sửa
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1.5 cursor-pointer text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete();
                            }}
                            disabled={isDeleting}
                          >
                            <Trash2 className="h-3 w-3" />
                            {isDeleting ? "Đang xóa..." : "Xóa kho tổng"}
                          </Button>
                        </div>
                      </>
                    )}
                  </TabsContent>

                  <TabsContent value="staff" className="outline-none mt-4">
                    {loadingStaff ? (
                      <div className="space-y-2">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <Skeleton key={i} className="h-9 w-full" />
                        ))}
                      </div>
                    ) : staff.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">
                        Kho tổng chưa có nhân viên nào.
                      </p>
                    ) : (
                      <div className="rounded-md border bg-card overflow-hidden">
                        <Table>
                          <TableHeader className="bg-muted/50">
                            <TableRow>
                              <TableHead className="text-xs">Họ tên</TableHead>
                              <TableHead className="text-xs">Email</TableHead>
                              <TableHead className="text-xs">Vai trò</TableHead>
                              <TableHead className="text-xs">
                                Trạng thái
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {staff.map((s) => (
                              <TableRow key={s.id} className="text-xs">
                                <TableCell className="font-medium">
                                  {s.firstName} {s.lastName}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {s.email || "-"}
                                </TableCell>
                                <TableCell>{s.roleName}</TableCell>
                                <TableCell>
                                  <Badge
                                    className={cn(
                                      "text-[10px] px-1.5 py-0",
                                      s.status === "ACTIVE"
                                        ? "bg-green-500/10 text-green-500 border-green-500/20"
                                        : "bg-red-500/10 text-red-500 border-red-500/20",
                                    )}
                                    variant="outline"
                                  >
                                    {s.status === "ACTIVE"
                                      ? "Hoạt động"
                                      : "Vô hiệu"}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </TableCell>
      </TableRow>
    </Fragment>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = React.useState<TabType>("store-info");
  const { isDarkMode, resetTheme, applyRadius, applyTheme } = useThemeManager();
  const { config: sidebarConfig, updateConfig: updateSidebarConfig } =
    useSidebarConfig();

  // Theme states
  const [selectedTheme, setSelectedTheme] = React.useState("twitter");
  const [selectedRadius, setSelectedRadius] = React.useState("1rem");

  // API Loading state
  const [isLoading, setIsLoading] = React.useState(true);

  // Store info state
  const [storeInfo, setStoreInfo] = React.useState({
    name: "",
    code: "",
    phone: "",
    email: "",
    website: "",
    address: "",
    description: "",
    taxNumber: "",
    bankName: "",
    accountNumber: "",
    accountName: "",
  });
  const [isSavingStore, setIsSavingStore] = React.useState(false);
  // Whether ADMIN has linked this tenant's bank account with SePay.
  const [sepayLinked, setSepayLinked] = React.useState(false);

  // Branches state
  const [branches, setBranches] = React.useState<Branch[]>([]);
  const [showAddBranch, setShowAddBranch] = React.useState(false);
  const [newBranch, setNewBranch] = React.useState({
    name: "",
    address: "",
    phone: "",
    isDefault: false,
  });

  // Warehouses state
  const [warehouses, setWarehouses] = React.useState<WarehouseItem[]>([]);
  const [showAddWarehouse, setShowAddWarehouse] = React.useState(false);
  const [newWarehouse, setNewWarehouse] = React.useState({
    name: "",
    address: "",
    phoneNumber: "",
  });

  // Security state
  const [passwords, setPasswords] = React.useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = React.useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = React.useState(false);
  const [activeSessions, setActiveSessions] = React.useState<ActiveSession[]>([
    {
      id: "session-1",
      device: "Windows Chrome",
      ip: "113.190.232.84",
      location: "Hà Nội, Việt Nam",
      current: true,
      lastActive: "Đang hoạt động",
    },
    {
      id: "session-2",
      device: "iPhone 13 - Safari",
      ip: "14.161.42.112",
      location: "TP. Hồ Chí Minh, Việt Nam",
      current: false,
      lastActive: "2 giờ trước",
    },
  ]);

  // Load Theme variables from local storage on mount (avoid sync setState in effect lint error)
  React.useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("theme-preset");
      const savedRadius = localStorage.getItem("theme-radius");
      if (savedTheme) {
        setTimeout(() => setSelectedTheme(savedTheme), 0);
      }
      if (savedRadius) {
        setTimeout(() => setSelectedRadius(savedRadius), 0);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Load backend profile & branches
  const loadData = React.useCallback(async (isInitial = false) => {
    try {
      if (isInitial) {
        setIsLoading(true);
      }
      // The shop comes from `GET /tenant/me`, not from `GET /auth/me`: the latter answers
      // the user row and its role and has never carried a `tenant` object, so every field
      // in this block used to fall through its optional chain to "" - the whole "Thông tin
      // cửa hàng" card rendered blank however many times somebody filled it in.
      const [me, tenant] = await Promise.all([getMe(), getMyTenant()]);
      if (me || tenant) {
        setStoreInfo({
          name: tenant?.name || "",
          code: tenant?.id || me?.tenantId || "",
          phone: tenant?.phoneNumber || me?.phoneNumber || "",
          email: me?.email || "",
          website: "",
          address: tenant?.mainAddress || "",
          description: "",
          taxNumber: tenant?.taxNumber || "",
          bankName: tenant?.banking?.bankName || "",
          accountNumber: tenant?.banking?.accountNumber || "",
          accountName: tenant?.banking?.accountName || "",
        });
        setSepayLinked(Boolean(tenant?.hasSepayKey));
      }

      const branchRes = await branchApi.getList();
      if (branchRes && branchRes.success && branchRes.data) {
        const formattedBranches = branchRes.data.map((b: any) => ({
          id: b.id,
          name: b.name,
          address: b.address || "",
          phone:
            b.phoneNumber && b.phoneNumber.length > 0 ? b.phoneNumber[0] : "",
          isDefault: me ? me.branchId === b.id : false,
          status: b.status === "ACTIVE" ? "active" : "inactive",
        }));
        setBranches(formattedBranches);
      }

      const warehouseRes = await warehouseApi.getList();
      if (warehouseRes && warehouseRes.success && warehouseRes.data) {
        const formattedWarehouses = warehouseRes.data.map((w: any) => ({
          id: w.id,
          name: w.name,
          address: w.address || "",
          status: w.status === "ACTIVE" ? "active" : "inactive",
        }));
        setWarehouses(formattedWarehouses);
      }
    } catch (err) {
      console.error("Failed to load settings data:", err);
      if (isInitial) {
        toast.error("Không thể tải thông tin từ hệ thống!");
      }
    } finally {
      if (isInitial) {
        setIsLoading(false);
      }
    }
  }, []);

  React.useEffect(() => {
    loadData(true);
  }, [loadData]);

  React.useEffect(() => {
    const handleBranchesUpdated = () => {
      loadData(false);
    };
    window.addEventListener("branches-updated", handleBranchesUpdated);
    return () => {
      window.removeEventListener("branches-updated", handleBranchesUpdated);
    };
  }, [loadData]);

  // Re-apply themes when theme mode changes
  React.useEffect(() => {
    if (selectedTheme) {
      applyTheme(selectedTheme, isDarkMode);
    }
  }, [isDarkMode, selectedTheme, applyTheme]);

  const handleResetTheme = () => {
    setSelectedTheme("twitter");
    setSelectedRadius("1rem");
    resetTheme();
    applyRadius("1rem");
    updateSidebarConfig({
      variant: "inset",
      collapsible: "offcanvas",
      side: "left",
    });
    try {
      localStorage.setItem("theme-preset", "twitter");
      localStorage.setItem("theme-radius", "1rem");
      localStorage.setItem("theme-border", "thick");
      toast.success("Đã khôi phục thiết kế giao diện mặc định!");
    } catch (e) {
      console.error(e);
    }
  };

  // Store handlers
  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeInfo.name || !storeInfo.phone || !storeInfo.address) {
      toast.error("Vui lòng điền đầy đủ các thông tin bắt buộc!");
      return;
    }
    setIsSavingStore(true);
    try {
      // 1. Call API to update tenant info
      await client.put("/tenant/me", {
        name: storeInfo.name,
        phoneNumber: storeInfo.phone,
        mainAddress: storeInfo.address,
        taxNumber: storeInfo.taxNumber,
        banking: {
          accountNumber: storeInfo.accountNumber,
          bankName: storeInfo.bankName,
          accountName: storeInfo.accountName,
        },
      });

      // 2. Call API to update user profile if email changed
      const me = await getMe();
      if (me && me.email !== storeInfo.email) {
        await client.patch("/auth/me", {
          email: storeInfo.email,
        });
      }

      toast.success("Cập nhật thông tin cửa hàng thành công!");
    } catch (err: any) {
      console.error(err);
      toast.error(
        err.response?.data?.message || "Lỗi khi cập nhật thông tin cửa hàng!",
      );
    } finally {
      setIsSavingStore(false);
    }
  };

  // Branch handlers
  const handleAddBranchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranch.name || !newBranch.address) {
      toast.error("Vui lòng điền tên và địa chỉ chi nhánh!");
      return;
    }

    try {
      const created = await branchApi.create({
        name: newBranch.name,
        address: newBranch.address,
        phoneNumber: [newBranch.phone || "0987654321"],
        email: "branch@ikiot.vn",
      });

      if (created) {
        const branchRes = await branchApi.getList();
        if (branchRes && branchRes.success && branchRes.data) {
          const me = await getMe();
          const formattedBranches = branchRes.data.map((b: any) => ({
            id: b.id,
            name: b.name,
            address: b.address || "",
            phone:
              b.phoneNumber && b.phoneNumber.length > 0 ? b.phoneNumber[0] : "",
            isDefault: me ? me.branchId === b.id : false,
            status: b.status === "ACTIVE" ? "active" : "inactive",
          }));
          setBranches(formattedBranches);
        }
        setNewBranch({ name: "", address: "", phone: "", isDefault: false });
        setShowAddBranch(false);
        toast.success("Đã thêm chi nhánh mới thành công!");
        window.dispatchEvent(new Event("branches-updated"));
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Lỗi khi thêm chi nhánh mới!");
    }
  };

  const handleDeleteBranch = async (id: string) => {
    const branch = branches.find((b) => b.id === id);
    if (branch?.isDefault) {
      toast.error("Không thể xóa chi nhánh mặc định!");
      return;
    }

    try {
      await branchApi.remove(id);
      setBranches(branches.filter((b) => b.id !== id));
      toast.success(`Đã xóa chi nhánh "${branch?.name}" thành công!`);
      window.dispatchEvent(new Event("branches-updated"));
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Lỗi khi xóa chi nhánh!");
    }
  };

  const handleUpdateBranch = (updated: Branch) => {
    setBranches(branches.map((b) => (b.id === updated.id ? updated : b)));
    window.dispatchEvent(new Event("branches-updated"));
  };

  // Warehouse handlers
  const handleAddWarehouseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWarehouse.name) {
      toast.error("Vui lòng điền tên kho tổng!");
      return;
    }
    // `CreateWarehouseDto` requires at least one phone number, the same as a branch.
    if (!newWarehouse.phoneNumber.trim()) {
      toast.error("Vui lòng điền số điện thoại kho tổng!");
      return;
    }

    try {
      const created = await warehouseApi.create({
        name: newWarehouse.name,
        address: newWarehouse.address,
        phoneNumber: [newWarehouse.phoneNumber.trim()],
      });

      if (created) {
        const warehouseRes = await warehouseApi.getList();
        if (warehouseRes && warehouseRes.success && warehouseRes.data) {
          const formattedWarehouses = warehouseRes.data.map((w: any) => ({
            id: w.id,
            name: w.name,
            address: w.address || "",
            status: w.status === "ACTIVE" ? "active" : "inactive",
          }));
          setWarehouses(formattedWarehouses);
        }
        setNewWarehouse({ name: "", address: "", phoneNumber: "" });
        setShowAddWarehouse(false);
        toast.success("Đã thêm kho tổng mới thành công!");
        window.dispatchEvent(new Event("branches-updated"));
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Lỗi khi thêm kho tổng mới!");
    }
  };

  const handleDeleteWarehouse = async (id: string) => {
    const warehouse = warehouses.find((w) => w.id === id);
    try {
      await warehouseApi.remove(id);
      setWarehouses(warehouses.filter((w) => w.id !== id));
      toast.success(`Đã xóa kho tổng "${warehouse?.name}" thành công!`);
      window.dispatchEvent(new Event("branches-updated"));
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Lỗi khi xóa kho tổng!");
    }
  };

  const handleUpdateWarehouse = (updated: WarehouseItem) => {
    setWarehouses(warehouses.map((w) => (w.id === updated.id ? updated : w)));
    window.dispatchEvent(new Event("branches-updated"));
  };

  // Security handlers
  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      toast.error("Vui lòng nhập đầy đủ thông tin mật khẩu!");
      return;
    }
    if (passwords.new !== passwords.confirm) {
      toast.error("Mật khẩu mới và mật khẩu xác nhận không khớp!");
      return;
    }
    if (passwords.new.length < 6) {
      toast.error("Mật khẩu mới phải từ 6 ký tự trở lên!");
      return;
    }

    setIsUpdatingPassword(true);
    setTimeout(() => {
      setIsUpdatingPassword(false);
      setPasswords({ current: "", new: "", confirm: "" });
      toast.success("Thay đổi mật khẩu thành công!");
    }, 800);
  };

  const handleLogoutSession = (id: string) => {
    setActiveSessions(activeSessions.filter((s) => s.id !== id));
    toast.success("Đã đăng xuất thiết bị thành công!");
  };

  const handleToggle2FA = (checked: boolean) => {
    setTwoFactorEnabled(checked);
    if (checked) {
      toast.success("Đã kích hoạt xác thực bảo mật 2 lớp (2FA)!");
    } else {
      toast.info("Đã tắt bảo mật 2 lớp (2FA)!");
    }
  };

  const sidebarItems = [
    {
      group: "CỬA HÀNG",
      items: [
        { id: "store-info", label: "Thông tin cửa hàng", icon: Store },
        { id: "branches", label: "Quản lý chi nhánh", icon: GitBranch },
        { id: "warehouses", label: "Quản lý kho tổng", icon: Warehouse },
        { id: "security", label: "Bảo mật", icon: Lock },
      ],
    },
    {
      group: "GIAO DIỆN",
      items: [
        { id: "theme", label: "Chủ đề", icon: Palette },
        { id: "layout", label: "Bố cục", icon: Layout },
      ],
    },
  ];

  if (isLoading) {
    return (
      <div className="flex h-[450px] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">
            Đang tải dữ liệu cài đặt...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      {/* Header section of settings page */}
      <PageHeader
        breadcrumbs={[
          { label: "Trang chủ", href: "/dashboard" },
          { label: "Cài đặt" },
          { label: "Cấu hình" },
        ]}
        title="Cấu hình hệ thống"
        description="Quản lý các thiết lập và tùy chỉnh hệ thống."
      />

      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Left Navigation Sidebar */}
        <aside className="w-full md:w-64 shrink-0 md:sticky md:top-20 space-y-6">
          <nav className="space-y-6">
            {sidebarItems.map((group) => (
              <div key={group.group} className="space-y-1">
                <h4 className="px-3 text-[11px] font-bold text-muted-foreground/75 tracking-wider uppercase">
                  {group.group}
                </h4>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id as TabType);
                          setShowAddBranch(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                          isActive
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        <Icon
                          className={`h-4.5 w-4.5 shrink-0 ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`}
                        />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        {/* Right Content Panel */}
        <main className="flex-1 w-full min-w-0 bg-card border rounded-xl shadow-xs overflow-hidden flex flex-col md:h-[calc(100vh-12rem)] md:max-h-[750px]">
          {/* Header of Active Section */}
          <div className="flex items-center justify-between p-6 border-b bg-muted/10">
            <div>
              <h2 className="text-lg font-bold">
                {activeTab === "store-info" && "Thông tin cửa hàng"}
                {activeTab === "branches" && "Quản lý chi nhánh"}
                {activeTab === "warehouses" && "Quản lý kho tổng"}
                {activeTab === "security" && "Cấu hình bảo mật"}
                {activeTab === "theme" && "Tùy biến chủ đề"}
                {activeTab === "layout" && "Cấu hình bố cục"}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {activeTab === "store-info" &&
                  "Quản lý thông tin định danh và liên hệ chính của cửa hàng."}
                {activeTab === "branches" &&
                  "Thêm mới, sửa đổi hoặc tùy chỉnh các chi nhánh cửa hàng của bạn."}
                {activeTab === "warehouses" &&
                  "Quản lý danh sách các kho tổng chứa hàng hóa."}
                {activeTab === "security" &&
                  "Đổi mật khẩu, kích hoạt bảo mật 2 lớp (2FA) và quản lý phiên đăng nhập."}
                {activeTab === "theme" &&
                  "Điều chỉnh giao diện màu sắc, bo góc và chế độ hiển thị sáng tối."}
                {activeTab === "layout" &&
                  "Cấu hình cách bố trí của sidebar, chế độ thu nhỏ và vị trí hiển thị."}
              </p>
            </div>

            {/* Reset customizer options */}
            {(activeTab === "theme" || activeTab === "layout") && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetTheme}
                className="cursor-pointer text-xs"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                Đặt lại mặc định
              </Button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {/* Tab 1: Store Info */}
            {activeTab === "store-info" && (
              <form onSubmit={handleSaveStore} className="space-y-6">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  {/* Logo Section */}
                  <div className="flex flex-col items-center gap-3 w-full md:w-44 shrink-0">
                    <Label className="text-sm font-medium self-start md:self-center">
                      Logo Cửa hàng
                    </Label>
                    <div className="relative group w-32 h-32 rounded-xl border border-dashed border-muted-foreground/30 bg-muted/10 overflow-hidden flex items-center justify-center">
                      <div className="text-center p-4">
                        <Store className="h-10 w-10 text-muted-foreground/60 mx-auto" />
                        <span className="text-2xs text-muted-foreground mt-1 block">
                          iKiot Logo
                        </span>
                      </div>
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer transition-opacity duration-200">
                        <Upload className="h-5 w-5 mb-1" />
                        <span className="text-3xs font-medium">
                          Tải ảnh lên
                        </span>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground text-center">
                      Khuyên dùng ảnh PNG hình vuông dưới 2MB.
                    </p>
                  </div>

                  {/* Store Form Details */}
                  <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="store-name">
                        Tên cửa hàng <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="store-name"
                        value={storeInfo.name}
                        onChange={(e) =>
                          setStoreInfo({ ...storeInfo, name: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="store-code">Mã định danh (ID)</Label>
                      <Input
                        id="store-code"
                        value={storeInfo.code}
                        disabled
                        className="bg-muted text-muted-foreground"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="store-phone">
                        Số điện thoại liên hệ{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="store-phone"
                        value={storeInfo.phone}
                        onChange={(e) =>
                          setStoreInfo({ ...storeInfo, phone: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="store-email">
                        Email <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="store-email"
                        type="email"
                        value={storeInfo.email}
                        onChange={(e) =>
                          setStoreInfo({ ...storeInfo, email: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="store-tax">Mã số thuế</Label>
                      <Input
                        id="store-tax"
                        value={storeInfo.taxNumber}
                        onChange={(e) =>
                          setStoreInfo({
                            ...storeInfo,
                            taxNumber: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="store-address">
                        Địa chỉ chính{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="store-address"
                        value={storeInfo.address}
                        onChange={(e) =>
                          setStoreInfo({
                            ...storeInfo,
                            address: e.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Separator className="my-2" />
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="text-sm font-semibold text-foreground/80">
                          Cấu hình thanh toán ngân hàng (Để nhận thanh toán đơn
                          hàng)
                        </h4>
                        {sepayLinked ? (
                          <Badge
                            variant="outline"
                            className="gap-1 bg-green-500/10 text-green-500 border-green-500/20"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            Đã liên kết SePay
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="gap-1 bg-amber-500/10 text-amber-600 border-amber-500/20"
                          >
                            <Clock className="h-3 w-3" />
                            Chờ quản trị viên liên kết
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {sepayLinked
                          ? "Tài khoản đã được liên kết với cổng SePay - bạn có thể nhận thanh toán đơn hàng qua mã QR."
                          : "Sau khi lưu thông tin ngân hàng, quản trị viên sẽ liên kết tài khoản của bạn với cổng SePay. Bạn sẽ nhận được thông báo khi hoàn tất."}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="store-bank-name">Tên ngân hàng</Label>
                      <Input
                        id="store-bank-name"
                        placeholder="Ví dụ: MBBank, Vietcombank..."
                        value={storeInfo.bankName}
                        onChange={(e) =>
                          setStoreInfo({
                            ...storeInfo,
                            bankName: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="store-bank-acc">
                        Số tài khoản ngân hàng
                      </Label>
                      <Input
                        id="store-bank-acc"
                        placeholder="Nhập số tài khoản"
                        value={storeInfo.accountNumber}
                        onChange={(e) =>
                          setStoreInfo({
                            ...storeInfo,
                            accountNumber: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="store-bank-holder">
                        Tên chủ tài khoản (Viết hoa không dấu)
                      </Label>
                      <Input
                        id="store-bank-holder"
                        placeholder="Ví dụ: NGUYEN VAN A"
                        value={storeInfo.accountName}
                        onChange={(e) =>
                          setStoreInfo({
                            ...storeInfo,
                            accountName: e.target.value.toUpperCase(),
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-end gap-2">
                  <Button
                    type="submit"
                    disabled={isSavingStore}
                    className="cursor-pointer"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSavingStore ? "Đang lưu..." : "Lưu thay đổi"}
                  </Button>
                </div>
              </form>
            )}

            {/* Tab 2: Branches Management */}
            {activeTab === "branches" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-semibold text-muted-foreground">
                    Danh sách chi nhánh ({branches.length})
                  </h3>
                  {!showAddBranch && (
                    <Button
                      onClick={() => setShowAddBranch(true)}
                      size="sm"
                      className="cursor-pointer text-xs"
                    >
                      <Plus className="h-4 w-4 mr-1" /> Thêm chi nhánh
                    </Button>
                  )}
                </div>

                {/* Add branch inline form */}
                {showAddBranch && (
                  <Card className="border border-primary/20 bg-primary/5 animate-in slide-in-from-top-4 duration-200">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-sm font-bold">
                        Thêm chi nhánh mới
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Nhập thông tin chi nhánh cửa hàng mới
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-4">
                      <form
                        onSubmit={handleAddBranchSubmit}
                        className="space-y-3"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label htmlFor="branch-name" className="text-xs">
                              Tên chi nhánh *
                            </Label>
                            <Input
                              id="branch-name"
                              placeholder="Ví dụ: Chi nhánh Cầu Giấy"
                              value={newBranch.name}
                              onChange={(e) =>
                                setNewBranch({
                                  ...newBranch,
                                  name: e.target.value,
                                })
                              }
                              required
                              className="h-9 text-sm"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="branch-phone" className="text-xs">
                              Số điện thoại
                            </Label>
                            <Input
                              id="branch-phone"
                              placeholder="024.xxxx.xxxx"
                              value={newBranch.phone}
                              onChange={(e) =>
                                setNewBranch({
                                  ...newBranch,
                                  phone: e.target.value,
                                })
                              }
                              className="h-9 text-sm"
                            />
                          </div>
                          <div className="space-y-1.5 md:col-span-2">
                            <Label htmlFor="branch-address" className="text-xs">
                              Địa chỉ chi nhánh *
                            </Label>
                            <Input
                              id="branch-address"
                              placeholder="Nhập địa chỉ chi tiết"
                              value={newBranch.address}
                              onChange={(e) =>
                                setNewBranch({
                                  ...newBranch,
                                  address: e.target.value,
                                })
                              }
                              required
                              className="h-9 text-sm"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowAddBranch(false)}
                            className="cursor-pointer text-xs h-8"
                          >
                            Hủy
                          </Button>
                          <Button
                            type="submit"
                            size="sm"
                            className="cursor-pointer text-xs h-8"
                          >
                            Xác nhận thêm
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                )}

                {/* Branch Table with Expandable Rows */}
                <div className="border rounded-xl overflow-hidden bg-background">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead className="w-8" />
                        <TableHead>Tên chi nhánh</TableHead>
                        <TableHead>Số điện thoại</TableHead>
                        <TableHead>Địa chỉ</TableHead>
                        <TableHead>Trạng thái</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {branches.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="text-center py-6 text-muted-foreground"
                          >
                            Chưa có chi nhánh nào.
                          </TableCell>
                        </TableRow>
                      ) : (
                        branches.map((branch) => (
                          <BranchExpandableRow
                            key={branch.id}
                            branch={branch}
                            onDelete={handleDeleteBranch}
                            onUpdate={handleUpdateBranch}
                          />
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Tab 3: Warehouses Management */}
            {activeTab === "warehouses" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-semibold text-muted-foreground">
                    Danh sách kho tổng ({warehouses.length})
                  </h3>
                  {!showAddWarehouse && (
                    <Button
                      onClick={() => setShowAddWarehouse(true)}
                      size="sm"
                      className="cursor-pointer text-xs"
                    >
                      <Plus className="h-4 w-4 mr-1" /> Thêm kho tổng
                    </Button>
                  )}
                </div>

                {/* Add warehouse inline form */}
                {showAddWarehouse && (
                  <Card className="border border-primary/20 bg-primary/5 animate-in slide-in-from-top-4 duration-200">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-sm font-bold">
                        Thêm kho tổng mới
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Nhập thông tin kho hàng tổng mới
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-4">
                      <form
                        onSubmit={handleAddWarehouseSubmit}
                        className="space-y-3"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label htmlFor="warehouse-name" className="text-xs">
                              Tên kho tổng *
                            </Label>
                            <Input
                              id="warehouse-name"
                              placeholder="Ví dụ: Kho tổng Hà Nội"
                              value={newWarehouse.name}
                              onChange={(e) =>
                                setNewWarehouse({
                                  ...newWarehouse,
                                  name: e.target.value,
                                })
                              }
                              required
                              className="h-9 text-sm"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label
                              htmlFor="warehouse-phone"
                              className="text-xs"
                            >
                              Số điện thoại *
                            </Label>
                            <Input
                              id="warehouse-phone"
                              placeholder="Ví dụ: 0987654321"
                              value={newWarehouse.phoneNumber}
                              onChange={(e) =>
                                setNewWarehouse({
                                  ...newWarehouse,
                                  phoneNumber: e.target.value,
                                })
                              }
                              required
                              className="h-9 text-sm"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label
                              htmlFor="warehouse-address"
                              className="text-xs"
                            >
                              Địa chỉ kho hàng
                            </Label>
                            <Input
                              id="warehouse-address"
                              placeholder="Địa chỉ chi tiết"
                              value={newWarehouse.address}
                              onChange={(e) =>
                                setNewWarehouse({
                                  ...newWarehouse,
                                  address: e.target.value,
                                })
                              }
                              className="h-9 text-sm"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowAddWarehouse(false)}
                            className="cursor-pointer text-xs h-8"
                          >
                            Hủy
                          </Button>
                          <Button
                            type="submit"
                            size="sm"
                            className="cursor-pointer text-xs h-8"
                          >
                            Xác nhận thêm
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                )}

                {/* Warehouse Table with Expandable Rows */}
                <div className="border rounded-xl overflow-hidden bg-background">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead className="w-8" />
                        <TableHead>Tên kho tổng</TableHead>
                        <TableHead>Địa chỉ</TableHead>
                        <TableHead>Trạng thái</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {warehouses.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-center py-6 text-muted-foreground"
                          >
                            Chưa có kho tổng nào.
                          </TableCell>
                        </TableRow>
                      ) : (
                        warehouses.map((warehouse) => (
                          <WarehouseExpandableRow
                            key={warehouse.id}
                            warehouse={warehouse}
                            onDelete={handleDeleteWarehouse}
                            onUpdate={handleUpdateWarehouse}
                          />
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Tab 3: Security & Session */}
            {activeTab === "security" && (
              <div className="space-y-6">
                {/* Change Password Card */}
                <Card className="border border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Lock className="h-4 w-4 text-primary" /> Thay đổi mật
                      khẩu
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Đảm bảo mật khẩu dài hơn 6 ký tự và có ký tự đặc biệt.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1.5 relative">
                          <Label htmlFor="curr-pass" className="text-xs">
                            Mật khẩu hiện tại
                          </Label>
                          <div className="relative">
                            <Input
                              id="curr-pass"
                              type={showCurrentPassword ? "text" : "password"}
                              value={passwords.current}
                              onChange={(e) =>
                                setPasswords({
                                  ...passwords,
                                  current: e.target.value,
                                })
                              }
                              className="h-9 pr-9"
                              placeholder="••••••••"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowCurrentPassword(!showCurrentPassword)
                              }
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                              {showCurrentPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1.5 relative">
                          <Label htmlFor="new-pass" className="text-xs">
                            Mật khẩu mới
                          </Label>
                          <div className="relative">
                            <Input
                              id="new-pass"
                              type={showNewPassword ? "text" : "password"}
                              value={passwords.new}
                              onChange={(e) =>
                                setPasswords({
                                  ...passwords,
                                  new: e.target.value,
                                })
                              }
                              className="h-9 pr-9"
                              placeholder="Tối thiểu 6 ký tự"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowNewPassword(!showNewPassword)
                              }
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                              {showNewPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1.5 relative">
                          <Label htmlFor="conf-pass" className="text-xs">
                            Xác nhận mật khẩu mới
                          </Label>
                          <div className="relative">
                            <Input
                              id="conf-pass"
                              type={showConfirmPassword ? "text" : "password"}
                              value={passwords.confirm}
                              onChange={(e) =>
                                setPasswords({
                                  ...passwords,
                                  confirm: e.target.value,
                                })
                              }
                              className="h-9 pr-9"
                              placeholder="Nhập lại mật khẩu mới"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowConfirmPassword(!showConfirmPassword)
                              }
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end pt-1">
                        <Button
                          type="submit"
                          size="sm"
                          disabled={isUpdatingPassword}
                          className="cursor-pointer text-xs h-8.5"
                        >
                          {isUpdatingPassword
                            ? "Đang cập nhật..."
                            : "Cập nhật mật khẩu"}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>

                {/* Two Factor Auth Card */}
                <Card className="border border-border">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4 text-amber-500" /> Xác
                        thực bảo mật 2 lớp (2FA)
                      </CardTitle>
                      <Switch
                        checked={twoFactorEnabled}
                        onCheckedChange={handleToggle2FA}
                      />
                    </div>
                    <CardDescription className="text-xs mt-1">
                      Kích hoạt bảo vệ 2 lớp giúp bảo vệ tài khoản của bạn bằng
                      cách yêu cầu mã xác thực OTP gửi về điện thoại mỗi khi
                      đăng nhập.
                    </CardDescription>
                  </CardHeader>
                </Card>

                {/* Active Sessions */}
                <Card className="border border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-bold">
                      Lịch sử đăng nhập & Thiết bị hoạt động
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Theo dõi và quản lý các thiết bị hiện đang đăng nhập vào
                      cửa hàng này.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    {activeSessions.map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between py-2.5 border-b last:border-0 last:pb-0 text-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-muted rounded-lg text-muted-foreground">
                            {session.device.includes("iPhone") ? (
                              <Smartphone className="h-4.5 w-4.5" />
                            ) : (
                              <Computer className="h-4.5 w-4.5" />
                            )}
                          </div>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-xs">
                                {session.device}
                              </span>
                              {session.current && (
                                <Badge
                                  className="text-[9px] px-1 py-0 bg-green-500/10 text-green-500 border-green-500/20"
                                  variant="outline"
                                >
                                  Thiết bị này
                                </Badge>
                              )}
                            </div>
                            <p className="text-2xs text-muted-foreground">
                              {session.ip} · {session.location}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-2xs text-muted-foreground">
                            {session.lastActive}
                          </span>
                          {!session.current && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleLogoutSession(session.id)}
                              className="text-2xs text-destructive hover:text-destructive/80 hover:bg-destructive/5 cursor-pointer h-7 px-2"
                            >
                              Đăng xuất
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Tab 4: Theme Settings (Relocated Theme Customizer logic) */}
            {activeTab === "theme" && (
              <div className="border rounded-xl bg-card overflow-hidden">
                <ThemeTab
                  selectedTheme={selectedTheme}
                  setSelectedTheme={setSelectedTheme}
                  selectedRadius={selectedRadius}
                  setSelectedRadius={setSelectedRadius}
                />
              </div>
            )}

            {/* Tab 5: Layout Settings (Relocated Layout Customizer logic) */}
            {activeTab === "layout" && (
              <div className="border rounded-xl bg-card overflow-hidden">
                <LayoutTab />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
