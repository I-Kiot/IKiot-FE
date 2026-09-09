"use client"

import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const blogs = [
  {
    id: 1,
    image: 'https://ui.shadcn.com/placeholder.svg',
    category: 'Vận hành bán lẻ',
    title: 'Cách tối ưu tồn kho cho chuỗi cửa hàng điện tử',
    description:
      'Làm thế nào để tránh tình trạng đọng vốn và đứt gãy nguồn cung thiết bị công nghệ giữa các chi nhánh.',
  },
  {
    id: 2,
    image: 'https://ui.shadcn.com/placeholder.svg',
    category: 'Xu hướng công nghệ',
    title: 'Ứng dụng AI dự báo xu hướng mua sắm thiết bị',
    description:
      'Khám phá cách trí tuệ nhân tạo (AI) giúp các nhà bán lẻ điện tử đón đầu các xu hướng hot trend để lập kế hoạch nhập hàng.',
  },
  {
    id: 3,
    image: 'https://ui.shadcn.com/placeholder.svg',
    category: 'Khuyến mãi & Doanh số',
    title: 'Thiết lập chính sách giá bán và khuyến mãi thông minh',
    description:
      'Bí quyết sử dụng công cụ khuyến mãi tự động của iKiot để tăng doanh số bán lẻ mùa cao điểm mà không ảnh hưởng biên lợi nhuận.',
  },
]

export function BlogSection() {
  return (
    <section id="blog" className="py-24 sm:py-32 bg-muted/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          <Badge variant="outline" className="mb-4">Tin tức & Kinh nghiệm</Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Cẩm nang quản lý bán lẻ
          </h2>
          <p className="text-lg text-muted-foreground">
            Cập nhật các xu hướng bán lẻ công nghệ mới nhất, bí quyết vận hành chuỗi cửa hàng và ứng dụng AI tối ưu doanh thu.
          </p>
        </div>

        {/* Blog Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {blogs.map(blog => (
            <Card key={blog.id} className="overflow-hidden py-0">
              <CardContent className="px-0">
                <div className="aspect-video">
                  <Image
                    src={blog.image}
                    alt={blog.title}
                    width={400}
                    height={225}
                    className="size-full object-cover dark:invert dark:brightness-[0.95]"
                    loading="lazy"
                  />
                </div>
                <div className="space-y-3 p-6">
                  <p className="text-muted-foreground text-xs tracking-widest uppercase">
                    {blog.category}
                  </p>
                  <a
                    href="#"
                    onClick={e => e.preventDefault()}
                    className="cursor-pointer"
                  >
                    <h3 className="text-xl font-bold hover:text-primary transition-colors">{blog.title}</h3>
                  </a>
                  <p className="text-muted-foreground">{blog.description}</p>
                  <a
                    href="#"
                    onClick={e => e.preventDefault()}
                    className="inline-flex items-center gap-2 text-primary hover:underline cursor-pointer"
                  >
                    Đọc thêm
                    <ArrowRight className="size-4" />
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
