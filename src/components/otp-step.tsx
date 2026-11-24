"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { getApiErrorBody } from "@/lib/api/error-codes";
import type { OtpChallenge } from "@/lib/api/auth";

// Khi bật, bước OTP tự gửi `DEV_BYPASS` (backend chỉ nhận ngoài production), nên site dev không cần email thật.
const OTP_BYPASS = process.env.NEXT_PUBLIC_OTP_BYPASS === "true";
const OTP_LENGTH = 6;

/** Phần thông tin gửi mã mà cả thử thách lẫn "gửi lại" đều trả về. */
export type OtpDelivery = Pick<
  OtpChallenge,
  "sentTo" | "expiresInSeconds" | "resendAfterSeconds"
>;

interface OtpStepProps {
  title: string;
  /** Nhãn nút xác nhận. */
  submitLabel: string;
  delivery: OtpDelivery;
  /** Gọi API xác thực; ném lỗi (axios) nếu mã sai. Thành công thì cha tự chuyển bước. */
  onSubmit: (otpCode: string) => Promise<void>;
  /** Gọi API gửi lại mã. */
  onResend: () => Promise<OtpDelivery>;
  /** Quay lại bước trước (cũng dùng khi phiên xác minh không còn hợp lệ). */
  onBack: () => void;
  className?: string;
}

function formatClock(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Đếm ngược theo giây tới một mốc thời gian. */
function useSecondsLeft(deadline: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}

/**
 * Bước nhập mã OTP gửi qua email, dùng chung cho đăng ký, đăng nhập lần đầu và quên mật khẩu.
 * Hiện email đã che, đếm ngược hạn mã, nút "Gửi lại mã" khoá theo `resendAfterSeconds`.
 */
export function OtpStep({
  title,
  submitLabel,
  delivery,
  onSubmit,
  onResend,
  onBack,
  className,
}: OtpStepProps) {
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [current, setCurrent] = useState<OtpDelivery>(delivery);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [hint, setHint] = useState<string | null>(null);
  const bypassed = useRef(false);

  const expiresIn = useSecondsLeft(startedAt + current.expiresInSeconds * 1000);
  const resendIn = useSecondsLeft(startedAt + current.resendAfterSeconds * 1000);

  const submit = useCallback(
    async (value: string) => {
      setIsSubmitting(true);
      setHint(null);
      try {
        await onSubmit(value);
      } catch (error) {
        const body = getApiErrorBody(error);
        toast.error(body?.message || "Xác minh thất bại. Vui lòng thử lại.");
        setCode("");
        if (body?.code === "OTP_INVALID" && typeof body.attemptsLeft === "number") {
          setHint(`Còn ${body.attemptsLeft} lần thử.`);
        }
        // Phiên xác minh hỏng hẳn: không còn gì để nhập tiếp, đưa người dùng về bước trước.
        if (body?.code === "OTP_CHALLENGE_INVALID") onBack();
      } finally {
        setIsSubmitting(false);
      }
    },
    [onSubmit, onBack],
  );

  // Dev bypass: gửi mã giả đúng một lần khi bước OTP mở ra.
  useEffect(() => {
    if (!OTP_BYPASS || bypassed.current) return;
    bypassed.current = true;
    void submit("DEV_BYPASS");
  }, [submit]);

  const handleResend = async () => {
    setIsResending(true);
    try {
      const next = await onResend();
      setCurrent(next);
      setStartedAt(Date.now());
      setCode("");
      setHint(null);
      toast.success("Đã gửi lại mã OTP.");
    } catch (error) {
      const body = getApiErrorBody(error);
      toast.error(body?.message || "Không gửi lại được mã OTP. Vui lòng thử lại.");
      if (body?.code === "OTP_CHALLENGE_INVALID") onBack();
    } finally {
      setIsResending(false);
    }
  };

  const busy = isSubmitting || isResending;

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Nhập mã gồm 6 chữ số đã gửi đến email{" "}
          <span className="font-medium text-foreground">{current.sentTo}</span>
        </p>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="otpCode">Mã OTP</Label>
        <Input
          id="otpCode"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={OTP_LENGTH}
          placeholder="000000"
          className="text-center text-lg tracking-[0.5em]"
          value={code}
          onChange={(e) =>
            setCode(e.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH))
          }
          onKeyDown={(e) => {
            if (e.key === "Enter" && code.length === OTP_LENGTH && !busy) {
              void submit(code);
            }
          }}
          disabled={busy}
          autoFocus
        />
        {hint && <p className="text-xs font-medium text-destructive">{hint}</p>}
        <p
          className={cn(
            "text-xs tabular-nums",
            expiresIn === 0 ? "font-medium text-destructive" : "text-muted-foreground",
          )}
        >
          {expiresIn === 0
            ? "Mã đã hết hạn. Vui lòng gửi lại mã."
            : `Mã hết hạn sau ${formatClock(expiresIn)}`}
        </p>
      </div>

      <Button
        type="button"
        className="w-full cursor-pointer"
        onClick={() => submit(code)}
        disabled={busy || code.length < OTP_LENGTH}
      >
        {isSubmitting ? "Đang xác thực..." : submitLabel}
      </Button>

      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={onBack}
          disabled={busy}
          className="underline underline-offset-4 hover:text-primary disabled:opacity-50"
        >
          Quay lại
        </button>
        <button
          type="button"
          onClick={handleResend}
          disabled={busy || resendIn > 0}
          className="underline underline-offset-4 hover:text-primary disabled:no-underline disabled:opacity-50"
        >
          {isResending
            ? "Đang gửi lại..."
            : resendIn > 0
              ? `Gửi lại mã (${resendIn}s)`
              : "Gửi lại mã"}
        </button>
      </div>
    </div>
  );
}
