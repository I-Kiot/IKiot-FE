"use client";

import {
  Shield,
  BarChart3,
  Database,
  Building2,
  Rocket,
  Zap,
  Package,
  Layout,
  Crown,
  Palette,
} from "lucide-react";

const menuSections = [
  {
    title: "Tính năng cốt lõi",
    items: [
      {
        title: "Bán hàng & POS",
        description:
          "Tạo hóa đơn, tính tiền, áp dụng khuyến mãi & VAT tức thì tại quầy",
        icon: Package,
        href: "#features",
      },
      {
        title: "Quản lý tồn kho",
        description:
          "Theo dõi tồn kho chi nhánh & kho tổng real-time sau mỗi giao dịch",
        icon: Crown,
        href: "#features",
      },
      {
        title: "Quản lý sản phẩm",
        description:
          "Chi tiết thông số, giá bán/nhập, thương hiệu, bảo hành & VAT",
        icon: BarChart3,
        href: "#features",
      },
      {
        title: "Nhập xuất kho",
        description:
          "Theo dõi đơn nhập nhà cung cấp, luân chuyển kho chi nhánh chặt chẽ",
        icon: Layout,
        href: "#features",
      },
    ],
  },
  {
    title: "Quản trị chuỗi",
    items: [
      {
        title: "Khách hàng",
        description:
          "Hồ sơ khách hàng, lịch sử mua sắm và chăm sóc cá nhân hóa",
        icon: Building2,
        href: "#features",
      },
      {
        title: "Nhân viên & Ca làm",
        description:
          "Phân ca làm việc, chấm công và phân công chi nhánh tiện lợi",
        icon: Rocket,
        href: "#features",
      },
      {
        title: "Quản lý khuyến mãi",
        description:
          "Tự động áp dụng chiến dịch giảm giá theo sản phẩm/chi nhánh",
        icon: BarChart3,
        href: "#features",
      },
      {
        title: "Gói dịch vụ",
        description:
          "Đăng ký subscription linh hoạt theo tháng/năm tối ưu chi phí",
        icon: Shield,
        href: "#features",
      },
    ],
  },
  {
    title: "Dữ liệu & AI thông minh",
    items: [
      {
        title: "Báo cáo thống kê",
        description: "Dashboard doanh thu, lãi lỗ tức thì & xuất báo cáo Excel",
        icon: Database,
        href: "#features",
      },
      {
        title: "Tổng hợp dữ liệu",
        description: "Hợp nhất dữ liệu từ nhiều nguồn vận hành và API đối tác",
        icon: Palette,
        href: "#features",
      },
      {
        title: "AI dự báo xu hướng",
        description:
          "Phân tích sản phẩm trend, xu hướng mua sắm, đưa ra lời khuyên nhập hàng",
        icon: Zap,
        href: "#features",
      },
    ],
  },
];

export function MegaMenu() {
  return (
    <div className="w-[700px] max-w-[95vw] p-4 sm:p-6 lg:p-8 bg-background">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
        {menuSections.map((section) => (
          <div key={section.title} className="space-y-4 lg:space-y-6">
            {/* Section Header */}
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              {section.title}
            </h3>

            {/* Section Links */}
            <div className="space-y-3 lg:space-y-4">
              {section.items.map((item) => (
                <a
                  key={item.title}
                  href={item.href}
                  className="group block space-y-1 lg:space-y-2 hover:bg-accent rounded-md p-2 lg:p-3 -mx-2 lg:-mx-3 transition-colors my-0"
                >
                  <div className="flex items-center gap-2 lg:gap-3">
                    <item.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                      {item.title}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed ml-6 lg:ml-7">
                    {item.description}
                  </p>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
