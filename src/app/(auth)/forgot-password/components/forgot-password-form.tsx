"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { OtpStep } from "@/components/otp-step";
import {
  resendOtp,
  resetPassword,
  verifyForgotPasswordOtp,
  type OtpChallenge,
} from "@/lib/api/auth";
import { getApiErrorBody } from "@/lib/api/error-codes";
import { EmailStep } from "./email-step";
import { NewPasswordStep } from "./new-password-step";

/** Lỗi khiến reset token không dùng lại được (hết hạn, đã dùng, sai loại, tài khoản bị khoá), nên phải xin OTP mới từ bước 1. */
const RESTART_CODES = new Set([
  "RESET_TOKEN_INVALID",
  "RESET_TOKEN_USED",
  "RESET_TOKEN_WRONG_TYPE",
  "ACCOUNT_NOT_FOUND_OR_LOCKED",
]);

const RESTART_NOTICE =
  "Phiên đặt lại mật khẩu đã hết hạn hoặc không còn hợp lệ. Vui lòng yêu cầu mã xác minh mới.";

/** Quên mật khẩu: nhập email → nhập OTP gửi tới email → đặt mật khẩu mới → về đăng nhập. */
export function ForgotPasswordForm2({ className }: { className?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [challenge, setChallenge] = useState<OtpChallenge | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const restart = (message: string | null) => {
    setResetToken(null);
    setChallenge(null);
    setNotice(message);
  };

  const onVerifyOtp = async (otpCode: string) => {
    if (!challenge) return;
    setResetToken(await verifyForgotPasswordOtp(challenge.challengeToken, otpCode));
  };

  const onResetPassword = async (newPassword: string) => {
    if (!resetToken) return;
    try {
      await resetPassword(resetToken, newPassword);
      toast.success("Đặt lại mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới.");
      router.replace(`/sign-in?identifier=${encodeURIComponent(email)}`);
    } catch (error) {
      const body = getApiErrorBody(error);
      if (body?.code && RESTART_CODES.has(body.code)) {
        restart(RESTART_NOTICE);
        return;
      }
      toast.error(body?.message || "Không đặt lại được mật khẩu. Vui lòng thử lại.");
    }
  };

  if (resetToken) {
    return (
      <NewPasswordStep className={className} email={email} onSubmit={onResetPassword} />
    );
  }

  if (challenge) {
    return (
      <OtpStep
        className={className}
        title="Xác minh email"
        submitLabel="Xác nhận"
        delivery={challenge}
        description={(sentTo) => (
          <>
            Nếu{" "}
            <span className="font-medium text-foreground">{sentTo}</span> đã
            được đăng ký, mã gồm 6 chữ số đã được gửi tới email này. Không thấy
            mã? Hãy kiểm tra thư rác hoặc kiểm tra lại email đã nhập.
          </>
        )}
        onSubmit={onVerifyOtp}
        onResend={() => resendOtp(challenge.challengeToken)}
        onBack={() => restart(null)}
      />
    );
  }

  return (
    <EmailStep
      className={className}
      defaultEmail={email}
      notice={notice}
      onSent={(sentTo, next) => {
        setEmail(sentTo);
        setNotice(null);
        setChallenge(next);
      }}
    />
  );
}
