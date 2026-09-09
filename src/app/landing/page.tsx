import type { Metadata } from 'next'
import { LandingPageContent } from './landing-page-content'

// Metadata for the landing page
export const metadata: Metadata = {
  title: 'iKiot - Hệ thống quản lý chuỗi cửa hàng điện tử & công nghệ thông minh',
  description: 'Hệ thống quản lý chuỗi cửa hàng chuyên đồ điện tử công nghệ giúp vận hành nhanh gọn, tối ưu chi phí và tích hợp công nghệ AI phân tích xu hướng mua hàng, lãi lỗ.',
  keywords: ['iKiot', 'quản lý chuỗi cửa hàng', 'phần mềm POS', 'quản lý bán hàng', 'quản lý tồn kho', 'phần mềm quản lý cửa hàng điện tử', 'phân tích AI bán lẻ'],
  openGraph: {
    title: 'iKiot - Hệ thống quản lý chuỗi cửa hàng điện tử & công nghệ thông minh',
    description: 'Thiết lập chuỗi cửa hàng bán lẻ điện tử công nghệ nhanh chóng, dễ dàng với chi phí dễ chịu và tối ưu doanh số nhờ phân tích AI dự báo xu hướng.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'iKiot - Hệ thống quản lý chuỗi cửa hàng điện tử & công nghệ thông minh',
    description: 'Thiết lập chuỗi cửa hàng bán lẻ điện tử công nghệ nhanh chóng, dễ dàng với chi phí dễ chịu và tối ưu doanh số nhờ phân tích AI dự báo xu hướng.',
  },
}

export default function LandingPage() {
  return <LandingPageContent />
}
