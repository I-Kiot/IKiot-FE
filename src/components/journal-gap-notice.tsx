import { Info } from 'lucide-react'
import { formatNumber } from '@/lib/stats-format'

/**
 * Nhắc khi có đơn hoàn tất mà sổ doanh thu không có (đơn cũ, trước khi có sổ): các số doanh thu chỉ tính từ sổ nên chưa gồm các đơn này.
 * Không hiện gì khi không thiếu đơn nào.
 */
export function JournalGapNotice({
  ordersWithoutJournal,
  firstJournalAt,
  className = '',
}: {
  ordersWithoutJournal: number | null | undefined
  firstJournalAt?: string | null
  className?: string
}) {
  if (!ordersWithoutJournal || ordersWithoutJournal <= 0) return null
  const since = firstJournalAt
    ? new Date(firstJournalAt).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
    : null
  return (
    <p
      role="status"
      className={`flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-200 ${className}`}
    >
      <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
      <span>
        {formatNumber(ordersWithoutJournal)} đơn cũ chưa có trong sổ doanh thu nên chưa được tính vào doanh thu và lợi nhuận
        {since ? ` (sổ bắt đầu ghi từ ${since})` : ''}.
      </span>
    </p>
  )
}
