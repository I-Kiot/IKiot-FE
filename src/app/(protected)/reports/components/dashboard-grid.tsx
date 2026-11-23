// [Báo cáo chi tiết – mỗi tab là một bảng số liệu của kỳ và địa điểm đang chọn]
'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { JournalGapNotice } from '@/components/journal-gap-notice'
import { useDashboard } from './dashboard-provider'
import { DashboardToolbar } from './dashboard-toolbar'
import {
  OrdersByStatusReport,
  SalesByBranchReport,
  SalesByCustomerReport,
  SalesByProductReport,
  SalesByStaffReport,
  SalesByTimeReport,
  SalesResultReport,
} from './sales-reports'
import { CashflowReport, InventoryReport, PaymentMethodReport } from './finance-reports'

/**
 * Trang báo cáo là số liệu để đọc và đối chiếu: mỗi tab một bảng có dòng cộng, khớp với một sheet của file xuất Excel.
 * Biểu đồ (so sánh mốc thời gian, khung giờ bán chạy, tăng trưởng) nằm ở trang Thống kê (/statistics).
 */
export function DashboardGrid() {
  const { revenueByBranch, overview, activeTab, setActiveTab } = useDashboard()
  const showBranches = (revenueByBranch?.branches.length ?? 0) > 1

  const tabs: { value: string; label: string; content: React.ReactNode }[] = [
    { value: 'result', label: 'Kết quả bán hàng', content: <SalesResultReport /> },
    { value: 'time', label: 'Theo thời gian', content: <SalesByTimeReport /> },
    { value: 'product', label: 'Theo hàng hóa', content: <SalesByProductReport /> },
    ...(showBranches ? [{ value: 'branch', label: 'Theo chi nhánh', content: <SalesByBranchReport /> }] : []),
    { value: 'staff', label: 'Theo nhân viên', content: <SalesByStaffReport /> },
    { value: 'customer', label: 'Theo khách hàng', content: <SalesByCustomerReport /> },
    { value: 'orders', label: 'Đơn hàng', content: <OrdersByStatusReport /> },
    {
      value: 'cash',
      label: 'Thu chi',
      content: (
        <div className="space-y-6">
          <PaymentMethodReport />
          <CashflowReport />
        </div>
      ),
    },
    { value: 'inventory', label: 'Tồn kho', content: <InventoryReport /> },
  ]

  return (
    <div className="@container/main space-y-6">
      <DashboardToolbar />

      <JournalGapNotice
        ordersWithoutJournal={overview?.journalGap?.ordersWithoutJournal}
        firstJournalAt={overview?.journalGap?.firstJournalAt}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="h-auto flex-wrap justify-start">
          {tabs.map((tab) => (
            // Giữ một độ đậm cho cả tab đang chọn: mặc định tab chọn đậm hơn nên rộng ra, làm chữ của cả hàng tab nhảy mỗi lần đổi tab.
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="cursor-pointer data-[state=active]:font-medium"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            {tab.content}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
