"use client";

import Link from "next/link";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserAvatar } from "@/components/user-avatar";
import { useAuth } from "@/contexts/auth-context";
import ThemeToggle from "@/components/ThemeToggle";

interface DashboardHeaderProps {
  title?: string;
}

export default function DashboardHeader({ title }: DashboardHeaderProps) {
  const { user } = useAuth();

  return (
    <header className="h-14 flex items-center justify-between border-b border-border px-4 bg-card/50 backdrop-blur-sm sticky top-0 z-30 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <SidebarTrigger className="shrink-0" />
        {title && (
          <h1 className="font-heading font-semibold text-lg text-foreground truncate">
            {title}
          </h1>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <ThemeToggle />
        {user && (
          <>
            <Link
              href="/profile"
              className="flex items-center gap-2 rounded-full p-1 pr-2 hover:bg-muted/50 transition-colors min-w-0"
            >
              <UserAvatar
                name={user.name}
                avatarUrl={user.avatarUrl}
                className="h-8 w-8 shrink-0"
                fallbackClassName="text-xs"
              />
              <span className="hidden sm:inline text-sm font-medium text-foreground truncate max-w-[120px]">
                {user.name}
              </span>
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
