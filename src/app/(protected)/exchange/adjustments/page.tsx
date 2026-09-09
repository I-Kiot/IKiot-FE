import { AdjustmentsProvider } from "./components/adjustments-provider";
import { AdjustmentsTable } from "./components/adjustments-table";
import { AdjustmentsButtonGroup } from "./components/adjustments-button-group";
import { AdjustmentsDialogs } from "./components/adjustments-dialogs";

import { PageHeader } from "@/components/page-header";

export default function AdjustmentsPage() {
  return (
    <AdjustmentsProvider>
      <div className="flex flex-col gap-6 px-4 lg:px-6">
        <PageHeader
          breadcrumbs={[
            { label: "Trang chủ", href: "/dashboard" },
            { label: "Giao dịch" },
            { label: "Điều chỉnh tồn kho" },
          ]}
          title="Điều chỉnh tồn kho"
          actions={<AdjustmentsButtonGroup />}
        />
        <AdjustmentsTable />
      </div>
      <AdjustmentsDialogs />
    </AdjustmentsProvider>
  );
}
