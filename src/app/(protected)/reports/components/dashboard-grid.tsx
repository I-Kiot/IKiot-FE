// [Báo cáo tổng hợp – mỗi tab là một bảng số liệu của kỳ và địa điểm đang chọn]
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
  SalesByTimeReport,
  SalesResultReport,
} from './sales-reports'
import { CashflowReport, InventoryReport, PaymentMethodReport } from './finance-reports'

/** Trang báo cáo: mỗi tab một bảng có dòng cộng. */
export function DashboardGrid() {
  const { overview, activeTab, setActiveTab, location } = useDashboard()

  const tabs: { value: string; label: string; content: React.ReactNode }[] = [
    { value: 'result', label: 'Kết quả bán hàng', content: <SalesResultReport /> },
    { value: 'time', label: 'Theo thời gian', content: <SalesByTimeReport /> },
    { value: 'product', label: 'Theo hàng hóa', content: <SalesByProductReport /> },
    // So sánh các điểm bán chỉ có nghĩa khi xem toàn cửa hàng; chọn một nơi thì mọi tab đã là của nơi đó.
    ...(location.isAll ? [{ value: 'branch', label: 'Theo điểm bán', content: <SalesByBranchReport /> }] : []),
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

  // Tab đang mở bị ẩn (vd. đang ở "Theo điểm bán" rồi chọn một chi nhánh): về tab đầu.
  const currentTab = tabs.some((tab) => tab.value === activeTab) ? activeTab : tabs[0].value

  return (
    <div className="@container/main space-y-6">
      <DashboardToolbar />

      <JournalGapNotice
        ordersWithoutJournal={overview?.journalGap?.ordersWithoutJournal}
        firstJournalAt={overview?.journalGap?.firstJournalAt}
      />

      <Tabs value={currentTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="h-auto flex-wrap justify-start">
          {tabs.map((tab) => (
            // Giữ cùng độ đậm chữ cho tab.
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
