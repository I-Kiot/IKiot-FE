"use client";

import {
  BarChart3,
  Zap,
  Users,
  ArrowRight,
  Database,
  Package,
  Layout,
  UserCheck,
  Percent,
  RefreshCw,
  CreditCard,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Image3D } from "@/components/image-3d";

const firstGroupFeatures = [
  {
    icon: Package,
    title: "Quản lý sản phẩm",
    description:
      "Thông số thương hiệu, nhà cung cấp, bảo hành, VAT, giá mua/giá bán đầy đủ.",
  },
  {
    icon: RefreshCw,
    title: "Quản lý tồn kho",
    description:
      "Theo dõi tồn kho thực tế chi nhánh & kho tổng thời gian thực sau nhập/xuất hoặc bán hàng.",
  },
  {
    icon: Zap,
    title: "Bán hàng & POS",
    description:
      "POS quầy bán hàng tạo đơn nhanh, tính khuyến mãi, VAT & thanh toán linh hoạt.",
  },
  {
    icon: Layout,
    title: "Nhập xuất kho",
    description:
      "Theo dõi đơn nhập nhà cung cấp, xuất kho chi nhánh, chuyển kho và trạng thái đơn.",
  },
  {
    icon: CreditCard,
    title: "Quản lý gói dịch vụ",
    description:
      "Đăng ký các gói dịch vụ theo tháng/năm, thanh toán subscription và lịch sử đăng ký.",
  },
];

const secondGroupFeatures = [
  {
    icon: Users,
    title: "Quản lý khách hàng",
    description:
      "Lưu hồ sơ khách hàng, số điện thoại, email, lịch sử mua hàng, tổng chi tiêu chăm sóc tối ưu.",
  },
  {
    icon: UserCheck,
    title: "Nhân viên & Ca làm",
    description:
      "Quản lý thông tin nhân viên, phân ca làm việc, trạng thái làm việc tại từng chi nhánh.",
  },
  {
    icon: Percent,
    title: "Quản lý khuyến mãi",
    description:
      "Thiết lập chương trình giảm giá tự động theo sản phẩm hoặc chi nhánh linh hoạt.",
  },
  {
    icon: BarChart3,
    title: "Báo cáo & Thống kê",
    description:
      "Phân tích doanh thu, chi phí qua dashboard trực quan và xuất file báo cáo Excel.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 sm:py-32 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          <Badge variant="outline" className="mb-4">
            Hệ sinh thái tính năng
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Đầy đủ mọi module cần thiết để quản trị chuỗi cửa hàng
          </h2>
          <p className="text-lg text-muted-foreground">
            iKiot tích hợp sẵn các công cụ quản lý bán lẻ mạnh mẽ giúp bạn kiểm
            soát toàn bộ chuỗi cửa hàng công nghệ chỉ trên một nền tảng duy
            nhất.
          </p>
        </div>

        {/* First Feature Section */}
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-8 xl:gap-16 mb-24">
          {/* Left Image */}
          <Image3D
            lightSrc="/quan-ly-ton-kho-1.jpg"
            darkSrc="/quan-ly-ton-kho-1.jpg"
            alt="Vận hành cửa hàng và tồn kho"
            direction="left"
          />
          {/* Right Content */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
                Quản lý vận hành & tồn kho thời gian thực
              </h3>
              <p className="text-muted-foreground text-base text-pretty">
                Tối ưu hóa các quy trình cốt lõi tại cửa hàng. Mọi giao dịch
                nhập, xuất, bán hàng đều được tự động đồng bộ hóa kho tức thì.
              </p>
            </div>

            <ul className="grid gap-4 sm:grid-cols-2">
              {firstGroupFeatures.map((feature, index) => (
                <li
                  key={index}
                  className="group hover:bg-accent/5 flex items-start gap-3 p-2 rounded-lg transition-colors"
                >
                  <div className="mt-0.5 flex shrink-0 items-center justify-center">
                    <feature.icon
                      className="size-5 text-primary"
                      aria-hidden="true"
                    />
                  </div>
                  <div>
                    <h3 className="text-foreground font-medium">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {feature.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row gap-4 pe-4 pt-2">
              <Button size="lg" className="cursor-pointer" asChild>
                <a href="/sign-up" className="flex items-center">
                  Dùng thử ngay
                  <ArrowRight className="ms-2 size-4" aria-hidden="true" />
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* Second Feature Section - Flipped Layout */}
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-8 xl:gap-16 mb-24">
          {/* Left Content */}
          <div className="space-y-6 order-2 lg:order-1">
            <div className="space-y-4">
              <h3 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
                Quản trị chuỗi, nhân viên & chăm sóc khách hàng
              </h3>
              <p className="text-muted-foreground text-base text-pretty">
                Kết nối toàn bộ nhân lực và giữ chân khách hàng. Theo dõi lịch
                sử mua hàng, chi tiêu và phân ca làm việc chi nhánh chuẩn xác.
              </p>
            </div>

            <ul className="grid gap-4 sm:grid-cols-2">
              {secondGroupFeatures.map((feature, index) => (
                <li
                  key={index}
                  className="group hover:bg-accent/5 flex items-start gap-3 p-2 rounded-lg transition-colors"
                >
                  <div className="mt-0.5 flex shrink-0 items-center justify-center">
                    <feature.icon
                      className="size-5 text-primary"
                      aria-hidden="true"
                    />
                  </div>
                  <div>
                    <h3 className="text-foreground font-medium">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {feature.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row gap-4 pe-4 pt-2">
              <Button size="lg" className="cursor-pointer" asChild>
                <a href="#pricing" className="flex items-center">
                  Xem bảng giá gói
                  <ArrowRight className="ms-2 size-4" aria-hidden="true" />
                </a>
              </Button>
            </div>
          </div>

          {/* Right Image */}
          <Image3D
            lightSrc="/bo-phan-cham-soc-khach-hang.jpg"
            darkSrc="/bo-phan-cham-soc-khach-hang.jpg"
            alt="Quản trị khách hàng và báo cáo"
            direction="right"
            className="order-1 lg:order-2"
          />
        </div>

        {/* Third Feature Section - AI & Smart Analysis */}
        <div className="mt-24 rounded-2xl border bg-card/60 p-8 md:p-12 relative overflow-hidden group shadow-xl">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary/10 rounded-full blur-3xl -z-10 group-hover:bg-primary/15 transition-colors"></div>

          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
            <div className="space-y-6">
              <Badge
                variant="outline"
                className="border-primary text-primary flex items-center gap-1.5 w-fit"
              >
                <Sparkles className="size-3.5 fill-primary/20" />
                Công nghệ AI tiên tiến
              </Badge>

              <h3 className="text-3xl font-bold tracking-tight">
                Tổng hợp dữ liệu & Phân tích dự báo AI thông minh
              </h3>

              <p className="text-muted-foreground text-base leading-relaxed">
                Hệ thống tự động thu thập dữ liệu từ nhiều nguồn khác nhau (vận
                hành, người dùng, đối tác, API bên ngoài), sau đó làm sạch,
                chuẩn hóa và hợp nhất thành một kho dữ liệu thống nhất.
              </p>

              <p className="text-muted-foreground text-base leading-relaxed">
                Trên nền tảng dữ liệu này, iKiot áp dụng thuật toán phân tích
                (descriptive, diagnostic, predictive, prescriptive) và AI/ML để
                phát hiện xu hướng tiêu dùng, biến động thị trường và dự báo lãi
                lỗ.
              </p>

              <div className="grid gap-4 sm:grid-cols-2 pt-2">
                <div className="flex gap-2">
                  <TrendingUp className="size-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-foreground text-sm">
                      Cập nhật Hot Trend
                    </h4>
                    <p className="text-muted-foreground text-xs mt-1">
                      AI phát hiện sản phẩm công nghệ nào đang tăng trưởng nóng
                      để kịp thời nhập hàng.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Database className="size-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-foreground text-sm">
                      Lời khuyên nhập hàng & Chính sách
                    </h4>
                    <p className="text-muted-foreground text-xs mt-1">
                      Cảnh báo lãi lỗ chi nhánh và gợi ý các chính sách khuyến
                      mãi/giá bán tương lai.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative rounded-xl border bg-background/50 p-6 shadow-2xl backdrop-blur-xs flex flex-col justify-between min-h-[300px]">
              <div>
                <div className="flex items-center justify-between border-b pb-4 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="size-3 rounded-full bg-red-500" />
                    <div className="size-3 rounded-full bg-yellow-500" />
                    <div className="size-3 rounded-full bg-green-500" />
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">
                    iKiot AI Assistant v1.0
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="bg-muted/50 rounded-lg p-3 text-sm">
                    <p className="font-semibold text-primary text-xs flex items-center gap-1">
                      <Sparkles className="size-3 fill-primary/20" />
                      AI Khuyến Nghị Nhập Hàng
                    </p>
                    <p className="text-muted-foreground text-xs mt-1 leading-relaxed">
                      &quot;Dữ liệu bán hàng 30 ngày qua cho thấy dòng sản phẩm{" "}
                      <strong className="text-foreground">
                        Tai nghe Bluetooth Sony WH-1000XM5
                      </strong>{" "}
                      đang tăng trưởng doanh số 45% tại các chi nhánh và có xu
                      hướng tăng cao vào mùa hè. Lượng hàng tồn hiện tại chỉ còn
                      đủ bán trong 3 ngày. Bạn nên nhập thêm 50 chiếc để tối ưu
                      hóa doanh thu.&quot;
                    </p>
                  </div>

                  <div className="bg-primary/5 rounded-lg p-3 text-sm border border-primary/20">
                    <p className="font-semibold text-foreground text-xs">
                      📊 Dự báo Lãi & Lỗ & Lời khuyên chính sách
                    </p>
                    <p className="text-muted-foreground text-xs mt-1 leading-relaxed">
                      &quot;Doanh thu Laptop Gaming dự kiến giảm nhẹ 5% vào tháng tới
                      do tác động giảm giá từ đối thủ. Lời khuyên: Tạo chương
                      trình tặng kèm Chuột & Phím cơ Gaming thay vì giảm giá bán
                      để giữ biên lợi nhuận cao.&quot;
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t flex justify-end">
                <Button size="sm" className="cursor-pointer gap-2" asChild>
                  <a href="#contact">
                    Nhận tư vấn AI ngay
                    <ArrowRight className="size-3.5" />
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
