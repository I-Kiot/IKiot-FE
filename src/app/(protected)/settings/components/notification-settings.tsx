"use client";

import * as React from "react";
import { BellRing, Volume2 } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  disablePushNotifications,
  enablePushNotifications,
  isPushEnabledHere,
  isPushSupported,
} from "@/lib/fcm";
import {
  isNotificationSoundMuted,
  playNotificationSound,
  setNotificationSoundMuted,
} from "@/lib/notification-sound";

/**
 * Hai thứ duy nhất đang có tác dụng thật: đăng ký thiết bị nhận push (FCM) và âm báo
 * khi có thông báo mới. Các tuỳ chọn theo loại thông báo chưa có phía BE nên không hiện ở đây.
 */
export function NotificationSettings() {
  // Tab này chỉ render sau khi trang cài đặt đã tải xong ở client, nên đọc localStorage được ngay.
  const [soundOn, setSoundOn] = React.useState(() => !isNotificationSoundMuted());
  const handleSoundChange = (checked: boolean) => {
    setSoundOn(checked);
    setNotificationSoundMuted(!checked);
    // Phát thử để người dùng biết âm thanh nghe như thế nào.
    if (checked) playNotificationSound();
  };

  const [pushOn, setPushOn] = React.useState(() => isPushEnabledHere());
  const [isPushBusy, setIsPushBusy] = React.useState(false);

  const handlePushChange = async (checked: boolean) => {
    setIsPushBusy(true);
    try {
      if (checked) {
        if (!(await isPushSupported())) {
          toast.error("Trình duyệt này không hỗ trợ thông báo đẩy");
          return;
        }
        const token = await enablePushNotifications();
        if (token) {
          setPushOn(true);
          toast.success("Đã bật thông báo đẩy trên thiết bị này");
        } else {
          toast.error(
            "Không thể bật thông báo. Vui lòng kiểm tra quyền thông báo của trình duyệt.",
          );
        }
      } else {
        await disablePushNotifications();
        setPushOn(false);
        toast.success("Đã tắt thông báo đẩy trên thiết bị này");
      }
    } catch (err) {
      console.error("Failed to toggle push notifications:", err);
      toast.error("Đã xảy ra lỗi khi thay đổi thông báo đẩy");
    } finally {
      setIsPushBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-primary" /> Âm báo
          </CardTitle>
          <CardDescription className="text-xs">
            Phát tiếng khi có thông báo mới trong lúc bạn đang mở ứng dụng.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <div className="text-sm">Phát âm thanh khi có thông báo</div>
          <Switch checked={soundOn} onCheckedChange={handleSoundChange} />
        </CardContent>
      </Card>

      <Card className="border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <BellRing className="h-4 w-4 text-primary" /> Thông báo đẩy
          </CardTitle>
          <CardDescription className="text-xs">
            Nhận thông báo ngay cả khi bạn không mở ứng dụng. Cần bật riêng trên từng
            trình duyệt hoặc thiết bị.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <div className="text-sm">Nhận thông báo đẩy trên thiết bị này</div>
          <Switch
            checked={pushOn}
            onCheckedChange={handlePushChange}
            disabled={isPushBusy}
          />
        </CardContent>
      </Card>
    </div>
  );
}
