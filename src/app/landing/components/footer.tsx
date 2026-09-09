"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Logo } from "@/components/logo";
import { Github, Twitter, Linkedin, Youtube } from "lucide-react";

const newsletterSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
});

const footerLinks = {
  product: [
    { name: "Tính năng", href: "#features" },
    { name: "Bảng giá", href: "#pricing" },
    { name: "Kết nối API", href: "#" },
    { name: "Tài liệu hướng dẫn", href: "#" },
  ],
  company: [
    { name: "Về iKiot", href: "#about" },
    { name: "Tin tức", href: "#blog" },
    { name: "Tuyển dụng", href: "#" },
    { name: "Liên hệ", href: "#contact" },
  ],
  resources: [
    { name: "Trung tâm hỗ trợ", href: "#" },
    { name: "Cộng đồng retail", href: "#" },
    { name: "Cẩm nang quản lý", href: "#" },
    { name: "Sự kiện trực tuyến", href: "#" },
  ],
  legal: [
    { name: "Bảo mật thông tin", href: "#" },
    { name: "Điều khoản dịch vụ", href: "#" },
    { name: "An ninh dữ liệu", href: "#" },
    { name: "Trạng thái hệ thống", href: "#" },
  ],
};

const socialLinks = [
  { name: "Twitter", href: "#", icon: Twitter },
  {
    name: "GitHub",
    href: "https://github.com/silicondeck/shadcn-dashboard-landing-template",
    icon: Github,
  },
  { name: "LinkedIn", href: "#", icon: Linkedin },
  { name: "YouTube", href: "#", icon: Youtube },
];

export function LandingFooter() {
  const form = useForm<z.infer<typeof newsletterSchema>>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: {
      email: "",
    },
  });

  function onSubmit(values: z.infer<typeof newsletterSchema>) {
    // Here you would typically send the email to your newsletter service
    console.log(values);
    // Show success message and reset form
    form.reset();
  }

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Newsletter Section */}
        <div className="mb-16">
          <div className="mx-auto max-w-2xl text-center">
            <h3 className="text-2xl font-bold mb-4">Đăng ký nhận bản tin</h3>
            <p className="text-muted-foreground mb-6">
              Nhận các hướng dẫn quản trị chuỗi bán lẻ và thông tin cập nhật
              tính năng mới nhất từ iKiot hàng tuần.
            </p>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col gap-2 max-w-md mx-auto sm:flex-row"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Nhập email của bạn..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="cursor-pointer">
                  Đăng ký
                </Button>
              </form>
            </Form>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="grid gap-8 grid-cols-4 lg:grid-cols-6">
          {/* Brand Column */}
          <div className="col-span-4 lg:col-span-2 max-w-2xl">
            <div className="flex items-center space-x-2 mb-4 max-lg:justify-center">
              <a
                href="/landing"
                className="flex items-center space-x-2 cursor-pointer"
              >
                <Logo size={32} />
                <span className="font-bold text-xl">iKiot</span>
              </a>
            </div>
            <p className="text-muted-foreground mb-6 max-lg:text-center max-lg:flex max-lg:justify-center">
              Hệ thống quản lý chuỗi cửa hàng chuyên bán lẻ điện tử & công nghệ
              thông minh hàng đầu Việt Nam. Vận hành nhanh gọn, tối ưu tồn kho
              và dự báo xu hướng bằng AI.
            </p>
            <div className="flex space-x-4 max-lg:justify-center">
              {socialLinks.map((social) => (
                <Button key={social.name} variant="ghost" size="icon" asChild>
                  <a
                    href={social.href}
                    aria-label={social.name}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <social.icon className="h-4 w-4" />
                  </a>
                </Button>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          <div className="max-md:col-span-2 lg:col-span-1">
            <h4 className="font-semibold mb-4">Sản phẩm</h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="max-md:col-span-2 lg:col-span-1">
            <h4 className="font-semibold mb-4">Công ty</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="max-md:col-span-2 lg:col-span-1">
            <h4 className="font-semibold mb-4">Tài nguyên</h4>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="max-md:col-span-2 lg:col-span-1">
            <h4 className="font-semibold mb-4">Pháp lý</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Bottom Footer */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-2">
          <div className="flex flex-col sm:flex-row items-center gap-2 text-muted-foreground text-sm">
            <div className="flex items-center gap-1">
              <span>Đồng hành phát triển cùng</span>
              <a
                href="/landing"
                className="font-semibold text-foreground hover:text-primary transition-colors cursor-pointer"
              >
                iKiot
              </a>
            </div>
            <span className="hidden sm:inline">•</span>
            <span>
              © {new Date().getFullYear()} Nền tảng quản lý chuỗi chuyên biệt
            </span>
          </div>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-4 md:mt-0">
            <a href="#" className="hover:text-foreground transition-colors">
              Chính sách bảo mật
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Điều khoản sử dụng
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Chính sách Cookie
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
