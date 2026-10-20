import Image from 'next/image'
import { cn } from '@/lib/utils'
import { safeImageSrc } from '../_constants/product.constants'

/** Ảnh vuông nhỏ của một phiên bản trong danh sách chọn / thành phần combo. Không có ảnh thì ảnh giữ chỗ. */
export function ItemThumbnail({
  url,
  alt,
  className,
}: {
  url?: string | null
  alt: string
  className?: string
}) {
  return (
    <div className={cn('relative size-10 shrink-0 overflow-hidden rounded-md border bg-muted', className)}>
      <Image fill sizes="40px" src={safeImageSrc(url)} alt={alt} className="object-contain" />
    </div>
  )
}
