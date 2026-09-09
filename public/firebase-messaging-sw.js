/* eslint-disable no-undef */
// Service worker cho FCM - nhận push khi tab đã đóng hoặc chạy nền.
//
// File này KHÔNG đi qua bundler của Next.js, nên không đọc được process.env:
// config buộc phải hardcode. Đây là web config công khai (giống hệt các biến
// NEXT_PUBLIC_* trong .env), không phải service account - tuyệt đối không dán
// FIREBASE_PRIVATE_KEY vào đây.
//
// Dùng bản "compat" vì service worker không hỗ trợ ES module import.
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyD5loWE4eQZC3MtNiU8YcU71bSdpYJ25D0",
  authDomain: "ikiot-70cce.firebaseapp.com",
  projectId: "ikiot-70cce",
  storageBucket: "ikiot-70cce.firebasestorage.app",
  messagingSenderId: "579327926276",
  appId: "1:579327926276:web:30b4559738b7ff2d1cd551",
});

const messaging = firebase.messaging();

// Chỉ chạy khi app KHÔNG được focus. Lúc app đang mở, onForegroundMessage
// trong src/lib/fcm.ts nhận thay.
messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {};

  self.registration.showNotification(title || "iKiot", {
    body: body || "",
    icon: "/placeholder-product.svg",
    data: payload.data || {},
  });
});

// Bấm vào thông báo: focus tab đang mở nếu có, không thì mở tab mới.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const link = event.notification.data?.link || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) {
            client.navigate(link);
            return client.focus();
          }
        }
        return self.clients.openWindow(link);
      }),
  );
});
