import { type CalendarEvent, type Calendar } from "./types"

import eventsData from "./data/events.json"
import eventDatesData from "./data/event-dates.json"
import calendarsData from "./data/calendars.json"

// Dữ liệu mẫu: luôn dùng tháng/năm hiện tại, giữ ngày và giờ từ JSON.
export const events: CalendarEvent[] = eventsData.map(event => {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() // tháng tính từ 0

  // Định dạng ngày: "11T09:00:00.000Z"
  const dayAndTime = event.date.split('T')
  const day = parseInt(dayAndTime[0])
  const timeStr = dayAndTime[1]

  const timeParts = timeStr.split(':')
  const hours = parseInt(timeParts[0])
  const minutes = parseInt(timeParts[1])

  const eventDate = new Date(currentYear, currentMonth, day, hours, minutes)

  return {
    ...event,
    date: eventDate,
    type: event.type as "meeting" | "event" | "personal" | "task" | "reminder"
  }
})

// Ngày có sự kiện cho date picker, cũng dùng tháng/năm hiện tại.
export const eventDates = eventDatesData.map(item => {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()

  const day = parseInt(item.date.split('T')[0])
  const eventDate = new Date(currentYear, currentMonth, day)

  return {
    date: eventDate,
    count: item.count
  }
})

export const calendars: Calendar[] = calendarsData as Calendar[]

export { eventsData, eventDatesData, calendarsData }
