"use client";

import { useCallback, useState } from "react";
import { sendOtpRequest } from "@/lib/api/auth";

/**
 * Điều khiển luồng OTP đăng ký. Backend tạo và gửi OTP qua eSMS (/auth/send-otp), rồi xác thực mã tại /auth/register;
 * client chỉ cần kích hoạt gửi và thu thập mã.
 */
export function usePhoneOtp() {
  const [isSending, setIsSending] = useState(false);

  const sendOtp = useCallback(async (phoneNumber: string) => {
    setIsSending(true);
    try {
      await sendOtpRequest(phoneNumber);
    } finally {
      setIsSending(false);
    }
  }, []);

  return { sendOtp, isSending };
}
