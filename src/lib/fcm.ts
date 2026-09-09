import { getMessaging, getToken, onMessage, isSupported, type MessagePayload } from 'firebase/messaging'
import { firebaseApp } from '@/lib/firebase'
import { notificationApi } from '@/lib/api/notification'

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY

// Token đang giữ, để logout còn biết đường gỡ khỏi backend.
let currentToken: string | null = null

/**
 * FCM không chạy được ở mọi nơi: cần trình duyệt (không phải SSR), cần
 * ServiceWorker + Push API. Safari trên iOS chỉ hỗ trợ khi web app đã được
 * "Add to Home Screen". Luôn kiểm tra trước khi gọi bất cứ hàm nào bên dưới.
 */
export async function isPushSupported(): Promise<boolean> {
  if (typeof window === 'undefined') return false
  if (!('serviceWorker' in navigator) || !('Notification' in window)) return false
  return isSupported()
}

/**
 * Xin quyền, lấy FCM token, gửi về backend để lưu vào User.fcmTokens.
 *
 * Gọi hàm này từ một hành động có chủ đích của user (bấm nút "Bật thông báo"),
 * đừng gọi tự động lúc load trang: trình duyệt sẽ phạt nếu prompt quyền xuất
 * hiện mà không có tương tác, và user lỡ bấm "Chặn" thì không hỏi lại được nữa.
 *
 * @returns token nếu thành công, null nếu user từ chối hoặc trình duyệt không hỗ trợ
 */
export async function enablePushNotifications(): Promise<string | null> {
  if (!(await isPushSupported())) return null

  if (!VAPID_KEY) {
    console.warn('[fcm] Thiếu NEXT_PUBLIC_FIREBASE_VAPID_KEY')
    return null
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return null

  // Service worker phải đăng ký thủ công rồi truyền vào getToken. Nếu để Firebase
  // tự tìm, nó chỉ dò đúng đường dẫn mặc định /firebase-messaging-sw.js.
  const registration = await navigator.serviceWorker.register(
    '/firebase-messaging-sw.js',
  )

  const token = await getToken(getMessaging(firebaseApp), {
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration: registration,
  })

  if (!token) return null

  await notificationApi.registerDevice(token)
  currentToken = token
  return token
}

/** Gỡ device khỏi backend. Gọi khi logout, nếu không user sau vẫn nhận push của user trước. */
export async function disablePushNotifications(): Promise<void> {
  if (!currentToken) return
  try {
    await notificationApi.removeDevice(currentToken)
  } finally {
    currentToken = null
  }
}

/**
 * Nhận push khi tab đang mở và đang được focus.
 *
 * Lưu ý: lúc này service worker KHÔNG tự hiện popup - trình duyệt cố tình để
 * app tự quyết. Đó là chỗ nên bắn toast thay vì notification hệ thống.
 *
 * @returns hàm unsubscribe
 */
export function onForegroundMessage(
  handler: (payload: MessagePayload) => void,
): () => void {
  if (typeof window === 'undefined') return () => {}
  return onMessage(getMessaging(firebaseApp), handler)
}
