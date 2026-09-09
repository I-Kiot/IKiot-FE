"use client";

import * as React from "react";
import {
  Landmark,
  Store,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Link2,
  KeyRound,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { listTenants, setSepayKey, type Tenant } from "@/lib/api/tenant";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function ownerLabel(tenant: Tenant): string {
  const owner = tenant.tenantOwnerId;
  const name = [owner?.profile?.lastName, owner?.profile?.firstName]
    .filter(Boolean)
    .join(" ")
    .trim();
  return name || owner?.email || owner?.phoneNumber || "-";
}

function hasBankInfo(tenant: Tenant): boolean {
  return Boolean(
    tenant.banking?.bankName ||
      tenant.banking?.accountNumber ||
      tenant.banking?.accountName,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Stat card
// ─────────────────────────────────────────────────────────────────────────────
function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <Card className="shadow-xs">
      <CardContent className="flex items-center gap-3 p-4">
        <div className={cn("rounded-lg p-2.5", accent)}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold leading-none">{value}</p>
          <p className="text-xs text-muted-foreground mt-1">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────
export default function AdminSepayPage() {
  const [tenants, setTenants] = React.useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");

  // Link dialog state
  const [dialogTenant, setDialogTenant] = React.useState<Tenant | null>(null);
  const [keyInput, setKeyInput] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);

  const loadData = React.useCallback(async (isInitial = false) => {
    if (isInitial) setIsLoading(true);
    try {
      const data = await listTenants();
      setTenants(data);
    } catch (err: any) {
      console.error(err);
      toast.error(
        err.response?.data?.message || "Không thể tải danh sách cửa hàng!",
      );
    } finally {
      if (isInitial) setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData(true);
  }, [loadData]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tenants;
    return tenants.filter(
      (t) =>
        t.name?.toLowerCase().includes(q) ||
        ownerLabel(t).toLowerCase().includes(q) ||
        t.banking?.accountNumber?.toLowerCase().includes(q),
    );
  }, [tenants, search]);

  const stats = React.useMemo(
    () => ({
      total: tenants.length,
      withBank: tenants.filter(hasBankInfo).length,
      linked: tenants.filter((t) => t.hasSepayKey).length,
    }),
    [tenants],
  );

  const openDialog = (tenant: Tenant) => {
    setDialogTenant(tenant);
    setKeyInput("");
  };

  const handleSave = async () => {
    if (!dialogTenant) return;
    const key = keyInput.trim();
    if (!key) {
      toast.error("Vui lòng nhập SePay webhook API key!");
      return;
    }
    setIsSaving(true);
    try {
      await setSepayKey(dialogTenant.id, key);
      toast.success(
        `Đã liên kết SePay cho cửa hàng "${dialogTenant.name}" thành công!`,
      );
      // Optimistically mark as linked, then refetch for source of truth.
      setTenants((prev) =>
        prev.map((t) =>
          t.id === dialogTenant.id ? { ...t, hasSepayKey: true } : t,
        ),
      );
      setDialogTenant(null);
      loadData(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Lỗi khi lưu SePay key!");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <PageHeader
        breadcrumbs={[
          { label: "Trang chủ", href: "/admin/dashboard" },
          { label: "Liên kết SePay" },
        ]}
        title="Liên kết SePay"
        description="Theo dõi thông tin ngân hàng của từng cửa hàng và trạng thái liên kết cổng thanh toán SePay. Cập nhật thủ công webhook key sau khi liên kết tài khoản trong dashboard SePay."
      />

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={Store}
          label="Tổng cửa hàng"
          value={stats.total}
          accent="bg-primary/10 text-primary"
        />
        <StatCard
          icon={Landmark}
          label="Đã cấu hình ngân hàng"
          value={stats.withBank}
          accent="bg-blue-500/10 text-blue-500"
        />
        <StatCard
          icon={CheckCircle2}
          label="Đã liên kết SePay"
          value={stats.linked}
          accent="bg-green-500/10 text-green-500"
        />
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên cửa hàng, chủ, số tài khoản..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => loadData(false)}
          className="cursor-pointer text-xs gap-1.5 shrink-0"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Làm mới
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-xl overflow-hidden bg-background">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead>Cửa hàng</TableHead>
              <TableHead>Thông tin ngân hàng</TableHead>
              <TableHead>Trạng thái SePay</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={4}>
                    <Skeleton className="h-10 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-10 text-sm text-muted-foreground"
                >
                  {search
                    ? "Không tìm thấy cửa hàng phù hợp."
                    : "Chưa có cửa hàng nào."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((tenant) => {
                const bank = hasBankInfo(tenant);
                const linked = Boolean(tenant.hasSepayKey);
                return (
                  <TableRow key={tenant.id} className="align-top">
                    {/* Store */}
                    <TableCell>
                      <div className="font-medium">{tenant.name || "-"}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {ownerLabel(tenant)}
                      </div>
                    </TableCell>

                    {/* Bank info */}
                    <TableCell>
                      {bank ? (
                        <div className="text-xs space-y-0.5">
                          <div className="font-semibold">
                            {tenant.banking?.bankName || "-"}
                          </div>
                          <div className="text-muted-foreground font-mono">
                            {tenant.banking?.accountNumber || "-"}
                          </div>
                          <div className="text-muted-foreground">
                            {tenant.banking?.accountName || "-"}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          Chưa cấu hình
                        </span>
                      )}
                    </TableCell>

                    {/* SePay status */}
                    <TableCell>
                      {linked ? (
                        <Badge
                          variant="outline"
                          className="gap-1 bg-green-500/10 text-green-500 border-green-500/20"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          Đã liên kết
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="gap-1 bg-muted text-muted-foreground border-border"
                        >
                          <XCircle className="h-3 w-3" />
                          Chưa liên kết
                        </Badge>
                      )}
                    </TableCell>

                    {/* Action */}
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant={linked ? "outline" : "default"}
                        className="cursor-pointer text-xs gap-1.5"
                        onClick={() => openDialog(tenant)}
                        disabled={!bank}
                        title={
                          !bank
                            ? "Cửa hàng chưa cấu hình tài khoản ngân hàng"
                            : undefined
                        }
                      >
                        <Link2 className="h-3.5 w-3.5" />
                        {linked ? "Cập nhật key" : "Liên kết SePay"}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Link dialog */}
      <Dialog
        open={Boolean(dialogTenant)}
        onOpenChange={(open) => {
          if (!open) setDialogTenant(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-4.5 w-4.5 text-primary" />
              {dialogTenant?.hasSepayKey
                ? "Cập nhật SePay webhook key"
                : "Liên kết SePay"}
            </DialogTitle>
            <DialogDescription>
              Nhập <span className="font-medium">webhook API key</span> nhận được
              từ dashboard SePay sau khi liên kết tài khoản ngân hàng của cửa
              hàng{" "}
              <span className="font-semibold text-foreground">
                {dialogTenant?.name}
              </span>
              . Key sẽ được dùng để xác thực webhook thanh toán đơn hàng.
            </DialogDescription>
          </DialogHeader>

          {dialogTenant && hasBankInfo(dialogTenant) && (
            <div className="rounded-lg border bg-muted/40 p-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ngân hàng:</span>
                <span className="font-semibold">
                  {dialogTenant.banking?.bankName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Số tài khoản:</span>
                <span className="font-semibold font-mono">
                  {dialogTenant.banking?.accountNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Chủ tài khoản:</span>
                <span className="font-semibold">
                  {dialogTenant.banking?.accountName}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="sepay-key">SePay webhook API key</Label>
            <Input
              id="sepay-key"
              placeholder="Dán API key từ SePay..."
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              autoComplete="off"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
              }}
            />
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDialogTenant(null)}
              disabled={isSaving}
              className="cursor-pointer"
            >
              Hủy
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="cursor-pointer"
            >
              {isSaving ? "Đang lưu..." : "Lưu liên kết"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
