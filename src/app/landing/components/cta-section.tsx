"use client";

import Link from "next/link";
import { ArrowRight, TrendingUp, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export function CTASection() {
  return (
    <section className="py-16 lg:py-24 bg-muted/80">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <div className="space-y-8">
              {/* Badge and Stats */}
              <div className="flex flex-col items-center gap-4">
                <Badge variant="outline" className="flex items-center gap-2">
                  <TrendingUp className="size-3" />
                  Nền tảng Quản trị thông minh
                </Badge>

                <div className="text-muted-foreground flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <div className="size-2 rounded-full bg-green-500" />
                    Dùng thử 14 ngày
                  </span>
                  <Separator orientation="vertical" className="!h-4" />
                  <span>10M+ Giao dịch/tháng</span>
                  <Separator orientation="vertical" className="!h-4" />
                  <span>4.9★ Đánh giá tốt</span>
                </div>
              </div>

              {/* Main Content */}
              <div className="space-y-6">
                <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
                  Bứt phá doanh thu chuỗi
                  <span className="flex sm:inline-flex justify-center">
                    <span className="relative mx-2">
                      <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                        cửa hàng điện tử
                      </span>
                      <div className="absolute start-0 -bottom-2 h-1 w-full bg-gradient-to-r from-primary/30 to-secondary/30" />
                    </span>
                    ngay hôm nay
                  </span>
                </h1>

                <p className="text-muted-foreground mx-auto max-w-2xl text-balance lg:text-xl">
                  Không còn đau đầu vì chênh lệch tồn kho hay thiếu nguồn hàng
                  xu hướng. Hãy để iKiot cùng công nghệ AI hỗ trợ quản trị và
                  đồng hành cùng chuỗi cửa hàng của bạn.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col justify-center gap-4 sm:flex-row sm:gap-6">
                <Button
                  size="lg"
                  className="cursor-pointer px-8 py-6 text-lg font-medium"
                  asChild
                >
                  <Link href="/sign-up">
                    <Package className="me-2 size-5" />
                    Bắt đầu dùng thử miễn phí
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="cursor-pointer px-8 py-6 text-lg font-medium group"
                  asChild
                >
                  <a href="#contact">
                    Liên hệ tư vấn chuỗi
                    <ArrowRight className="ms-2 size-4 transition-transform group-hover:translate-x-1" />
                  </a>
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="text-muted-foreground flex flex-wrap items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-green-600 dark:bg-green-400 me-1" />

                  <span>Khởi tạo nhanh dưới 5 phút</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-blue-600 dark:bg-blue-400 me-1" />

                  <span>Chi phí tối ưu cực kỳ dễ chịu</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-purple-600 dark:bg-purple-400 me-1" />

                  <span>Đồng hành & hỗ trợ chuỗi 24/7</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
