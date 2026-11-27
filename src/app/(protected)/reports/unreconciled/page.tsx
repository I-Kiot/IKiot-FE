// [Trang – Đối soát tiền] Tiền còn nằm ngoài sổ két / ngân hàng tại thời điểm xem.
// Ô tóm tắt kiêm tab: mỗi lúc một danh sách, mục chọn nằm trên URL (`?muc=`) để gửi link được.
'use client'

import { useCallback, useState, Suspense } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { ExportExcelButton } from '@/components/export-excel-button'
import { PageHeader } from '@/components/page-header'
import { JournalGapNotice } from '@/components/journal-gap-notice'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { allows } from '@/components/sidebar/constants/role-permissions'
import { useAuth } from '@/store/hooks/use-auth'
import { ReportLocationSelect } from '@/components/report-location-select'
import { useReportLocation } from '@/hooks/use-report-location'
import { statsApi } from '@/lib/api/stats'
import { formatNumber, formatVND } from '@/lib/stats-format'
import { useAsyncData } from '../../dashboard/hooks/use-async-data'
import { TONE_TEXT } from '../../dashboard/shared/tones'
import { HeldPanel, OverpaidPanel, SepayPanel, ShipperCashPanel } from './_components/action-panels'
import { BalancesPanel } from './_components/balances-panel'
import { formatDateTime } from './_components/shared'
import { SECTIONS, SummaryTabs, actionKinds, type Section } from './_components/summary-tabs'

/** Bọc Suspense vì nơi xem và mục đang mở đọc từ URL (`useSearchParams`). */
export default function UnreconciledPage() {
  return (
    <Suspense fallback={null}>
      <Unreconciled />
    </Suspense>
  )
}

function Unreconciled() {
  const { user } = useAuth()
  const canSeeSepay = allows(user?.role, 'cash_flows', 'read')
  const location = useReportLocation()
  const { place } = location
  const [reloadKey, setReloadKey] = useState(0)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const load = useCallback(() => statsApi.getUnreconciled({ branchId: place }), [place])
  const { data, isLoading, failed } = useAsyncData(load, reloadKey)

  const kinds = data ? actionKinds(data) : []
  const pending = kinds.filter((kind) => kind.count > 0)
  const pendingTotal = pending.reduce((sum, kind) => sum + kind.amount, 0)
  const pendingCount = pending.reduce((sum, kind) => sum + kind.count, 0)

  // Không chọn gì thì mở loại đầu tiên còn khoản treo; hết thì mở số dư tham khảo.
  const fromUrl = searchParams.get('muc')
  const section: Section = (SECTIONS as readonly string[]).includes(fromUrl ?? '')
    ? (fromUrl as Section)
    : (pending[0]?.id ?? 'balances')
  const selectSection = (next: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('muc', next)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="flex-1 space-y-6 px-4 lg:px-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Trang chủ', href: '/dashboard' },
          { label: 'Báo cáo', href: '/reports' },
          { label: 'Đối soát tiền' },
        ]}
        title="Đối soát tiền"
        description={
          data
            ? `Tình trạng lúc ${formatDateTime(data.asOf)}${data.scope === 'BRANCH' ? ' · chỉ chi nhánh đang chọn' : ' · toàn cửa hàng'}`
            : 'Tiền còn nằm ngoài sổ két và ngân hàng, cần người xử lý'
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <ReportLocationSelect location={location} />
            <ExportExcelButton
              load={() => statsApi.exportUnreconciled({ branchId: place })}
              filename={`doi-soat-tien_${new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' })}.xlsx`}
            />
            <Button variant="outline" size="sm" onClick={() => setReloadKey((k) => k + 1)} disabled={isLoading}>
              <RefreshCw className={`size-4 ${isLoading ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>
          </div>
        }
      />

      {!data && isLoading && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-[100px] w-full rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      )}
      {failed && <Card className="p-6 text-sm text-muted-foreground">Không tải được số liệu đối soát. Bấm làm mới để thử lại.</Card>}

      {data && (
        <div className={`space-y-4 transition-opacity ${isLoading ? 'opacity-60' : ''}`}>
          <JournalGapNotice
            ordersWithoutJournal={data.journalCoverage.ordersWithoutJournal}
            firstJournalAt={data.journalCoverage.firstJournalAt}
          />

          <p className="text-sm text-muted-foreground" role="status">
            {pending.length === 0 ? (
              <span className={TONE_TEXT.emerald}>Mọi khoản đều đã khớp, không có gì cần xử lý.</span>
            ) : (
              <>
                Còn <span className="font-semibold text-foreground tabular-nums">{formatNumber(pendingCount)}</span> khoản cần xử lý, tổng{' '}
                <span className="font-semibold text-foreground tabular-nums">{formatVND(pendingTotal)}</span>. Chọn một ô để xem danh sách.
              </>
            )}
          </p>

          <Tabs value={section} onValueChange={selectSection} className="gap-4">
            <SummaryTabs kinds={kinds} />
            <TabsContent value="shipper">
              <ShipperCashPanel data={data} />
            </TabsContent>
            <TabsContent value="sepay">
              <SepayPanel data={data} canHandle={canSeeSepay} />
            </TabsContent>
            <TabsContent value="overpaid">
              <OverpaidPanel data={data} />
            </TabsContent>
            <TabsContent value="held">
              <HeldPanel data={data} />
            </TabsContent>
            <TabsContent value="balances">
              <BalancesPanel data={data} />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
}
