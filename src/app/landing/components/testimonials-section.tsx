"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

type Testimonial = {
  name: string;
  role: string;
  image: string;
  quote: string;
};

const testimonials: Testimonial[] = [
  {
    name: "Nguyễn Văn Hùng",
    role: "Chủ chuỗi Hùng Mobile (4 chi nhánh)",
    image: "https://notion-avatars.netlify.app/api/avatar?preset=male-1",
    quote:
      "Hệ thống iKiot giúp chúng tôi quản lý tồn kho cực kỳ chính xác. Từ khi dùng iKiot, việc chuyển kho giữa các chi nhánh không còn bị thất thoát, POS bán hàng tại quầy rất nhanh.",
  },
  {
    name: "Trần Thị Mai",
    role: "Sáng lập chuỗi Phụ Kiện Điện Thoại Mai Store (3 chi nhánh)",
    image: "https://notion-avatars.netlify.app/api/avatar?preset=female-1",
    quote:
      "Chi phí cực kỳ dễ chịu so với các phần mềm quản lý ERP lớn khác, nhưng tính năng đầy đủ và cực kỳ dễ thiết lập chi nhánh mới.",
  },
  {
    name: "Lê Hoàng Nam",
    role: "Quản lý vận hành Chuỗi Camera Giám Sát Nam Việt",
    image: "https://notion-avatars.netlify.app/api/avatar?preset=male-2",
    quote:
      "Tính năng AI gợi ý nhập hàng cực kỳ hữu ích. Nó phân tích chính xác sản phẩm nào đang là trend và đưa ra số lượng cần nhập, giúp chúng tôi không bị đọng vốn ở những mặt hàng lỗi thời.",
  },
];

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-24 sm:py-32">
      <div className="container mx-auto px-8 sm:px-6">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          <Badge variant="outline" className="mb-4">
            Đánh giá thực tế
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Khách hàng nói gì về iKiot
          </h2>
          <p className="text-lg text-muted-foreground">
            Hàng ngàn chủ cửa hàng và chuỗi bán lẻ công nghệ đã tối ưu hóa được
            quy trình vận hành và tăng trưởng doanh thu vượt trội.
          </p>
        </div>

        {/* Testimonials Masonry Grid */}
        <div className="columns-1 gap-4 md:columns-2 md:gap-6 lg:columns-3 lg:gap-4">
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className="mb-6 break-inside-avoid shadow-none lg:mb-4"
            >
              <CardContent>
                <div className="flex items-start gap-4">
                  <Avatar className="bg-muted size-12 shrink-0">
                    <AvatarImage
                      alt={testimonial.name}
                      src={testimonial.image}
                      loading="lazy"
                      width="120"
                      height="120"
                    />
                    <AvatarFallback>
                      {testimonial.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <a
                      href="#"
                      onClick={(e) => e.preventDefault()}
                      className="cursor-pointer"
                    >
                      <h3 className="font-medium hover:text-primary transition-colors">
                        {testimonial.name}
                      </h3>
                    </a>
                    <span className="text-muted-foreground block text-sm tracking-wide">
                      {testimonial.role}
                    </span>
                  </div>
                </div>

                <blockquote className="mt-4">
                  <p className="text-sm leading-relaxed text-balance">
                    {testimonial.quote}
                  </p>
                </blockquote>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
