import { getMessaging, getToken, onMessage, isSupported, type MessagePayload } from 'firebase/messaging'
import { firebaseApp } from '@/lib/firebase'
import { notificationApi } from '@/lib/api/notification'

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY

// Token đang giữ, để logout còn biết đường gỡ khỏi backend.
let currentToken: string | null = null

// Cờ ghi user đã bật thông báo trên thiết bị này.
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

/** Trình duyệt có hỗ trợ FCM không. */
export async function isPushSupported(): Promise<boolean> {
  if (typeof window === 'undefined') return false
  if (!('serviceWorker' in navigator) || !('Notification' in window)) return false
  return isSupported()
}

/** Xin quyền, lấy FCM token rồi gửi về backend; chỉ gọi khi user bấm. */
export async function enablePushNotifications(): Promise<string | null> {
  if (!(await isPushSupported())) return null

  if (!VAPID_KEY) {
    console.warn('[fcm] Thiếu NEXT_PUBLIC_FIREBASE_VAPID_KEY')
    return null
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return null

  // Tự đăng ký service worker rồi truyền vào getToken.
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
    // Lấy lại token sau khi tải lại trang.
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

/** Nhận push khi tab đang mở, hiện toast; trả hàm huỷ. */
export function onForegroundMessage(
  handler: (payload: MessagePayload) => void,
): () => void {
  if (typeof window === 'undefined') return () => {}
  return onMessage(getMessaging(firebaseApp), handler)
}
