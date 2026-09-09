"use client"

import { CircleHelp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'

type FaqItem = {
  value: string
  question: string
  answer: string
}

const faqItems: FaqItem[] = [
  {
    value: 'item-1',
    question: 'Khởi tạo 1 chi nhánh mới trên iKiot mất bao lâu?',
    answer:
      'Chỉ mất chưa đầy 5 phút! Bạn chỉ cần tạo chi nhánh mới trong trang quản trị, iKiot sẽ tự động khởi tạo cơ sở dữ liệu POS, đồng bộ danh mục sản phẩm từ kho tổng và thiết lập tài khoản cho nhân viên chi nhánh đó.',
  },
  {
    value: 'item-2',
    question: 'iKiot có hỗ trợ kết nối với các thiết bị phần cứng POS có sẵn không?',
    answer:
      'Có! POS của iKiot tương thích hoàn hảo với các thiết bị phổ biến hiện nay như máy in hóa đơn (K80, K57), máy quét mã vạch, ngăn kéo đựng tiền và máy POS cầm tay thông qua kết nối USB, Bluetooth hoặc Wifi.',
  },
  {
    value: 'item-3',
    question: 'Tính năng dự báo và lời khuyên nhập hàng bằng AI hoạt động ra sao?',
    answer:
      'Hệ thống AI của iKiot sẽ liên tục tổng hợp dữ liệu giao dịch bán hàng, lượng tồn kho thực tế, kết hợp với các dữ liệu thị trường bên ngoài. Từ đó, AI sử dụng các mô hình máy học dự đoán sản phẩm bán chạy (trend), tính toán thời gian hàng tồn còn lại và chủ động đưa ra khuyến nghị số lượng nhập hàng tối ưu cho bạn.',
  },
  {
    value: 'item-4',
    question: 'Tôi có thể quản lý khuyến mãi linh hoạt cho từng chi nhánh không?',
    answer:
      'Hoàn toàn được! iKiot cho phép bạn tạo chiến dịch khuyến mãi áp dụng riêng biệt cho một vài chi nhánh cụ thể hoặc áp dụng đồng loạt toàn hệ thống. Hệ thống POS tại chi nhánh được cấu hình sẽ tự động tính giảm giá khi thanh toán.',
  },
  {
    value: 'item-5',
    question: 'Chi phí đăng ký dịch vụ của iKiot như thế nào?',
    answer:
      'Chúng tôi cung cấp các gói dịch vụ cực kỳ dễ chịu chỉ từ 199.000đ/tháng. Không có chi phí ẩn, không mất phí cài đặt ban đầu và bạn có thể linh hoạt nâng cấp/hạ cấp gói dịch vụ bất kỳ lúc nào phù hợp với quy mô phát triển.',
  },
  {
    value: 'item-6',
    question: 'Dữ liệu kinh doanh chuỗi cửa hàng của tôi có được bảo mật an toàn?',
    answer:
      'iKiot đặt sự an toàn dữ liệu lên hàng đầu. Toàn bộ thông tin sản phẩm, khách hàng và giao dịch được mã hóa và lưu trữ trên hạ tầng đám mây an toàn, sao lưu tự động hàng ngày, đảm bảo hệ thống hoạt động liên tục 99.9%.',
  },
]

const FaqSection = () => {
  return (
    <section id="faq" className="py-24 sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          <Badge variant="outline" className="mb-4">Hỏi đáp</Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Câu hỏi thường gặp
          </h2>
          <p className="text-lg text-muted-foreground">
            Mọi điều bạn cần biết về hệ thống quản lý chuỗi iKiot, tính năng AI và cách thiết lập vận hành.
          </p>
        </div>

        {/* FAQ Content */}
        <div className="max-w-4xl mx-auto">
          <div className='bg-transparent'>
            <div className='p-0'>
              <Accordion type='single' collapsible className='space-y-5'>
                {faqItems.map(item => (
                  <AccordionItem key={item.value} value={item.value} className='rounded-md !border bg-transparent'>
                    <AccordionTrigger className='cursor-pointer items-center gap-4 rounded-none bg-transparent py-2 ps-3 pe-4 hover:no-underline data-[state=open]:border-b'>
                      <div className='flex items-center gap-4'>
                        <div className='bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-full'>
                          <CircleHelp className='size-5' />
                        </div>
                        <span className='text-start font-semibold'>{item.question}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className='p-4 bg-transparent'>{item.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>

          {/* Contact Support CTA */}
          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-4">
              Bạn vẫn còn câu hỏi khác? Chúng tôi luôn sẵn sàng hỗ trợ.
            </p>
            <Button className='cursor-pointer' asChild>
              <a href="#contact">
                Liên hệ tư vấn ngay
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

export { FaqSection }
