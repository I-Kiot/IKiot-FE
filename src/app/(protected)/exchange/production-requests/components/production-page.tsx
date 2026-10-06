"use client";

import { AlertTriangle, Factory } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { ProductionProvider, useProduction } from "./production-provider";
import { ProductionRequestsTable } from "./production-requests-table";
import { ProductionDialogs } from "./production-dialogs";

/** Hành trình GĐ1 – Bước 4: the production requests are the main table; creating one picks products from every SKU at the receiving location, with what needs ordering first. */
export function ProductionPage({
  initialLocationId,
  openCreateShort,
}: {
  initialLocationId?: string;
  openCreateShort?: boolean;
}) {
  return (
    <ProductionProvider
      initialLocationId={initialLocationId}
      openCreateShort={openCreateShort}
    >
      <div className="flex flex-col gap-6 px-4 lg:px-6">
        <PageHeader
          breadcrumbs={[
            { label: "Trang chủ", href: "/dashboard" },
            { label: "Giao dịch" },
            { label: "Yêu cầu sản xuất" },
          ]}
          title="Yêu cầu sản xuất"
          actions={<HeaderActions />}
        />
        <ProductionRequestsTable />
      </div>
      <ProductionDialogs />
    </ProductionProvider>
  );
}

function HeaderActions() {
  const { can, shortRows, setDialog } = useProduction();
  if (!can.create) return null;
  return (
    <div className="flex items-center gap-2">
      {shortRows > 0 ? (
        // What needs ordering first: opens the picker already filtered to it.
        <Button
          variant="outline"
          size="sm"
          className="cursor-pointer border-destructive/40 text-destructive hover:text-destructive"
          onClick={() => setDialog({ kind: "create", onlyShort: true })}
        >
          <AlertTriangle /> {shortRows} mặt hàng cần sản xuất
        </Button>
      ) : null}
      <Button
        size="sm"
        className="cursor-pointer"
        onClick={() => setDialog({ kind: "create" })}
      >
        <Factory /> Tạo yêu cầu sản xuất
      </Button>
    </div>
  );
}
