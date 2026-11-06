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


  return NextResponse.next()
}

export const config = {
  matcher: [
    // Bỏ qua API routes, file tĩnh _next/static, _next/image và favicon.ico.
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
