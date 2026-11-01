"use client";

type AuthPhoneLabelProps = {
  locked?: boolean;
  onEdit?: () => void;
  label?: string;
};

/** Phone field label with optional Edit when the number is locked after OTP send. */
export function AuthPhoneLabel({
  locked = false,
  onEdit,
  label = "Phone Number",
}: AuthPhoneLabelProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <label className="ml-1 text-sm font-medium leading-none text-foreground">{label}</label>
      {locked && onEdit ? (
        <button
          type="button"
          onClick={onEdit}
          className="text-sm font-medium text-primary transition-colors hover:underline"
        >
          Edit
        </button>
      ) : null}
    </div>
  );
}
