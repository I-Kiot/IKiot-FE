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

  // Chuyển trang YCSX cũ sang màn Nhập hàng.
  if (request.nextUrl.pathname === '/exchange/production-requests') {
    return NextResponse.redirect(new URL('/exchange/imports?source=WORKSHOP', request.url))
  }

  // Chuyển trang Danh sách cần sản xuất cũ sang popup, giữ tham số.
  if (request.nextUrl.pathname === '/exchange/production-list') {
    const target = new URL('/exchange/imports', request.url)
    request.nextUrl.searchParams.forEach((value, key) => target.searchParams.set(key, value))
    target.searchParams.set('source', 'WORKSHOP')
    target.searchParams.set('productionList', '1')
    return NextResponse.redirect(target)
  }

  // Chuyển trang Phiếu xưởng giao cũ sang màn Nhập hàng.
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
