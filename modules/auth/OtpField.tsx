"use client";

import { useEffect, useRef } from "react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export const OTP_SLOT_CLASS =
  "h-12 flex-1 min-w-0 max-w-12 rounded-xl border border-input shadow-sm first:rounded-xl last:rounded-xl first:border-l";

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
    <div className="space-y-2 overflow-hidden">
      <label className="ml-1 text-sm font-medium leading-none text-foreground">
        One-Time Password
      </label>
      <InputOTP
        ref={otpInputRef}
        maxLength={6}
        value={value}
        onChange={onChange}
        disabled={disabled}
        containerClassName="w-full"
        autoFocus
      >
        <InputOTPGroup className="w-full gap-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <InputOTPSlot key={index} index={index} className={OTP_SLOT_CLASS} />
          ))}
        </InputOTPGroup>
      </InputOTP>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
