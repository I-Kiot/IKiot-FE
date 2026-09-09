"use client";

import { useCallback, useState } from "react";
import { sendOtpRequest } from "@/lib/api/auth";

/**
 * Drives the registration OTP flow. The backend generates + sends the OTP via
 * eSMS (see /auth/send-otp) and verifies the entered code at /auth/register,
 * so the client only needs to trigger the send and collect the code.
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
