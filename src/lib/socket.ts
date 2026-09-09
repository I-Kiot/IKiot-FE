import { io, Socket } from 'socket.io-client';

import { getAccessToken } from '@/lib/auth';

let socket: Socket | null = null;

/**
 * The one Socket.IO connection.
 *
 * **The handshake must carry the access token.** The rewritten backend verifies the JWT in
 * `handleConnection` and calls `disconnect(true)` when there isn't one - the old Express
 * server accepted anonymous sockets, so this file connected without credentials and every
 * realtime feature (payment confirmation at the till, plan activation, the notification
 * inbox) silently stopped working against the new API.
 *
 * `auth` is passed as a **function**, not an object: socket.io re-invokes it on every
 * reconnect, so a socket that drops after the access token has rotated comes back with the
 * current one instead of the token it happened to be created with.
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
 * Drops the connection so the next `getSocket()` authenticates afresh.
 *
 * Rooms are joined server-side from the verified token, so a socket outlives the session
 * that opened it: without this, signing out and back in as somebody else keeps delivering
 * the previous account's notifications over the old connection.
 */
export function resetSocket(): void {
  socket?.disconnect();
  socket = null;
}
