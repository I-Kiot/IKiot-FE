import { io, Socket } from 'socket.io-client';

import { getAccessToken } from '@/lib/auth';

let socket: Socket | null = null;

/** Kết nối Socket.IO duy nhất, gửi access token mỗi lần kết nối. */
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

/** Id socket hiện tại, gửi kèm mỗi request. */
export function currentSocketId(): string | undefined {
  return socket?.connected ? socket.id : undefined;
}

/** Ngắt socket để lần sau xác thực lại. */
export function resetSocket(): void {
  socket?.disconnect();
  socket = null;
}
