'use client'

import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

/** Thay cho dropdown rỗng: báo thiếu dữ liệu gì và chỉ chỗ tạo. */
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
