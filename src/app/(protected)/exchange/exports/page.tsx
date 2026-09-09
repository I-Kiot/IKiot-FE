'use client'

import { TransfersProvider } from './components/transfers-provider'
import { TransfersButtonGroup } from './components/transfers-button-group'
import { TransfersTable } from './components/transfers-table'
import { TransfersDialogs } from './components/transfers-dialogs'
import { useTransfers } from './components/transfers-provider'

import { PageHeader } from "@/components/page-header"

function ExportsPageContent() {
  const { labels } = useTransfers()

  return (
    <>
      <div className="flex flex-col gap-6 px-4 lg:px-6">
        <PageHeader
          breadcrumbs={[
            { label: "Trang chủ", href: "/dashboard" },
            { label: "Giao dịch" },
            { label: "Chuyển kho" },
          ]}
          title={labels.moduleTitle}
          actions={<TransfersButtonGroup />}
        />
        <TransfersTable />
      </div>
      <TransfersDialogs />
    </>
  )
}

export default function ExportsPage() {
  return (
    <TransfersProvider>
      <ExportsPageContent />
    </TransfersProvider>
  )
}
