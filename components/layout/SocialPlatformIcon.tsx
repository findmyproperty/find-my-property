type SocialPlatformIconProps = {
  platform: "facebook" | "instagram";
  className?: string;
};

export function SocialPlatformIcon({
  platform,
  className,
}: SocialPlatformIconProps) {
  if (platform === "facebook") {
    return (
      <svg
        aria-hidden="true"
        className={className}
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M13.7 21v-7.1h2.4l.4-2.8h-2.8V9.3c0-.8.3-1.4 1.4-1.4h1.5V5.4c-.3 0-1.1-.1-2-.1-2.1 0-3.5 1.3-3.5 3.7v2.1H8.7v2.8h2.4V21h2.6z" />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}
