'use client'

import * as React from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

export interface BreadcrumbEntry {
  label: string
  href?: string
}

interface PageHeaderProps {
  breadcrumbs: BreadcrumbEntry[]
  title?: string
  titleExtra?: React.ReactNode
  description?: string
  onBack?: () => void
  actions?: React.ReactNode
}

export function PageHeader({
  breadcrumbs,
  title,
  titleExtra,
  description,
  onBack,
  actions,
}: PageHeaderProps) {
  // Hàng breadcrumb luôn cao đúng 20px; nút hành động nằm ở hàng tiêu đề.
  // Trước đây nút (36px) nằm cạnh breadcrumb làm hàng cao lên, nên trang có
  // nút bị đẩy tiêu đề xuống thấp hơn trang không có nút khi chuyển trang.
  return (
    <div className="flex flex-col gap-3">
      <div className="flex h-5 items-center gap-2">
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            className="-my-1 size-7 cursor-pointer shrink-0"
            onClick={onBack}
          >
            <ArrowLeft className="size-4" />
            <span className="sr-only">Quay lại</span>
          </Button>
        )}
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((item, index) => {
              const isLast = index === breadcrumbs.length - 1
              return (
                <React.Fragment key={index}>
                  {index > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem>
                    {isLast || !item.href ? (
                      <BreadcrumbPage>{item.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link href={item.href}>{item.label}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </React.Fragment>
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      {(title || description || actions) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0">
            {title && (
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                {titleExtra}
              </div>
            )}
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          {actions && (
            <div className="flex flex-wrap items-center gap-2 sm:shrink-0">{actions}</div>
          )}
        </div>
      )}
    </div>
  )
}
