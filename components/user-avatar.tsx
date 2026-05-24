"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

function initialsFromName(name: string): string {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U"
  );
}

type UserAvatarProps = {
  name: string;
  avatarUrl?: string | null;
  className?: string;
  fallbackClassName?: string;
  imageClassName?: string;
};

export function UserAvatar({
  name,
  avatarUrl,
  className,
  fallbackClassName,
  imageClassName,
}: UserAvatarProps) {
  const initials = initialsFromName(name);

  return (
    <Avatar className={className}>
      {avatarUrl ? (
        <AvatarImage
          key={avatarUrl}
          src={avatarUrl}
          alt={name}
          className={cn("object-cover", imageClassName)}
        />
      ) : null}
      <AvatarFallback className={cn("bg-primary/10 text-primary", fallbackClassName)}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
