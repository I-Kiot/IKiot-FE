"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CardDecorator } from "@/components/ui/card-decorator";
import { Coins, Zap, ShieldCheck, Brain } from "lucide-react";

const values = [
  {
    icon: Coins,
    title: "Chi phí tối ưu",
    description:
      "Mô hình SaaS thông minh giúp tiết kiệm tối đa chi phí vận hành chuỗi cửa hàng mà vẫn đầy đủ tính năng.",
  },
  {
    icon: Zap,
    title: "Thiết lập nhanh gọn",
    description:
      "Dễ dàng mở rộng thêm các chi nhánh mới chỉ với vài bước đơn giản, đồng bộ dữ liệu tức thì.",
  },
  {
    icon: ShieldCheck,
    title: "Độ chính xác cao",
    description:
      "Dữ liệu tồn kho, giá bán và hóa đơn POS được đồng bộ chuẩn xác theo thời gian thực trên toàn chuỗi.",
  },
  {
    icon: Brain,
    title: "Tư vấn thông minh AI",
    description:
      "Hệ thống tự động phân tích hành vi mua sắm, phát hiện lãi lỗ và cảnh báo nhập hàng cho chủ cửa hàng.",
  },
];

export function AboutSection() {
  return (
    <section id="about" className="py-24 sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-4xl text-center mb-16">
          <Badge variant="outline" className="mb-4">
            Về iKiot
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">
            Giải pháp chuyên biệt cho chuỗi cửa hàng điện tử & công nghệ
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            iKiot mang sứ mệnh đồng hành cùng các nhà bán lẻ công nghệ tối ưu
            hóa quy trình quản trị, bán lẻ đa chi nhánh nhanh chóng và hiệu quả
            hơn nhờ sức mạnh của dữ liệu lớn và trí tuệ nhân tạo.
          </p>
        </div>

        {/* Modern Values Grid with Enhanced Design */}
        <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 xl:grid-cols-4 mb-12">
          {values.map((value, index) => (
            <Card key={index} className="group shadow-xs py-2">
              <CardContent className="p-8">
                <div className="flex flex-col items-center text-center">
                  <CardDecorator>
                    <value.icon className="h-6 w-6" aria-hidden />
                  </CardDecorator>
                  <h3 className="mt-6 font-medium text-balance">
                    {value.title}
                  </h3>
                  <p className="text-muted-foreground mt-3 text-sm">
                    {value.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
