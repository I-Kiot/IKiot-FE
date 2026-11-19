import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Route cũ /login chuyển về /sign-in.
  if (request.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }
  
  // Route cũ /register chuyển về /sign-up.
  if (request.nextUrl.pathname === '/register') {
    return NextResponse.redirect(new URL('/sign-up', request.url))
  }

  // Yêu cầu sản xuất đã gộp vào màn Nhập hàng. Phải chuyển ở đây: guard của layout chỉ cho vào URL có trên sidebar nên page không được render.
  if (request.nextUrl.pathname === '/exchange/production-requests') {
    return NextResponse.redirect(new URL('/exchange/imports?source=WORKSHOP', request.url))
  }

  // Trang Danh sách cần sản xuất đã bỏ: nay là popup trong màn Nhập hàng (nguồn Xưởng), mở bằng `?productionList=1`.
  // Thông báo thiếu hàng của BE vẫn dẫn tới đường dẫn cũ kèm `locationId` / `productItemId`: giữ nguyên các tham số đó.
  if (request.nextUrl.pathname === '/exchange/production-list') {
    const target = new URL('/exchange/imports', request.url)
    request.nextUrl.searchParams.forEach((value, key) => target.searchParams.set(key, value))
    target.searchParams.set('source', 'WORKSHOP')
    target.searchParams.set('productionList', '1')
    return NextResponse.redirect(target)
  }

  // Trang Phiếu xưởng giao đã bỏ: nhận / từ chối phiếu nằm trong chi tiết yêu cầu sản xuất ở màn Nhập hàng (nguồn Xưởng).
  // Thông báo cũ của BE vẫn dẫn tới đường dẫn này.
  if (request.nextUrl.pathname === '/exchange/production-deliveries') {
    return NextResponse.redirect(new URL('/exchange/imports?source=WORKSHOP', request.url))
  }


  return NextResponse.next()
}

export const config = {
  matcher: [
    // Bỏ qua API routes, file tĩnh _next/static, _next/image và favicon.ico.
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
