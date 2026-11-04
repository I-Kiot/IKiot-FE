import { io, Socket } from 'socket.io-client';

import { getAccessToken } from '@/lib/auth';

let socket: Socket | null = null;

/**
 * Kết nối Socket.IO duy nhất. Handshake **phải** mang access token: backend verify JWT và disconnect nếu thiếu,
 * khi đó realtime (thông báo, xác nhận thanh toán) ngừng âm thầm.
 *
 * `auth` là hàm để socket.io gọi lại mỗi lần reconnect, lấy đúng token mới sau khi token đã xoay vòng.
 */
export function getSocket(): Socket {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3003', {
      autoConnect: true,
      reconnection: true,
      auth: (cb) => cb({ token: getAccessToken() ?? '' }),
    });
  }
  return socket;
}

/**
 * Ngắt kết nối để `getSocket()` kế tiếp xác thực lại. Room được join phía server theo token đã verify,
 * nên socket sống lâu hơn session mở nó; không ngắt thì đăng nhập user khác vẫn nhận thông báo của user trước.
 */
export function resetSocket(): void {
  socket?.disconnect();
  socket = null;
}
