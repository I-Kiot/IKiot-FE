"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Mail, MessageCircle, BookOpen } from "lucide-react";

const contactFormSchema = z.object({
  firstName: z.string().min(2, {
    message: "Họ phải có ít nhất 2 ký tự.",
  }),
  lastName: z.string().min(2, {
    message: "Tên phải có ít nhất 2 ký tự.",
  }),
  email: z.string().email({
    message: "Vui lòng nhập email hợp lệ.",
  }),
  subject: z.string().min(5, {
    message: "Chủ đề phải có ít nhất 5 ký tự.",
  }),
  message: z.string().min(10, {
    message: "Lời nhắn phải có ít nhất 10 ký tự.",
  }),
});

export function ContactSection() {
  const form = useForm<z.infer<typeof contactFormSchema>>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  function onSubmit(values: z.infer<typeof contactFormSchema>) {
    // Here you would typically send the form data to your backend
    console.log(values);
    // You could also show a success message or redirect
    form.reset();
  }

  return (
    <section id="contact" className="py-24 sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <Badge variant="outline" className="mb-4">
            Liên hệ với iKiot
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Cần tư vấn hoặc giải đáp thắc mắc?
          </h2>
          <p className="text-lg text-muted-foreground">
            Đội ngũ chuyên gia của iKiot luôn sẵn sàng đồng hành cùng bạn thiết
            lập chuỗi cửa hàng bán lẻ công nghệ tối ưu nhất.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Contact Options */}
          <div className="space-y-6 order-2 lg:order-1">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  Tổng đài tư vấn 24/7
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-3">
                  Liên hệ hotline tư vấn trực tiếp và nhận bản demo miễn phí cho
                  chuỗi cửa hàng.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                  asChild
                >
                  <a href="tel:1900xxxx">Gọi hotline: 1900 xxxx</a>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Tài liệu Hướng dẫn
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-3">
                  Xem chi tiết cách cài đặt POS, đồng bộ phần cứng in hóa đơn và
                  quét mã vạch.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                  asChild
                >
                  <a href="#">Xem hướng dẫn</a>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  Email hỗ trợ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-3">
                  Gửi yêu cầu hỗ trợ kỹ thuật hoặc đề xuất tính năng trực tiếp
                  đến hòm thư iKiot.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                  asChild
                >
                  <a href="mailto:support@ikiot.vn">support@ikiot.vn</a>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Gửi lời nhắn cho chúng tôi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Họ</FormLabel>
                            <FormControl>
                              <Input placeholder="Nguyễn" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tên</FormLabel>
                            <FormControl>
                              <Input placeholder="Văn A" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email liên hệ</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="nguyenvana@gmail.com"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Chủ đề cần tư vấn</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Tư vấn gói chuỗi 3 cửa hàng, tích hợp AI, POS..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lời nhắn</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Hãy cho chúng tôi biết nhu cầu hoặc thắc mắc của bạn về quản lý chuỗi bán lẻ công nghệ..."
                              rows={10}
                              className="min-h-50"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full cursor-pointer">
                      Gửi lời nhắn
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
