"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Play, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DotPattern } from "@/components/dot-pattern";

export function HeroSection() {
  return (
    <section
      id="hero"
      className="relative overflow-hidden bg-gradient-to-b from-background to-background/80 pt-16 sm:pt-20 pb-16"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0">
        {/* Dot pattern overlay using reusable component */}
        <DotPattern className="opacity-100" size="md" fadeStyle="ellipse" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="mx-auto max-w-4xl text-center">
          {/* Announcement Badge */}
          <div className="mb-8 flex justify-center">
            <Badge variant="outline" className="px-4 py-2 border-foreground">
              <Star className="w-3 h-3 mr-2 fill-current" />
              iKiot - Giải pháp Quản lý Chuỗi Cửa hàng Điện tử thế hệ mới
              <ArrowRight className="w-3 h-3 ml-2" />
            </Badge>
          </div>

          {/* Main Headline */}
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            Thiết lập chuỗi cửa hàng
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {" "}
              Điện tử & Công nghệ{" "}
            </span>
            nhanh gọn, chi phí tối ưu
          </h1>

          {/* Subheading */}
          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Đồng bộ hóa bán hàng POS, quản lý tồn kho real-time giữa các chi
            nhánh. Tích hợp AI phân tích sản phẩm trend, báo cáo lãi lỗ và đưa
            ra lời khuyên nhập hàng thông minh.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" className="text-base cursor-pointer" asChild>
              <Link href="/sign-up">
                Bắt đầu dùng thử
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="text-base cursor-pointer"
              asChild
            >
              <a href="#features">
                <Play className="mr-2 h-4 w-4" />
                Khám phá tính năng
              </a>
            </Button>
          </div>
        </div>

        {/* Hero Image/Visual */}
        <div className="mx-auto mt-20 max-w-6xl">
          <div className="relative group">
            {/* Top background glow effect - positioned above the image */}
            <div className="absolute top-2 lg:-top-8 left-1/2 transform -translate-x-1/2 w-[90%] mx-auto h-24 lg:h-80 bg-primary/50 rounded-full blur-3xl"></div>

            <div className="relative rounded-xl border bg-card shadow-2xl overflow-hidden">
              {/* Light mode dashboard video */}
              <video
                src="/ikiot-tvc.mp4"
                className="w-full rounded-xl object-cover block aspect-video"
                autoPlay
                muted
                loop
                playsInline
              />

              {/* Bottom fade effect - gradient overlay that fades the image to background (only in dark mode) */}
              <div className="absolute bottom-0 left-0 w-full h-32 md:h-40 lg:h-48 bg-gradient-to-b from-background/0 via-background/70 to-background rounded-b-xl hidden dark:block"></div>

              {/* Overlay play button for demo (only in dark mode) */}
              <div className="absolute inset-0 items-center justify-center hidden dark:flex">
                <Button
                  size="lg"
                  className="rounded-full h-16 w-16 p-0 cursor-pointer hover:scale-105 transition-transform"
                  asChild
                >
                  <a href="#" aria-label="Watch demo video">
                    <Play className="h-6 w-6 fill-current" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
