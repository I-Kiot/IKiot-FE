import { PageHeader } from "@/components/page-header"
import { Mail } from "./components/mail"
import { accounts, mails } from "./data"

export default function MailPage() {
  return (
    <div className="@container/main flex flex-1 flex-col gap-4 px-4 md:px-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Trang chủ', href: '/dashboard' },
          { label: 'Quản lý' },
          { label: 'Thư' },
        ]}
        title="Thư"
        description="Quản lý hộp thư đến và gửi thư cho khách hàng"
      />
      <div className="h-[calc(100vh-12rem)]">
        <Mail
          accounts={accounts}
          mails={mails}
          defaultLayout={[20, 32, 48]}
          defaultCollapsed={false}
          navCollapsedSize={4}
        />
      </div>
    </div>
  )
}
