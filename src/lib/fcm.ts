import { getMessaging, getToken, onMessage, isSupported, type MessagePayload } from 'firebase/messaging'
import { firebaseApp } from '@/lib/firebase'
import { notificationApi } from '@/lib/api/notification'

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY

// Token đang giữ, để logout còn biết đường gỡ khỏi backend.
let currentToken: string | null = null

// Trình duyệt chỉ biết "đã cho phép thông báo" chứ không biết thiết bị này có đang
// đăng ký với backend hay không (gỡ device không thu hồi quyền). Cờ này ghi lại ý
// định của user để công tắc trong cài đặt và logout dùng chung.
const ENABLED_FLAG = 'ikiot:push-enabled'

function setEnabledFlag(on: boolean) {
  try {
    if (on) localStorage.setItem(ENABLED_FLAG, '1')
    else localStorage.removeItem(ENABLED_FLAG)
  } catch {
    // storage bị chặn: công tắc sẽ về trạng thái tắt sau khi tải lại
  }
}

/** Thiết bị này đang được user bật push (và trình duyệt vẫn cho phép). Đọc đồng bộ, không gọi mạng. */
export function isPushEnabledHere(): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) return false
  if (Notification.permission !== 'granted') return false
  try {
    return localStorage.getItem(ENABLED_FLAG) === '1'
  } catch {
    return false
  }
}

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
  setEnabledFlag(true)
  return token
}

/** Gỡ device khỏi backend. Gọi khi logout, nếu không user sau vẫn nhận push của user trước. */
export async function disablePushNotifications(): Promise<void> {
  try {
    // Sau khi tải lại trang biến trong bộ nhớ đã mất; quyền đã cấp nên getToken trả
    // đúng token cũ mà không hỏi lại user.
    let token = currentToken
    if (!token && isPushEnabledHere() && VAPID_KEY && (await isPushSupported())) {
      const registration = await navigator.serviceWorker.register(
        '/firebase-messaging-sw.js',
      )
      token = await getToken(getMessaging(firebaseApp), {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration,
      })
    }
    if (token) await notificationApi.removeDevice(token)
  } finally {
    currentToken = null
    setEnabledFlag(false)
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
