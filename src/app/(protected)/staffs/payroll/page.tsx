'use client'

import { getCachedUser } from '@/lib/auth'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Banknote, Calendar, Plus, Settings2 } from 'lucide-react'
import { usePayroll } from './_context/payroll-provider'
import { PeriodsTable } from './_components/table/periods-table'
import { PaysheetsTable } from './_components/table/paysheets-table'
import { PayslipsTable } from './_components/table/payslips-table'
import { PayrollSummaryCards } from './_components/payroll-summary-cards'
import { PaysheetDetail } from './_components/paysheet-detail'

export default function PayrollPage() {
  const userRole = getCachedUser()?.role
  const canView = userRole === 'TENANT_OWNER'

  const {
    activeTab,
    setActiveTab,
    activePeriodId,
    activePaysheetId,
    setActivePaysheetId,
    setOpen,
    settings,
  } = usePayroll()

  if (!canView) {
    return (
      <div className="flex flex-col gap-6 px-4 lg:px-6">
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-16 text-center bg-white dark:bg-slate-900/10">
          <h2 className="text-lg font-semibold">Không có quyền truy cập</h2>
          <p className="text-muted-foreground mt-2 max-w-md text-sm">
            Tài khoản của bạn không có quyền xem module tính lương. Vui lòng liên hệ quản trị viên.
          </p>
        </div>
      </div>
    )
  }

  // Header actions based on active tab and view state
  const renderActions = () => {
    if (activePeriodId || activePaysheetId) return null // Hide normal actions when inside drill-down view

    if (activeTab === 'periods') {
      return (
        <Button
          onClick={() => setOpen('addPeriod')}
          className="cursor-pointer"
        >
          <Plus className="mr-2 size-4" />
          Tạo kỳ lương mới
        </Button>
      )
    }

    if (activeTab === 'paysheets') {
      return (
        <Button
          onClick={() => setActivePaysheetId('new')}
          className="cursor-pointer"
        >
          <Plus className="mr-2 size-4" />
          Thiết lập lương cơ bản
        </Button>
      )
    }

    if (activeTab === 'settings') {
      return (
        <Button
          onClick={() => setOpen('editSettings')}
          className="cursor-pointer"
        >
          <Settings2 className="mr-2 size-4" />
          Chỉnh sửa cấu hình
        </Button>
      )
    }

    return null
  }

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Trang chủ', href: '/dashboard' },
          { label: 'Nhân viên', href: '/staffs' },
          { label: 'Bảng lương' },
        ]}
        title="Tính lương & Chi trả"
        description="Quản lý cấu hình kỳ lương, mức thu nhập cơ bản, tính toán ngày công và chi trả lương."
        actions={renderActions()}
      />

      {/* Stats Summary Cards (only show on master view) */}
      {!activePeriodId && !activePaysheetId && <PayrollSummaryCards />}

      {/* Main Container */}
      <div className="bg-slate-50/40 dark:bg-slate-900/5 rounded-xl border p-4 sm:p-6 space-y-6">
        {activePeriodId ? (
          /* Detailed Drill-down View */
          <div className="animate-in fade-in slide-in-from-right-8 duration-300 ease-out-sine">
            <PayslipsTable />
          </div>
        ) : activePaysheetId ? (
          /* Detailed Paysheet sub-view */
          <div className="animate-in fade-in slide-in-from-right-8 duration-300 ease-out-sine">
            <PaysheetDetail />
          </div>
        ) : (
          /* Tabbed Master View */
          <div className="animate-in fade-in slide-in-from-left-8 duration-300 ease-out-sine">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="bg-slate-200/60 dark:bg-slate-800/60 p-1.5 border border-slate-200/80 dark:border-slate-700/60 rounded-full max-w-lg grid grid-cols-3 h-11 gap-1">
              <TabsTrigger
                value="periods"
                className="cursor-pointer rounded-full gap-2 transition-all duration-200 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm text-slate-600 dark:text-slate-400 data-[state=active]:text-slate-900 dark:data-[state=active]:text-slate-100 font-medium data-[state=active]:font-semibold"
              >
                <Calendar className="size-4" />
                <span>Kỳ lương</span>
              </TabsTrigger>
              <TabsTrigger
                value="paysheets"
                className="cursor-pointer rounded-full gap-2 transition-all duration-200 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm text-slate-600 dark:text-slate-400 data-[state=active]:text-slate-900 dark:data-[state=active]:text-slate-100 font-medium data-[state=active]:font-semibold"
              >
                <Banknote className="size-4" />
                <span>Lương cơ bản</span>
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="cursor-pointer rounded-full gap-2 transition-all duration-200 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm text-slate-600 dark:text-slate-400 data-[state=active]:text-slate-900 dark:data-[state=active]:text-slate-100 font-medium data-[state=active]:font-semibold"
              >
                <Settings2 className="size-4" />
                <span>Cấu hình</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="periods" className="space-y-4 outline-none">
              <PeriodsTable />
            </TabsContent>

            <TabsContent value="paysheets" className="space-y-4 outline-none">
              <PaysheetsTable />
            </TabsContent>

            <TabsContent value="settings" className="space-y-4 outline-none">
              {/* Embed settings profile summary for premium design */}
              <div className="rounded-lg border p-6 bg-white dark:bg-slate-900/10 max-w-2xl space-y-6">
                <div className="flex items-center gap-3">
                  <Settings2 className="size-6 text-primary" />
                  <div>
                    <h3 className="font-semibold text-lg">Thông số cấu hình hiện hành</h3>
                    <p className="text-xs text-muted-foreground">
                      Thông số này được áp dụng tự động cho mỗi lần chạy kỳ lương mới.
                    </p>
                  </div>
                </div>

                {settings ? (
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm border-t pt-4">
                    <div>
                      <span className="text-muted-foreground">Chu kỳ lương:</span>
                      <span className="font-bold ml-2 text-slate-800 dark:text-slate-200">
                        {settings.cycle === 'MONTHLY' ? 'Hàng tháng (Monthly)' : 'Hàng tuần (Weekly)'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Khoảng tính lương:</span>
                      <span className="font-bold ml-2 text-slate-800 dark:text-slate-200">
                        Ngày 1 đến ngày cuối tháng
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Ngày công chuẩn:</span>
                      <span className="font-bold ml-2 text-slate-800 dark:text-slate-200">
                        {settings.standardWorkingDays} ngày
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Số giờ công/ca chuẩn:</span>
                      <span className="font-bold ml-2 text-slate-800 dark:text-slate-200">
                        {settings.standardWorkingHoursPerDay} giờ
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Đi muộn cho phép:</span>
                      <span className="font-bold ml-2 text-slate-800 dark:text-slate-200">
                        {settings.lateGraceMinutes} phút
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Tự động tạo kỳ lương:</span>
                      <span className="font-bold ml-2 text-slate-800 dark:text-slate-200">
                        {settings.autoGenerate ? 'Bật' : 'Tắt'}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Ngày nghỉ cuối tuần:</span>
                      <span className="font-bold ml-2 text-slate-800 dark:text-slate-200">
                        {(settings.weekendDays || []).length > 0
                          ? settings.weekendDays.map((d: number) => d === 0 ? 'Chủ nhật' : `Thứ ${d + 1}`).join(', ')
                          : 'Không có'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="border-t pt-6 text-center py-8">
                    <p className="text-sm text-muted-foreground">
                      Chưa cấu hình thông số tính lương cho tenant. Vui lòng thiết lập cấu hình mới.
                    </p>
                  </div>
                )}

                <div className="border-t pt-4 flex justify-end">
                  <Button onClick={() => setOpen('editSettings')} className="cursor-pointer size-sm">
                    {settings ? 'Thay đổi thông số' : 'Thiết lập cấu hình'}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          </div>
        )}
      </div>
    </div>
  )
}
