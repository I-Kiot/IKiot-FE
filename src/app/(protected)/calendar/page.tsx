import { PageHeader } from "@/components/page-header"
import { Calendar } from "./components/calendar"
import { events, eventDates } from "./data"

export default function CalendarPage() {
  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Trang chủ', href: '/dashboard' },
          { label: 'Quản lý' },
          { label: 'Lịch' },
        ]}
        title="Lịch"
        description="Xem và quản lý lịch làm việc, sự kiện của nhóm"
      />
      <Calendar events={events} eventDates={eventDates} />
    </div>
  )
}
