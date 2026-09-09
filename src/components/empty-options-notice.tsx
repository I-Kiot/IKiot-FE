'use client'

import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

/**
 * Chỗ đứng thay cho một dropdown rỗng.
 *
 * Một select bắt buộc mà không có lựa chọn nào là ngõ cụt: form không gửi được và không
 * nói vì sao. Mẫu này (lấy từ ô "Vai trò" trong dialog thêm nhân viên) nói rõ đang thiếu
 * dữ liệu gì và chỉ đúng chỗ tạo nó.
 *
 * Dùng `EmptyOptionsLink` cho lối đi sang trang khác; nếu chỗ tạo là một dialog ngay trong
 * màn hình hiện tại thì truyền `<button>` vào `children` (xem dialog xếp lịch làm).
 */
export function EmptyOptionsNotice({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <p
      className={cn(
        'text-muted-foreground rounded-md border border-dashed px-3 py-2 text-sm',
        className,
      )}
    >
      {children}
    </p>
  )
}

export function EmptyOptionsLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="text-foreground font-medium underline underline-offset-4"
    >
      {children}
    </Link>
  )
}
