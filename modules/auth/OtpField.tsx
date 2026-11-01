"use client";

import { useEffect, useRef } from "react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export const OTP_SLOT_CLASS =
  "h-12 w-full min-w-0 rounded-xl border border-input shadow-sm ring-offset-0 first:rounded-xl last:rounded-xl first:border-l";

type OtpFieldProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  /** When true, focus the OTP input (e.g. after send). */
  active?: boolean;
  hint?: string;
};

export function OtpField({
  value,
  onChange,
  disabled,
  active = true,
  hint,
}: OtpFieldProps) {
  const otpInputRef = useRef<React.ElementRef<typeof InputOTP>>(null);

  useEffect(() => {
    if (!active) return;
    const t = window.setTimeout(() => otpInputRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [active]);

  return (
    <div className="w-full space-y-2">
      <label className="ml-1 text-sm font-medium leading-none text-foreground">
        One-Time Password
      </label>
      {/* Inset padding so the active ring stays inside the dialog without causing overflow scroll */}
      <div className="min-w-0 w-full py-1">
        <InputOTP
          ref={otpInputRef}
          maxLength={6}
          value={value}
          onChange={onChange}
          disabled={disabled}
          containerClassName="w-full gap-0"
          autoFocus
        >
          <InputOTPGroup className="grid w-full min-w-0 grid-cols-6 gap-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <InputOTPSlot key={index} index={index} className={OTP_SLOT_CLASS} />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
